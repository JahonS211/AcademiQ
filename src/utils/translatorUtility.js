const { generateText } = require("./geminiService");

const translateAI = async ({ text, targetLanguage }) => {
  const prompt = `
    You are a professional multilingual translator. 
    Task: Translate the provided text into ${targetLanguage}.
    
    RULES:
    1. Translate the text accurately, maintaining the original meaning, tone, and context.
    2. ${targetLanguage === 'Ўзбек (Кирилл)' ? 'CRITICAL: Use ONLY the Cyrillic alphabet (Кирилл алифбоси). Do NOT use Latin.' : ''}
    3. DO NOT repeat the source text. 
    4. DO NOT provide any explanations, notes, or intros.
    5. Return ONLY the translated text.
    
    Text to translate:
    """
    ${text}
    """
  `;

  try {
    return await generateText(prompt);
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

module.exports = { translateAI };
