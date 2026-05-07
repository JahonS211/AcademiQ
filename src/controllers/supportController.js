const User = require("../models/User");
const Support = require("../models/Support");
const { sendSupportMessageToAdmin } = require("../utils/telegramBot");

const sendSupportMessage = async (req, res, next) => {
  try {
    const { message, subject } = req.body;
    if (!message) return res.status(400).json({ message: "Xabar bo'sh bo'lmasligi kerak" });

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Save to DB
    await Support.create({ userId: user._id, message: `[${subject || "Umumiy"}] ${message}` });

    // Send to Telegram Admin
    await sendSupportMessageToAdmin(user.email, `📌 Mavzu: ${subject || "Umumiy"}\n\n${message}`);

    return res.status(200).json({ message: "Xabaringiz muvaffaqiyatli yuborildi!" });
  } catch (error) {
    console.error("Support error:", error);
    return next(error);
  }
};

module.exports = { sendSupportMessage };
