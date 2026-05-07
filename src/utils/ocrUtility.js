const fs = require("fs");

const extractTextWithGroq = async (filePath) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  // Read file as base64
  const imageAsBase64 = fs.readFileSync(filePath, { encoding: "base64" });
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all the text from this image accurately. Do not include any explanations, just the raw text you see in the image. If the image contains no text, return empty." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageAsBase64}` } }
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Vision API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
};

module.exports = { extractTextWithGroq };
