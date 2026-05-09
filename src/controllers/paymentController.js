const { v4: uuidv4 } = require("uuid");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { sendPaymentRequestToAdmin } = require("../utils/telegramBot");
const PromoCode = require("../models/PromoCode");

const PRICES = {
  pro: 14990,
  pro_plus: 24990,
  credit_unit: 100, // 100 UZS per credit
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
    const { plan, promoCode = "", useRewards = false, type = "plan", amount: requestedAmount } = req.body;
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let originalAmount = 0;
    let creditAmount = 0;

    if (type === "plan") {
      if (!PRICES[plan]) return res.status(400).json({ message: "Invalid plan" });
      if (user.planType === "pro_plus") {
        return res.status(400).json({ message: "Sizda allaqachon eng yuqori tarif (Pro+) mavjud" });
      }
      if (user.planType === plan) {
        return res.status(400).json({ message: `Sizda allaqachon ${plan.toUpperCase()} tarifi mavjud` });
      }

      originalAmount = PRICES[plan];
      // Upgrade logic
      if (user.planType === "pro" && plan === "pro_plus") {
        const lastProPayment = await Payment.findOne({ 
          userId, 
          plan: "pro", 
          status: "paid" 
        }).sort({ createdAt: -1 });
        const paidAmount = lastProPayment ? lastProPayment.amount : PRICES["pro"];
        originalAmount = Math.max(PRICES["pro_plus"] - paidAmount, 0);
      }
    } else if (type === "credits") {
      creditAmount = Number(requestedAmount);
      if (!creditAmount || creditAmount <= 0) return res.status(400).json({ message: "Kredit miqdorini kiriting" });
      originalAmount = creditAmount * PRICES.credit_unit;
    } else {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    let discountPercent = 0;
    let normalizedPromo = "";

    if (promoCode) {
      normalizedPromo = String(promoCode).trim().toUpperCase();
      const promo = await PromoCode.findOne({ code: normalizedPromo, active: true });
      if (!promo) return res.status(400).json({ message: "Invalid promo code" });
      
      // Check if promo type matches
      if (promo.type !== "both" && promo.type !== type) {
        return res.status(400).json({ message: `Ushbu promo-kod faqat ${promo.type === 'plan' ? 'tariflar' : 'kreditlar'} uchun amal qiladi` });
      }

      if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: "Promo code expired" });
      }
      if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
        return res.status(400).json({ message: "Promo code usage limit reached" });
      }

      const alreadyUsed = await Payment.findOne({
        userId: userId,
        promoCode: normalizedPromo,
        status: "paid"
      });
      if (alreadyUsed) return res.status(400).json({ message: "Siz ushbu promo-koddan foydalanib bo'lgansiz" });

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
      type,
      plan: type === "plan" ? plan : undefined,
      creditAmount: type === "credits" ? creditAmount : 0,
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
        type: payment.type,
        plan: payment.plan,
        creditAmount: payment.creditAmount,
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
