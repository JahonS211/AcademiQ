const geminiService = require("../services/gemini.service");

const checkGrammar = async (req, res, next) => {
  try {
    const { text, language = "en" } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const langName = language === "uz" ? "Uzbek" : language === "ru" ? "Russian" : "English";

    const prompt = `Siz professional tahrirchisiz. Matnni ${langName} tilida grammatik, imlo va tinish belgilari bo'yicha tekshiring.
Ma'noni o'zgartirmang, ortiqcha gap qo'shmang, xatolar bo'lmasa errors bo'sh array bo'lsin.

Matn: "${text}"

FAQAT JSON qaytaring:
{
  "correctedText": "To'liq tuzatilgan matn",
  "summary": "1 ta qisqa jumlada umumiy baho",
  "errors": [
    { "original": "xato qism", "correction": "to'g'ri qism", "explanation": "qisqa, aniq sabab" }
  ]
}`;

    const result = await geminiService.generateJSON(prompt, null, req.user.plan || "free");
    
    if (result.error) {
      return res.status(503).json({ success: false, message: result.error });
    }
    
    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Grammarly: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits
    });
  } catch (error) {
    return next(error);
  }
};

const detectAI = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const prompt = `Analyze the text and estimate whether it is AI-written or human-written.
Be careful: this is a probability, not a guaranteed verdict. Use clear, specific indicators.

Text: "${text}"

Return ONLY JSON:
{
  "aiScore": 0,
  "verdict": "Likely human / Mixed / Likely AI",
  "confidence": "low / medium / high",
  "shortReason": "one clear sentence",
  "indicators": [
    { "label": "specific indicator", "value": "what you observed" }
  ]
}`;

    const result = await geminiService.generateJSON(prompt, null, req.user.plan || "free");

    if (result.error) {
      return res.status(503).json({ success: false, message: result.error });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`AI Detector: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits
    });
  } catch (error) {
    return next(error);
  }
};

const humanizeText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const prompt = `Siz professional matn tahrirchisiz. Quyidagi matnni tabiiyroq, ravonroq va inson yozgandek qilib qayta yozing.
Ma'no, faktlar va raqamlarni o'zgartirmang. Juda rasmiy yoki juda sun'iy iboralarni oddiyroq qiling.

Matn: "${text}"

FAQAT JSON qaytaring:
{
  "humanizedText": "tabiiy va ravon variant",
  "changesSummary": "qanday o'zgartirilgani haqida bitta qisqa jumla"
}`;

    const result = await geminiService.generateJSON(prompt, null, req.user.plan || "free");

    if (result.error) {
      return res.status(503).json({ success: false, message: result.error });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Humanizer: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { checkGrammar, detectAI, humanizeText };
