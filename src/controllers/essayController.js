const Essay = require("../models/Essay");
const geminiService = require("../services/gemini.service");

const generateEssayHandler = async (req, res, next) => {
  try {
    const { topic, language, length } = req.body;
    if (!topic || !language || !length) {
      return res.status(400).json({ success: false, message: "topic, language and length are required" });
    }

    const languageLabelMap = { uz: "Uzbek", ru: "Russian", en: "English" };
    const prompt = `
Siz professional akademik insho yozuvchisiz. 
Mavzu: "${topic}"
Til: ${languageLabelMap[language] || language}
Hajm: ${length} (short: 300 so'z, medium: 600 so'z, long: 1000+ so'z)

QOIDALAR:
1. Insho akademik, mantiqiy va chuqur tahliliy bo'lishi kerak.
2. Kirish qismida mavzuning dolzarbligi va asosiy tezisni yoritib bering.
3. Asosiy qismda har bir paragraf alohida g'oyani dalillar va misollar bilan tushuntirishi kerak.
4. Xulosa qismida asosiy fikrlarni jamlab, yakuniy xulosa yasang.
5. Faktga ishonching komil bo'lmasa, aniq fakt sifatida yozma; umumiy tahlil sifatida ifodala.
6. Har bir paragraf mavzuga bevosita bog'liq bo'lsin, umumiy va noaniq jumlalardan qoch.
7. Matnning o'qilishi oson, lekin tili boy bo'lsin.
8. Body qismi bir nechta mantiqiy paragrafdan iborat bo'lsin.

FAQAT va FAQAT quyidagi JSON formatida javob bering (boshqa hech narsa yozmang):
{"introduction":"...", "body":"...", "conclusion":"..."}
    `.trim();

    const generated = await geminiService.generateJSON(prompt, null, req.user.planType || req.user.plan || "free");

    if (generated.error) {
      return res.status(503).json({ success: false, message: generated.error });
    }

    if (!generated.introduction || !generated.body || !generated.conclusion) {
      return res.status(503).json({ success: false, message: "AI javobi noto'g'ri formatda keldi. Iltimos qaytadan urinib ko'ring." });
    }

    // We no longer save to the Essay model to save space, but we update stats via deductCredits
    const essayData = {
      topic,
      content: {
        introduction: generated.introduction,
        body: generated.body,
        conclusion: generated.conclusion,
      },
      createdAt: new Date(),
    };

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Essay: ${topic.slice(0, 30)}`);
    }

    return res.status(201).json({
      success: true,
      message: "Essay generated successfully",
      essay: essayData,
      remainingCredits,
    });
  } catch (error) {
    console.error("Essay Generation Handler Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during essay generation" });
  }
};

const getMyEssays = async (req, res, next) => {
  try {
    // Return empty list since we are no longer saving essays
    return res.status(200).json({ success: true, essays: [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch essays" });
  }
};

module.exports = {
  generateEssayHandler,
  getMyEssays,
};
