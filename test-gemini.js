const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY.trim();

async function test(modelName, apiVersion) {
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    process.stdout.write(`[${apiVersion}] ${modelName.padEnd(35)}... `);
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
    const result = await model.generateContent("hi");
    console.log("✅ WORKS! -> " + result.response.text().slice(0, 50));
    return true;
  } catch (e) {
    const msg = e.message.includes("404") ? "404 Not Found" : e.message.slice(0, 40);
    console.log("❌ " + msg);
    return false;
  }
}

async function main() {
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-flash-lite",
  ];

  for (const m of candidates) {
    const ok = await test(m, "v1beta");
    if (ok) { console.log("\n🎉 Use this model:", m); process.exit(0); }
  }
  console.log("\n😢 No working model found.");
}

main();
