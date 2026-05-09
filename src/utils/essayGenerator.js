const { generateJSON } = require("./geminiService");

const languageLabelMap = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English",
};

const generateEssay = async ({ topic, language, length }) => {
  const languageInstructions = {
    uz: `INSHO FAQAT O'ZBEK TILIDA YOZILISHI SHART! Akademik va professional uslubdan foydalaning.`,
    ru: "ЭССЕ ДОЛЖНО БЫТЬ НАПИСАНО ТОЛЬКО НА РУССКОМ ЯЗЫКЕ!",
    en: "THE ESSAY MUST BE WRITTEN ENTIRELY IN ENGLISH.",
  };

  const prompt = `
You are a professional academic essay writer.
Topic: "${topic}"
Language: ${languageLabelMap[language]}
Length: ${length} (short: 300 words, medium: 600 words, long: 1000+ words)

Return ONLY JSON with this exact structure:
{"introduction":"...","body":"...","conclusion":"..."}

${languageInstructions[language]}
  `.trim();

  try {
    const parsed = await generateJSON(prompt, "gemini-1.5-flash");
    
    if (!parsed?.introduction || !parsed?.body || !parsed?.conclusion) {
      throw new Error("Gemini response does not match required essay structure");
    }

    return {
      introduction: parsed.introduction,
      body: parsed.body,
      conclusion: parsed.conclusion,
    };
  } catch (error) {
    console.error("Essay Generation Error:", error);
    throw error;
  }
};

module.exports = { generateEssay };
