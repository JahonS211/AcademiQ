const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

class GeminiService {
  constructor() {
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    this.genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
    this.apiConfig = { apiVersion: "v1beta" };

    this.geminiModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash-8b",
    ];

    this.groqModels = [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768"
    ];

    this.deepseekModels = [
      "deepseek-chat",
      "deepseek-reasoner"
    ];
  }

  cleanGeminiResponse(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
  }

  safeJsonParse(text, fallbackValue = null) {
    try {
      const cleaned = this.cleanGeminiResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      return fallbackValue;
    }
  }

  /**
   * Main generation method with waterfall fallback and plan restrictions
   */
  async generateText(prompt, requestedModel = null, userPlan = "free") {
    // Check if requestedModel is an options object (to support flexible calls)
    let options = {};
    if (typeof requestedModel === "object" && requestedModel !== null) {
      options = requestedModel;
    } else {
      options = { requestedModel, userPlan };
    }

    const { requestedModel: reqModel, userPlan: plan = "free" } = options;

    // 1. Try Gemini
    if (this.genAI) {
      const modelsToTry = reqModel && this.geminiModels.includes(reqModel) 
        ? [reqModel, ...this.geminiModels] 
        : this.geminiModels;

      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName }, this.apiConfig);
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) return text;
        } catch (e) {
          console.warn(`⚠️ Gemini [${modelName}] failed: ${e.message}`);
          continue;
        }
      }
    }

    // 2. Try Groq (Available for all plans as fallback)
    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    if (groqKey) {
      console.log("🔄 Falling back to GROQ...");
      for (const modelName of this.groqModels) {
        try {
          const { data } = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: modelName,
              messages: [{ role: "user", content: prompt }]
            },
            {
              headers: {
                Authorization: `Bearer ${groqKey}`,
                "Content-Type": "application/json"
              }
            }
          );
          const content = data.choices[0]?.message?.content;
          if (content) return content;
        } catch (e) {
          console.warn(`⚠️ Groq [${modelName}] failed: ${e.message}`);
          continue;
        }
      }
    }

    // 3. Try DeepSeek (Available for PRO and PRO+ only)
    const deepseekKey = (process.env.DEEPSEEK_API_KEY || "").trim();
    const canUseDeepseek = plan === "pro" || plan === "pro_plus";

    if (deepseekKey && canUseDeepseek) {
      console.log("🔄 Falling back to DEEPSEEK...");
      const dsModels = plan === "pro_plus" ? this.deepseekModels : ["deepseek-chat"];

      for (const modelName of dsModels) {
        try {
          const { data } = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
              model: modelName,
              messages: [{ role: "user", content: prompt }]
            },
            {
              headers: {
                Authorization: `Bearer ${deepseekKey}`,
                "Content-Type": "application/json"
              }
            }
          );
          const content = data.choices[0]?.message?.content;
          if (content) return content;
        } catch (e) {
          console.warn(`⚠️ DeepSeek [${modelName}] failed: ${e.message}`);
          continue;
        }
      }
    }

    console.error("❌ ALL AI MODELS FAILED");
    return { error: "Barcha AI modellari limiti tugadi. Iltimos birozdan so'ng qayta urinib ko'ring." };
  }

  async generateJSON(prompt, requestedModel = null, userPlan = "free", fallback = {}) {
    // Handle overload where requestedModel is an options object
    let options = {};
    if (typeof requestedModel === "object" && requestedModel !== null) {
      options = requestedModel;
    } else {
      options = { requestedModel, userPlan };
    }

    const jsonPrompt = `${prompt}\n\nReturn ONLY valid JSON. Do not use markdown. Do not explain.`;
    const result = await this.generateText(jsonPrompt, options);
    
    if (!result) return fallback;
    if (typeof result === "object" && result.error) return result;
    if (typeof result !== "string") return fallback;
    
    return this.safeJsonParse(result) || fallback;
  }

  async generateFromImage(prompt, imageBufferOrBase64, mimeType = "image/jpeg") {
    if (!this.genAI) return { error: "Gemini not configured" };
    
    const imageData = typeof imageBufferOrBase64 === "string" 
      ? imageBufferOrBase64 
      : imageBufferOrBase64.toString("base64");

    for (const modelName of this.geminiModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName }, this.apiConfig);
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: imageData, mimeType } }
        ]);
        return result.response.text();
      } catch (e) {
        continue;
      }
    }
    return { error: "Vision analysis failed on all models." };
  }
}

module.exports = new GeminiService();
