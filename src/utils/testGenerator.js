const geminiService = require("../services/gemini.service");

const generateTestAI = async ({ topic, language, questionCount = 5, userPlan = "free" }) => {
  const options = { userPlan };
  const languageLabelMap = { uz: "Uzbek", ru: "Russian", en: "English" };
  const selectedLang = languageLabelMap[language] || "Uzbek";
  const prompt = `
    Create a multiple-choice test about "${topic}".
    Write every title, question, option, and answer only in ${selectedLang}.
    Generate exactly ${questionCount} questions.
    For each question, provide 4 clear options and set "answer" to the exact correct option text.
    
    Return ONLY valid JSON in this format:
    {
      "title": "Test Title",
      "questions": [
        {
          "question": "Question text?",
          "options": ["first option", "second option", "third option", "fourth option"],
          "answer": "exact correct option text"
        }
      ]
    }
  `;

  try {
    return await geminiService.generateJSON(prompt, null, options.userPlan || "free", { title: "", questions: [] });
  } catch (error) {
    console.error("Test Generation Error:", error);
    throw error;
  }
};

module.exports = { generateTestAI };
