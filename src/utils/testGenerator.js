const generateTestAI = async ({ topic, language, questionCount = 5 }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const prompt = `
    Create a multiple-choice test about "${topic}" in ${language} language.
    Generate exactly ${questionCount} questions.
    For each question, provide 4 options and the correct answer.
    
    Return ONLY valid JSON in this format:
    {
      "title": "Test Title",
      "questions": [
        {
          "question": "Question text?",
          "options": ["A", "B", "C", "D"],
          "answer": "A"
        },
        ...
      ]
    }
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const rawContent = data.choices[0].message.content.replace(/```json|```/g, "").trim();
  return JSON.parse(rawContent);
};

module.exports = { generateTestAI };
