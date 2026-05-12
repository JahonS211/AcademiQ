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
      "mixtral-8x7b-32768",
    ];

    this.deepseekModels = [
      "deepseek-chat",
      "deepseek-reasoner",
    ];

    this.groqVisionModels = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview",
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

  normalizePlan(plan) {
    if (plan === "pro" || plan === "pro_plus") return plan;
    return "free";
  }

  getProviderOrder(plan) {
    const normalizedPlan = this.normalizePlan(plan);
    if (normalizedPlan === "pro_plus") return ["groq", "deepseek", "gemini"];
    if (normalizedPlan === "pro") return ["groq", "deepseek"];
    return ["groq"];
  }

  prioritizeModel(models, requestedModel) {
    if (!requestedModel || !models.includes(requestedModel)) return models;
    return [requestedModel, ...models.filter((modelName) => modelName !== requestedModel)];
  }

  async tryGemini(prompt, requestedModel) {
    if (!this.genAI) return null;

    const modelsToTry = this.prioritizeModel(this.geminiModels, requestedModel);
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName }, this.apiConfig);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) return text;
      } catch (error) {
        console.warn(`Gemini [${modelName}] failed: ${error.message}`);
      }
    }

    return null;
  }

  async tryGroq(prompt, requestedModel) {
    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    if (!groqKey) return null;

    const modelsToTry = this.prioritizeModel(this.groqModels, requestedModel);
    for (const modelName of modelsToTry) {
      try {
        const { data } = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.35,
          },
          {
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } catch (error) {
        console.warn(`Groq [${modelName}] failed: ${error.message}`);
      }
    }

    return null;
  }

  async tryDeepseek(prompt, requestedModel, userPlan) {
    const deepseekKey = (process.env.DEEPSEEK_API_KEY || "").trim();
    if (!deepseekKey) return null;

    const models = this.normalizePlan(userPlan) === "pro_plus"
      ? this.deepseekModels
      : ["deepseek-chat"];
    const modelsToTry = this.prioritizeModel(models, requestedModel);

    for (const modelName of modelsToTry) {
      try {
        const { data } = await axios.post(
          "https://api.deepseek.com/chat/completions",
          {
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${deepseekKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } catch (error) {
        console.warn(`DeepSeek [${modelName}] failed: ${error.message}`);
      }
    }

    return null;
  }

  async generateText(prompt, requestedModel = null, userPlan = "free") {
    let options = {};
    if (typeof requestedModel === "object" && requestedModel !== null) {
      options = requestedModel;
    } else {
      options = { requestedModel, userPlan };
    }

    const plan = this.normalizePlan(options.userPlan || userPlan || "free");
    const reqModel = options.requestedModel || null;
    const providerOrder = this.getProviderOrder(plan);

    for (const provider of providerOrder) {
      let result = null;
      if (provider === "groq") result = await this.tryGroq(prompt, reqModel);
      if (provider === "deepseek") result = await this.tryDeepseek(prompt, reqModel, plan);
      if (provider === "gemini") result = await this.tryGemini(prompt, reqModel);
      if (result) return result;
    }

    return { error: "AI modellari limiti tugadi yoki sozlanmagan. Birozdan so'ng qayta urinib ko'ring." };
  }

  async generateJSON(prompt, requestedModel = null, userPlan = "free", fallback = {}) {
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
    const imageData = typeof imageBufferOrBase64 === "string"
      ? imageBufferOrBase64
      : imageBufferOrBase64.toString("base64");

    if (this.genAI) {
      for (const modelName of this.geminiModels) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName }, this.apiConfig);
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType } },
          ]);
          return result.response.text();
        } catch (error) {
          console.warn(`Gemini vision [${modelName}] failed: ${error.message}`);
        }
      }
    }

    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    if (groqKey) {
      const imageUrl = `data:${mimeType};base64,${imageData}`;
      for (const modelName of this.groqVisionModels) {
        try {
          const { data } = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: modelName,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageUrl } },
                  ],
                },
              ],
              temperature: 0.15,
              max_tokens: 1800,
            },
            {
              headers: {
                Authorization: `Bearer ${groqKey}`,
                "Content-Type": "application/json",
              },
              timeout: 25000,
            }
          );

          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        } catch (error) {
          console.warn(`Groq vision [${modelName}] failed: ${error.message}`);
        }
      }
    }

    return { error: "Rasmni tahlil qiladigan AI modeli vaqtincha ishlamadi. Iltimos, keyinroq qayta urinib ko'ring yoki rasmni aniqroq yuklang." };
  }
}

module.exports = new GeminiService();
