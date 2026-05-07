const translateAI = async ({ text, targetLanguage }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const prompt = `
    You are a highly accurate professional translator. 
    Translate the following text exactly into ${targetLanguage}.
    ${targetLanguage === 'Ўзбек (Кирилл)' ? 'IMPORTANT: You MUST write the translation in Cyrillic alphabet (Кирилл алифбоси) only. Do NOT use Latin.' : ''}
    Maintain the tone and original formatting.
    Text to translate:
    """
    ${text}
    """
    
    Return ONLY the raw translated text without any quotes, markdown formatting, or additional explanations.
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Translation API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Translation API returned empty content");
  }
  return data.choices[0].message.content.trim();
};

module.exports = { translateAI };
