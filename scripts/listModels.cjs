
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: listModels is usually on the genAI object or requires a different approach in newer SDKs
    // Actually, in @google/generative-ai, there is no direct listModels on the main class usually, 
    // it's part of the REST API. But let's try to see if there's a way or just test common ones.
    
    const commonModels = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-pro",
      "gemini-pro-vision",
      "gemini-2.0-flash-exp",
      "gemini-2.5-flash" // The one that supposedly worked
    ];

    for (const m of commonModels) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent("test");
            console.log(`  ${m} is AVAILABLE: ${res.response.text().substring(0, 20)}`);
        } catch (e) {
            console.log(`  ${m} is NOT available: ${e.message.substring(0, 50)}`);
        }
    }
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

listModels();
