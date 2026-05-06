"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedReceiptData {
  storeName: string;
  amount: number;
  currency: string; // ISO 4217 e.g. "INR", "USD"
  amountInUSD: number;
  category: string;
  warrantyMonths: number;
  expiryDate: string | null; // ISO date string or null
  confidence: "high" | "medium" | "low";
}

const RATE_CACHE: Record<string, { rate: number, timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour

// Simple in-memory skip list for models hitting quota
const SKIP_MODELS = new Map<string, number>();

/**
 * Converts a detected currency amount to USD using the Frankfurter API.
 * Falls back to the original amount if conversion fails.
 */
export async function convertCurrencyToUSD(amount: number, fromCurrency: string): Promise<number> {
  const currency = fromCurrency.toUpperCase();
  if (currency === "USD") return amount;

  const now = Date.now();
  if (RATE_CACHE[currency] && (now - RATE_CACHE[currency].timestamp) < CACHE_TTL) {
    return parseFloat((amount * RATE_CACHE[currency].rate).toFixed(6));
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${currency}&to=USD`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error("Exchange rate fetch failed");
    const data = await response.json();
    const rate = data?.rates?.USD;
    if (!rate) throw new Error("No USD rate found");
    
    RATE_CACHE[currency] = { rate, timestamp: now };
    return parseFloat((amount * rate).toFixed(6));
  } catch (e) {
    console.warn(`[extractReceipt] Currency conversion failed (${currency} → USD), using original amount.`, e);
    return amount;
  }
}

/**
 * Extracts structured data from a receipt image using Gemini Vision.
 */
export async function extractReceiptData(formData: FormData): Promise<{
  success: boolean;
  data?: ExtractedReceiptData;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No image file provided.");

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[extractReceipt] GEMINI_API_KEY is missing. Available env keys:", Object.keys(process.env).filter(k => !k.includes("SECRET") && !k.includes("KEY")));
      throw new Error("GEMINI_API_KEY is not configured. Please check your .env.local file and restart the server.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Filter out models that are currently in the skip list
    const allModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    const modelsToTry = allModels.filter(m => !SKIP_MODELS.has(m) || SKIP_MODELS.get(m)! < Date.now());
    
    // If all models are skipped, reset and try the primary one
    const finalModels = modelsToTry.length > 0 ? modelsToTry : ["gemini-2.5-flash"];

    let lastError = null;
    let apiResponse = null;

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `You are an expert receipt and transaction parser. Analyze this image (paper receipt, mobile wallet screenshot, UPI, or digital invoice) and extract information as a JSON object.

Return a JSON object with these exact fields:
{
  "storeName": "Name of store/receiver",
  "amount": total amount as a number,
  "currency": "ISO 4217 code (e.g. INR, USD)",
  "category": "One of: Groceries, Electronics, Dining, Transport, Retail, Other",
  "warrantyMonths": number of warranty months or 0,
  "expiryDate": "ISO date string or null",
  "confidence": "high, medium, or low"
}

Rules:
- For UPI/Paytm/GPay, 'storeName' is the receiver.
- Default currency to INR for UPI screenshots if not visible.`;

    for (const modelName of finalModels) {
      try {
        console.log(`[extractReceipt] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        apiResponse = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ]);

        if (apiResponse && apiResponse.response) {
          const text = apiResponse.response.text();
          if (text) break;
        }
      } catch (e: any) {
        console.warn(`[extractReceipt] Model ${modelName} failed: ${e.message || e}`);
        if (e.message?.includes("429") || e.message?.includes("quota")) {
           console.log(`[extractReceipt] Model ${modelName} hitting quota. Skipping for 5 minutes.`);
           SKIP_MODELS.set(modelName, Date.now() + 300000); 
        }
        lastError = e;
      }
    }

    if (!apiResponse) {
      throw lastError || new Error("All Gemini models failed to respond.");
    }

    const responseText = apiResponse.response.text().trim();
    console.log(`[extractReceipt] Raw response: ${responseText}`);

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleanJson);
    }

    // Validate and normalize
    const extracted = {
      storeName: String(parsed.storeName || "Unknown Store"),
      amount: parseFloat(parsed.amount) || 0,
      currency: String(parsed.currency || "USD").toUpperCase(),
      category: ["Groceries", "Electronics", "Dining", "Transport", "Retail", "Other"].includes(parsed.category)
        ? parsed.category
        : "Other",
      warrantyMonths: parseInt(parsed.warrantyMonths) || 0,
      expiryDate: parsed.expiryDate || null,
      confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium",
    };

    const amountInUSD = await convertCurrencyToUSD(extracted.amount, extracted.currency);

    return {
      success: true,
      data: { ...extracted, amountInUSD },
    };
  } catch (error: any) {
    console.error("[extractReceipt] Final Error:", error);
    let errorMessage = error.message || "Unknown error during extraction";
    
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      errorMessage = "Gemini API quota exceeded. Please try again in a few minutes.";
    } else if (errorMessage.includes("503")) {
      errorMessage = "Gemini servers are currently overloaded. Please retry in a moment.";
    }

    return { success: false, error: errorMessage };
  }
}
