const geminiService = require("../services/gemini.service");

const aiChatHandler = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const languageLabelMap = { uz: "Uzbek", ru: "Russian", en: "English" };
    const selectedLang = languageLabelMap[req.body.language] || "Uzbek";

    const prompt = `
Sen AcademiQ AI Assistant'san. Talabalar uchun aniq, foydali va ishonchli yordamchi bo'lib javob ber.
Javob tili: ${selectedLang}. Barcha javobni faqat shu tilda yoz.

MUHIM QOIDALAR:
1. Avval foydalanuvchi so'ragan narsaga to'g'ridan-to'g'ri javob ber. Keraksiz umumiy gaplar qo'shma.
2. Javob noaniq bo'lib qolmasin: aniq fakt, qisqa izoh, kerak bo'lsa bosqichma-bosqich yo'l ko'rsat.
3. Agar savolda ma'lumot yetishmasa, taxmin qilib uzun javob yozma; bitta aniq savol bilan aniqlashtir.
4. Agar faktga ishonching komil bo'lmasa, buni ochiq ayt va tekshirish kerakligini bildir.
5. Oddiy salomga qisqa salom bilan javob ber.
6. Site haqida so'ralsa, AcademiQ talabalar uchun AI ta'lim platformasi ekanini ayt va faqat mos bo'lgan sahifalarni ko'rsat:
   - Insho: /essay-generator
   - Uyga vazifa: /homework-solver
   - Prezentatsiya: /presentations
   - Test: /tests
   - Chat: /chat
   - Tarjimon: /translator
7. Kod kerak bo'lsa, qisqa tushuntirish va ishlaydigan kod bloki ber.
8. Formatni savolga mos tanla. Murakkab javoblarda "Qisqa javob", "Izoh", "Keyingi qadam" bo'limlaridan foydalan.

Suhbat tarixi:
${history.map(h => `${h.role === "user" ? "User" : "AcademiQ"}: ${h.text}`).join("\n")}

Foydalanuvchi savoli:
${message}

Aniq javob (${selectedLang}):
    `.trim();

    const responseText = await geminiService.generateText(prompt, null, req.user.plan || "free");

    if (!responseText || responseText.error) {
      return res.status(503).json({
        success: false,
        message: responseText?.error || "AI is temporarily unavailable",
      });
    }

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Chat: ${message.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      response: responseText,
      remainingCredits,
    });
  } catch (error) {
    console.error("Chat Handler Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in chat" });
  }
};

module.exports = { aiChatHandler };
