const { v4: uuidv4 } = require("uuid");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { sendPaymentRequestToAdmin } = require("../utils/telegramBot");
const PromoCode = require("../models/PromoCode");

const PRICES = {
  pro: 17990,
  pro_plus: 27990,
};

const multer = require("multer");
const path = require("path");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage }).single("receipt");

const createManualPayment = async (req, res, next) => {
  try {
    const { plan, promoCode = "", useRewards = false } = req.body;
    if (!PRICES[plan]) return res.status(400).json({ message: "Invalid plan" });

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const originalAmount = PRICES[plan];
    let discountPercent = 0;
    let normalizedPromo = "";

    if (promoCode) {
      normalizedPromo = String(promoCode).trim().toUpperCase();
      const promo = await PromoCode.findOne({ code: normalizedPromo, active: true });
      if (!promo) return res.status(400).json({ message: "Invalid promo code" });
      if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: "Promo code expired" });
      }
      if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
        return res.status(400).json({ message: "Promo code usage limit reached" });
      }
      discountPercent = Number(promo.discountPercent || 0);
    }

    const promoDiscount = Math.floor((originalAmount * discountPercent) / 100);
    const afterPromo = Math.max(originalAmount - promoDiscount, 0);

    const balance = Number(user.rewardBalance || 0);
    const rewardsApplied = useRewards ? Math.min(balance, afterPromo) : 0;
    const finalAmount = Math.max(afterPromo - rewardsApplied, 0);

    const code = `PAY_${uuidv4().substring(0, 6).toUpperCase()}`;

    const payment = await Payment.create({
      userId,
      amount: finalAmount,
      originalAmount,
      promoCode: normalizedPromo,
      promoDiscountPercent: discountPercent,
      rewardsApplied,
      plan,
      code,
      status: "pending",
    });

    return res.status(201).json({
      message: "Payment created successfully",
      payment: {
        id: payment._id,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        promoCode: payment.promoCode,
        promoDiscountPercent: payment.promoDiscountPercent,
        rewardsApplied: payment.rewardsApplied,
        plan: payment.plan,
        code: payment.code,
        status: payment.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const uploadReceipt = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "Upload failed" });
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    try {
      const { paymentId } = req.body;
      const payment = await Payment.findById(paymentId);
      if (!payment) return res.status(404).json({ message: "Payment not found" });

      payment.receiptUrl = req.file.path;
      await payment.save();

      const user = await User.findById(payment.userId);
      // Send notification to admin after receipt is uploaded
      await sendPaymentRequestToAdmin(payment, user.email);

      return res.status(200).json({ message: "Receipt uploaded and admin notified", status: payment.status });
    } catch (error) {
      return next(error);
    }
  });
};

const checkPaymentStatus = async (req, res, next) => {
  try {
    const { code } = req.params;
    const payment = await Payment.findOne({ code, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    return res.status(200).json({ 
      status: payment.status,
      payment: {
        id: payment._id,
        plan: payment.plan,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const history = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ history });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createManualPayment,
  uploadReceipt,
  checkPaymentStatus,
  getPaymentHistory,
};
