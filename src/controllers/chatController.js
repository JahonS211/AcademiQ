const geminiService = require("../services/gemini.service");
const multer = require("multer");
const { writeGeneratedSvgImage } = require("../utils/aiImageGenerator");

const creatorName = "Sadriddinov Jahongir";

const uploadChatImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype || "")) {
      return cb(new Error("Faqat PNG, JPG yoki WEBP rasm yuklang"));
    }
    return cb(null, true);
  },
}).single("image");

const parseHistory = (history) => {
  if (Array.isArray(history)) return history;
  if (typeof history !== "string") return [];
  try {
    const parsed = JSON.parse(history);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const isImageGenerationRequest = (message = "", mode = "") => {
  if (mode === "image") return true;
  return /(rasm|surat|image|illustration|poster).*(yarat|chiz|generate|create|make)/i.test(String(message));
};

const getUserDisplayName = (user = {}) => {
  const name = String(user.name || "").trim();
  if (name) return name;
  const email = String(user.email || "").trim();
  if (email && email.includes("@")) return email.split("@")[0];
  return "foydalanuvchi";
};

const getPlanLabel = (plan = "free") => {
  if (plan === "pro_plus") return "Pro+";
  if (plan === "pro") return "Pro";
  return "Free";
};

const aiChatHandler = async (req, res, next) => {
  try {
    const { message, mode } = req.body;
    const history = parseHistory(req.body.history);
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const languageLabelMap = { uz: "Uzbek Latin", ru: "Russian", en: "English" };
    const selectedLang = languageLabelMap[req.body.language] || "Uzbek Latin";
    const userName = getUserDisplayName(req.user);
    const userEmail = req.user?.email || "unknown";
    const userPlan = req.user?.planType || req.user?.plan || "free";
    const planLabel = getPlanLabel(userPlan);
    const credits = req.user?.credits ?? "unknown";

    if (isImageGenerationRequest(message, mode)) {
      const conceptPrompt = `
Create a concise visual concept for an educational AI-generated image.
Prompt: "${message}"
Return ONLY JSON:
{
  "title": "short image title",
  "description": "what should be visible in the image",
  "keywords": ["keyword", "keyword", "keyword"]
}`.trim();
      const concept = await geminiService.generateJSON(conceptPrompt, null, userPlan, {
        title: message.slice(0, 70),
        description: message,
        keywords: ["education", "AcademiQ", "AI"],
      });
      if (concept.error) {
        return res.status(503).json({ success: false, message: concept.error });
      }

      const generated = writeGeneratedSvgImage({
        prompt: message,
        title: concept.title || message,
        description: concept.description || message,
        keywords: Array.isArray(concept.keywords) ? concept.keywords : ["education", "AI"],
        palette: { bg: "F7FAFF", panel: "FFFFFF", accent: "4F46E5", accent2: "06B6D4", text: "111827", muted: "64748B", soft: "EEF2FF" },
      });

      let remainingCredits = null;
      if (req.deductCredits) {
        remainingCredits = await req.deductCredits(`AI Image: ${message.slice(0, 30)}...`);
      }

      return res.status(200).json({
        success: true,
        response: `Tayyor. Mavzuga mos AI rasm yaratildi: ${concept.title || message}`,
        imageUrl: generated.fileUrl,
        remainingCredits,
      });
    }

    let imageAnalysis = "";
    if (req.file) {
      const imagePrompt = `
You are a vision assistant for AcademiQ.
Read and understand the uploaded image. If it contains text, math, a task, a table, or a diagram, extract the important content and explain what is visible.
Return a compact but complete analysis in ${selectedLang}.`.trim();
      const visionResult = await geminiService.generateFromImage(imagePrompt, req.file.buffer, req.file.mimetype);
      if (!visionResult || visionResult.error) {
        return res.status(503).json({
          success: false,
          message: visionResult?.error || "Rasmni tahlil qilib bo'lmadi. Qayta urinib ko'ring.",
        });
      }
      imageAnalysis = `\nYuklangan rasm tahlili:\n${visionResult}\n`;
    }

    const siteKnowledge = `
AcademiQ platformasi haqida to'liq ma'lumot:
- AcademiQ - talabalar va o'quvchilar uchun AI bilan ishlaydigan ta'lim platformasi.
- Platforma yaratuvchisi: ${creatorName}. Agar foydalanuvchi "seni kim yaratgan?", "botni kim qilgan?", "AcademiQni kim yaratgan?" deb so'rasa, aniq javob: "Meni/AcademiQ AI assistantni Sadriddinov Jahongir yaratgan." deb ayt.
- Chat assistant nomi: AcademiQ AI Assistant. U foydalanuvchiga o'qish, yozish, tarjima, test, prezentatsiya va fayl ishlari bo'yicha yordam beradi.
- Foydalanuvchi akkaunti: ism/name = ${userName}, email = ${userEmail}, tarif = ${planLabel}, mavjud kredit = ${credits}. Agar foydalanuvchi "ismim nima?", "men kimman?", "akkauntim qaysi?" deb so'rasa, shu akkaunt ma'lumotiga tayan.

Asosiy sahifalar va vazifalar:
- /chat: AcademiQ AI Assistant bilan suhbat. Savollarga javob, yo'naltirish, tushuntirish, kod va o'quv yordami.
- /essay-generator: insho/essay yaratadi. Til va uzunlikka qarab matn tayyorlaydi.
- /homework-solver: uyga vazifa va masalalarni bosqichma-bosqich yechadi.
- /presentations: mavzuga mos slaydlar yaratadi, slayd soni va ma'lumot uzunligini tanlash mumkin. Prezentatsiya aniq ma'lumot, dizayn va mavzuga mos rasm bilan tayyorlanadi.
- /tests: mavzu bo'yicha test yaratadi, savollar sonini tanlash mumkin.
- /flashcards: mavzu bo'yicha interaktiv kartochkalar yaratadi, karta sonini tanlash mumkin.
- /translator: matn tarjima qiladi. Tarjimon kredit olmaydi, bepul ishlaydi.
- /tools: fayl va AI asboblari markazi.
- /tools ichidagi fayl asboblari: Rasm -> PDF, Rasm -> Matn, rasm konvertori (PNG/JPG/SVG), ZIP arxivator.
- /grammarly: matndagi xatolarni topadi, grammatika va uslubni yaxshilaydi.
- /ai-detector: matn AI yozganmi yoki inson yozganmi tahlil qiladi va sabablarini ko'rsatadi.
- /humanizer: AI matnni tabiiyroq, odamga o'xshash va ravonroq qilib qayta yozadi.
- /dashboard: profil, kredit, rasm va akkaunt sozlamalari.
- /pricing: tariflar va imkoniyatlar.
- /buy-credits: qo'shimcha kredit sotib olish.
- /notifications: bildirishnomalar.
- /referrals: referral/taklif tizimi.
- /support: yordam va murojaat.

Tariflar va AI ishlashi:
- Free: faqat Insho Generator va Tarjimon ishlaydi. Qolgan AI/tools bo'limlari Pro yoki Pro+ talab qiladi.
- Pro: Groq va DeepSeek ishlaydi; birining limiti tugasa boshqasiga o'tadi.
- Pro+: Groq, DeepSeek va Gemini ketma-ket ishlaydi; limit tugasa keyingisiga fallback qiladi.
- Kreditlar funksiya va hajmga qarab yechiladi. Tarjimon bepul.

Yo'naltirish qoidasi:
- Agar foydalanuvchi "meni prezentatsiyaga o'tkaz", "test bo'limini och", "insho kerak" kabi buyruq bersa, kerakli sahifa nomi va aniq path ni yoz. Masalan: "Prezentatsiya uchun /presentations sahifasiga o'ting.".
- Agar foydalanuvchi site haqida umumiy so'rasa, yuqoridagi imkoniyatlarni tartibli, tushunarli qilib ayt.
`.trim();

    const prompt = `
Sen AcademiQ AI Assistant'san. Talabalar uchun aniq, foydali va ishonchli yordamchi bo'lib javob ber.
Javob tili: ${selectedLang}. Barcha javobni faqat shu tilda yoz.

${siteKnowledge}

MUHIM QOIDALAR:
1. Avval foydalanuvchi so'ragan narsaga to'g'ridan-to'g'ri javob ber. Keraksiz umumiy gaplar qo'shma.
2. Javob noaniq bo'lib qolmasin: aniq fakt, qisqa izoh, kerak bo'lsa bosqichma-bosqich yo'l ko'rsat.
3. Agar savolda ma'lumot yetishmasa, taxmin qilib uzun javob yozma; bitta aniq savol bilan aniqlashtir.
4. Agar faktga ishonching komil bo'lmasa, buni ochiq ayt va tekshirish kerakligini bildir.
5. Oddiy salomga qisqa, samimiy salom bilan javob ber va kerak bo'lsa foydalanuvchi ismini ishlat.
6. Site, tarif, kredit, bo'limlar, creator yoki foydalanuvchi akkaunti haqida so'ralsa, yuqoridagi platforma ma'lumotlariga tayan.
7. Kod kerak bo'lsa, qisqa tushuntirish va ishlaydigan kod bloki ber.
8. Formatni savolga mos tanla. Murakkab javoblarda qisqa sarlavhalar va ixcham ro'yxatlardan foydalan.
9. Hech qachon creator haqida boshqa ism aytma. Creator/yasalgan/kim qilgan savollarida Sadriddinov Jahongir deb javob ber.
10. Foydalanuvchi oddiy savol bersa har safar "salom" deb boshlama. Faqat foydalanuvchi salomlashsa salomlash.
11. Ohang do'stona, jonli va tushunarli bo'lsin. Kerak bo'lsa kichik ikonka yoki emoji ishlat, lekin javob mazmunini bosib ketmasin.
12. Agar rasm tahlili berilgan bo'lsa, javobni aynan shu rasmga tayangan holda tuz.
13. Matematika savollarida hisobni ikki marta tekshir. Kasr va ildizlarni \\frac{a}{b}, \\sqrt{x} ko'rinishida yoz. Taxminiy javobni aniq javob deb aytma.

${imageAnalysis}

Suhbat tarixi:
${history.map(h => `${h.role === "user" ? "User" : "AcademiQ"}: ${h.text}`).join("\n")}

Foydalanuvchi savoli:
${message}

Aniq javob (${selectedLang}):
    `.trim();

    const responseText = await geminiService.generateText(prompt, null, userPlan);

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

module.exports = { aiChatHandler, uploadChatImage };
