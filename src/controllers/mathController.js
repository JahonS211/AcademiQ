const geminiService = require("../services/gemini.service");
const { tryLocalMathSolve } = require("../utils/simpleMathSolver");

const normalizeExpressions = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 8);
};

const explainMath = async (req, res, next) => {
  try {
    const { prompt, language = "uz" } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

    const languageMap = { uz: "Uzbek Latin", ru: "Russian", en: "English" };
    const selectedLang = languageMap[language] || languageMap.uz;
    const localSolve = tryLocalMathSolve(prompt);

    const aiPrompt = `
You are Thinky Math Lab, a WolframAlpha-style math assistant with Desmos expression support.
Answer only in ${selectedLang}.
Solve or explain this request:
"""
${prompt}
"""

Rules:
1. Give a clear short answer and step-by-step explanation.
2. If graphing helps, provide Desmos-compatible expressions, such as y=x^2, x^2+y^2=9, y=sin(x), or points like (1,2).
3. Use LaTeX-like math for fractions and roots when useful: \\frac{a}{b}, \\sqrt{x}.
4. Do not invent facts. If the expression is unclear, ask one precise clarification question.
5. Recalculate all arithmetic twice before answering. Do not guess.
6. If a checked local result is provided below, use it as the source of truth and explain it.

Checked local result:
${localSolve ? JSON.stringify(localSolve, null, 2) : "No deterministic local result available."}

Return ONLY JSON:
{
  "answer": "short final answer",
  "steps": ["step 1", "step 2", "step 3"],
  "expressions": ["Desmos expression 1", "Desmos expression 2"],
  "note": "short usage note"
}`.trim();

    const result = await geminiService.generateJSON(aiPrompt, null, req.user.planType || req.user.plan || "free", {
      answer: "",
      steps: [],
      expressions: [],
      note: "",
    });

    if (result.error) {
      return res.status(503).json({ success: false, message: result.error });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Math Lab: ${prompt.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result: {
        answer: String(result.answer || ""),
        steps: Array.isArray(result.steps) ? result.steps.map((step) => String(step || "")).filter(Boolean).slice(0, 8) : [],
        expressions: normalizeExpressions(result.expressions?.length ? result.expressions : localSolve?.expressions),
        note: String(result.note || ""),
      },
      remainingCredits,
      cost: req.creditCost || 0,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { explainMath };
