const languageLabelMap = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English",
};

// Sanitize control characters that break JSON parsing inside strings.
// Fixes cases like: {"body":"Line1
// Line2"} (raw newline inside string) -> {"body":"Line1\nLine2"}
const escapeControlCharsInJsonStrings = (jsonStr) => {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i += 1) {
    const ch = jsonStr[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === "\"") {
      out += ch;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code >= 0 && code <= 31) {
        // Drop other control chars inside strings
        continue;
      }
    }

    out += ch;
  }

  return out;
};

const extractJsonObject = (content) => {
  const trimmed = String(content || "").trim();
  const startIdx = trimmed.indexOf("{");
  const endIdx = trimmed.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    throw new Error("No JSON object found in model response");
  }
  return trimmed.slice(startIdx, endIdx + 1);
};

const callGroq = async ({ apiKey, model, prompt, temperature, maxTokens }) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Output MUST be valid JSON only (no markdown).",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  return response;
};

const generateEssay = async ({ topic, language, length }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  const languageInstructions = {
    uz: "INSHO FAQAT O'ZBEK TILIDA YOZILISHI SHART! Boshqa tillardan aslo foydalanmang.",
    ru: "ЭССЕ ДОЛЖНО БЫТЬ НАПИСАНО ТОЛЬКО НА РУССКОМ ЯЗЫКЕ! Не используйте другие языки.",
    en: "THE ESSAY MUST BE WRITTEN ENTIRELY IN ENGLISH. Do not use other languages.",
  };

  const prompt = `
Topic: "${topic}"
Language: ${languageLabelMap[language]}
Length: ${length} (short: 300 words, medium: 600 words, long: 1000+ words)

Return ONLY JSON with this exact structure:
{"introduction":"...","body":"...","conclusion":"..."}

${languageInstructions[language]}
  `.trim();

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const maxTokens = length === "short" ? 700 : length === "medium" ? 1400 : 2400;
  const fullPrompt = `You are a professional academic essay writer. Output MUST be valid JSON only (no markdown). ${languageInstructions[language]}\n\n${prompt}`;

  const response = await callGroq({
    apiKey,
    model,
    prompt: fullPrompt,
    temperature: 0.7,
    maxTokens,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error("Groq API returned empty content");
  }
  
  const jsonOnly = extractJsonObject(rawText);
  const sanitized = escapeControlCharsInJsonStrings(jsonOnly);

  let parsed;
  try {
    parsed = JSON.parse(sanitized);
  } catch (error) {
    throw new Error(`Invalid JSON from Groq: ${error.message}`);
  }

  if (!parsed?.introduction || !parsed?.body || !parsed?.conclusion) {
    throw new Error("Groq response does not match required essay structure");
  }

  return {
    introduction: parsed.introduction,
    body: parsed.body,
    conclusion: parsed.conclusion,
  };
};

module.exports = { generateEssay };
