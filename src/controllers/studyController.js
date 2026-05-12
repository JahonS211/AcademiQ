const geminiService = require("../services/gemini.service");

const solveHomeworkHandler = async (req, res, next) => {
  try {
    const { question = "", subject } = req.body;
    if (!question && !req.file) return res.status(400).json({ success: false, message: "Question or image is required" });

    const languageLabelMap = { uz: "Uzbek", ru: "Russian", en: "English" };
    const selectedLang = languageLabelMap[req.body.language] || "Uzbek";

    let imageContext = "";
    if (req.file) {
      const visionPrompt = `Rasmdagi masala, matn, formula, jadval yoki diagrammani o'qi. Muhim ma'lumotlarni ${selectedLang} tilida aniq chiqar.`;
      const visionResult = await geminiService.generateFromImage(visionPrompt, req.file.buffer, req.file.mimetype);
      if (!visionResult || visionResult.error) {
        return res.status(503).json({
          success: false,
          message: visionResult?.error || "Rasmni o'qib bo'lmadi. Iltimos, aniqroq rasm yuklang.",
        });
      }
      imageContext = `\nRasmdan o'qilgan ma'lumot:\n${visionResult}\n`;
    }

    const prompt = `Sen dunyo darajasidagi repetitorsan. Javoblarni faqat ${selectedLang} tilida ber.

QOIDALAR:
1. Savolga to'g'ridan-to'g'ri, aniq va tekshiriladigan javob ber.
2. Agar savol noaniq bo'lsa, uzun taxminiy javob yozma; avval bitta aniqlashtiruvchi savol ber.
3. Hisob-kitob bo'lsa, formulani va har bir muhim qadamni ko'rsat.
4. Tanlangan fan: ${subject || "Umumiy"}. Savol boshqa fanga tegishli bo'lsa, qisqa eslat.
5. Keraksiz kirish so'zlari yozma.
6. Matematika bo'lsa, hisobni ikki marta tekshir. Kasr, ildiz va formulalarni \\frac{a}{b}, \\sqrt{x} shaklida yoz. Noto'g'ri taxmin qilma.

Savol: ${question}
${imageContext}

Javob formati (${selectedLang}):
## Qisqa javob
[1-2 jumla bilan asosiy javob]

## Tushuntirish
[Aniq izoh, zarur bo'lsa formula yoki sabab]

## Yechim bosqichlari
[Kerak bo'lsa raqamlangan bosqichlar]`;


    const solution = await geminiService.generateText(prompt, null, req.user.planType || req.user.plan || "free");

    if (!solution || solution.error) {
      return res.status(503).json({ 
        success: false, 
        message: solution?.error || "AI javobi qaytarilmadi. Iltimos qaytadan urinib ko'ring." 
      });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Homework: ${subject}`);
    }

    return res.status(200).json({ success: true, solution, remainingCredits });
  } catch (error) {
    console.error("Homework Solver Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in homework solver" });
  }
};

const generateFlashcardsHandler = async (req, res, next) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "Topic is required" });

    const languageLabelMap = { uz: "Uzbek", ru: "Russian", en: "English" };
    const selectedLang = languageLabelMap[req.body.language] || "Uzbek";
    const safeCount = Math.min(20, Math.max(1, Number(count) || 5));

    const prompt = `Generate exactly ${safeCount} educational flashcards for the topic "${topic}" in ${selectedLang}.
Each card must be specific, short, and useful for memorization. Avoid vague questions like "Explain this topic".
Return ONLY JSON with this structure:
{
  "flashcards": [
    { "front": "clear question or term", "back": "short, precise answer or definition" }
  ]
}`;

    const data = await geminiService.generateJSON(prompt, null, req.user.planType || req.user.plan || "free", { flashcards: [] });

    if (data.error) {
      return res.status(503).json({ success: false, message: data.error });
    }

    if (!data.flashcards || data.flashcards.length === 0) {
      return res.status(503).json({ success: false, message: "AI flashcardlarni yarata olmadi. Iltimos qaytadan urinib ko'ring." });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Flashcards: ${topic}`);
    }

    return res.status(200).json({ success: true, ...data, remainingCredits });
  } catch (error) {
    console.error("Flashcards Handler Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in flashcards" });
  }
};

module.exports = { solveHomeworkHandler, generateFlashcardsHandler };
