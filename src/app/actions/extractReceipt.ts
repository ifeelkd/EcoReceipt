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

/**
 * Converts a detected currency amount to USD using the Frankfurter API.
 * Falls back to the original amount if conversion fails.
 */
export async function convertCurrencyToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === "USD") return amount;
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCurrency.toUpperCase()}&to=USD`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error("Exchange rate fetch failed");
    const data = await response.json();
    const rate = data?.rates?.USD;
    if (!rate) throw new Error("No USD rate found");
    return parseFloat((amount * rate).toFixed(6));
  } catch (e) {
    console.warn(`[extractReceipt] Currency conversion failed (${fromCurrency} → USD), using original amount.`, e);
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;
    let apiResponse = null;

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `You are an expert receipt and transaction parser. Analyze this image (which could be a paper receipt, mobile wallet screenshot, UPI transaction confirmation, or digital invoice) and extract the following information as a valid JSON object. Be concise and precise.

Return ONLY the JSON object with these exact fields:
{
  "storeName": "<name of the store, merchant, receiver, or 'Unknown Store' if not visible>",
  "amount": <total amount as a number, e.g. 45.99 — use the final payable amount or sent amount>,
  "currency": "<ISO 4217 currency code, e.g. INR, USD, EUR, GBP — infer from currency symbols like ₹=INR, $=USD, €=EUR, £=GBP. If no symbol is visible, default to INR for UPI screenshots, otherwise USD>",
  "category": "<one of exactly: Groceries, Electronics, Dining, Transport, Retail, Other>",
  "warrantyMonths": <number of warranty months if a product is mentioned, otherwise 0>,
  "expiryDate": "<ISO date string if an expiry/warranty date is visible, e.g. '2027-04-29', otherwise null>",
  "confidence": "<'high' if all fields are clearly readable, 'medium' if partially readable, 'low' if image is unclear>"
}

Rules:
- For mobile payment receipts (like UPI, Paytm, GPay), the 'storeName' is the receiver name or merchant.
- If amount is not visible, use 0.
- Choose the closest matching category.
- Do NOT include any markdown, code fences, or extra text. Return ONLY the raw JSON.`;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[extractReceipt] Attempting with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        apiResponse = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          { text: prompt },
        ]);
        
        if (apiResponse && apiResponse.response) break; 
      } catch (e: any) {
        console.warn(`[extractReceipt] Model ${modelName} failed: ${e.message || e}`);
        lastError = e;
      }
    }

    if (!apiResponse || !apiResponse.response) {
      throw lastError || new Error("All Gemini models returned errors or no response.");
    }

    const responseText = apiResponse.response.text().trim();
    if (!responseText) throw new Error("Gemini returned an empty response.");

    // Robust JSON extraction: Find the first '{' and last '}'
    let cleanJson = responseText;
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanJson = responseText.substring(startIdx, endIdx + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error("[extractReceipt] JSON Parse Error. Raw response:", responseText);
      throw new Error(`Gemini returned invalid JSON structure.`);
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

    // Convert currency to USD
    let amountInUSD = extracted.amount;
    try {
      amountInUSD = await convertCurrencyToUSD(extracted.amount, extracted.currency);
    } catch (e) {
      console.warn("[extractReceipt] Currency conversion failed, using original amount.");
    }

    return {
      success: true,
      data: { ...extracted, amountInUSD },
    };
  } catch (error: any) {
    console.error("[extractReceipt] Extraction failed:", error);
    return { success: false, error: error.message || "Unknown extraction error" };
  }
}
