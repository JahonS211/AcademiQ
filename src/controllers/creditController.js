const CreditHistory = require("../models/CreditHistory");
const User = require("../models/User");

const getCreditHistory = async (req, res, next) => {
  try {
    const history = await CreditHistory.find({ userId: req.user.id || req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedHistory = history.map(h => ({
      _id: h._id,
      actionType: h.toolName,
      amount: h.creditsUsed,
      description: h.details,
      createdAt: h.createdAt
    }));

    return res.status(200).json({ history: formattedHistory });
  } catch (error) {
    return next(error);
  }
};

const purchaseCredits = async (req, res, next) => {
  try {
    const { amount, pkgId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Yaroqsiz miqdor" });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    user.credits += parseInt(amount);
    await user.save();

    await CreditHistory.create({
      userId: user._id,
      toolName: "Credit Refill",
      creditsUsed: 0,
      details: `Purchased ${amount} credits (Pkg: ${pkgId || 'manual'})`
    });

    return res.status(200).json({ 
      success: true, 
      message: `${amount} ta kredit muvaffaqiyatli qo'shildi!`,
      newBalance: user.credits 
    });
  } catch (error) {
    console.error("Purchase Credit Error:", error);
    return res.status(500).json({ success: false, message: "Kredit sotib olishda xatolik yuz berdi" });
  }
};

module.exports = { getCreditHistory, purchaseCredits };
