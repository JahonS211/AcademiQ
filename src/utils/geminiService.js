const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Generate text from Gemini
 */
const generateText = async (prompt, modelName) => {
  try {
    const model = getModel(modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("AI generation failed");
  }
};

/**
 * Generate JSON from Gemini
 */
const generateJSON = async (prompt, modelName) => {
  try {
    const model = getModel(modelName);
    const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no triple backticks, just the JSON.`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Gemini Parse Error. Raw Text:", text);
      throw new Error("AI JSON parsing failed: " + text.slice(0, 100));
    }
  } catch (error) {
    console.error("Gemini JSON Error:", error);
    throw new Error(error.message || "AI JSON generation failed");
  }
};

/**
 * Generate text from Gemini with image input
 */
const generateFromImage = async (prompt, imageBufferOrBase64, mimeType = "image/jpeg") => {
  try {
    const model = getModel("gemini-1.5-flash"); // Flash is best for vision
    const imageData = typeof imageBufferOrBase64 === "string" 
      ? imageBufferOrBase64 
      : imageBufferOrBase64.toString("base64");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType
        }
      }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("AI Vision analysis failed");
  }
};

module.exports = { generateText, generateJSON, generateFromImage };
