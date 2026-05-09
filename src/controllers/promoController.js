const PromoCode = require("../models/PromoCode");
const Payment = require("../models/Payment");

const createPromoCode = async (req, res, next) => {
  try {
    const { code, discountPercent, expiresAt = null, usageLimit = 0 } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ message: "code and discountPercent are required" });
    }

    const promo = await PromoCode.create({
      code: String(code).trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: Number(usageLimit) || 0,
      type: req.body.type || "both",
      createdByAdminEmail: req.admin?.email || "",
    });

    return res.status(201).json({ promo });
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ message: "Promo code already exists" });
    }
    return next(e);
  }
};

const validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "code is required" });
    const normalized = String(code).trim().toUpperCase();

    const promo = await PromoCode.findOne({ code: normalized, active: true });
    if (!promo) return res.status(404).json({ message: "Promo code not found" });

    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Promo code expired" });
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: "Promo code usage limit reached" });
    }

    // Per-user check
    const alreadyUsed = await Payment.findOne({
      userId: req.user._id,
      promoCode: normalized,
      status: "paid"
    });

    if (alreadyUsed) {
      return res.status(400).json({ message: "Siz ushbu promo-koddan foydalanib bo'lgansiz" });
    }

    return res.status(200).json({
      promo: {
        code: promo.code,
        discountPercent: promo.discountPercent,
        expiresAt: promo.expiresAt,
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount,
        type: promo.type,
      },
    });
  } catch (e) {
    return next(e);
  }
};

const getPromoCodes = async (req, res, next) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return res.status(200).json({ promos });
  } catch (e) {
    return next(e);
  }
};

const deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await PromoCode.findByIdAndDelete(id);
    return res.status(200).json({ message: "Promo code deleted" });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  createPromoCode,
  validatePromoCode,
  getPromoCodes,
  deletePromoCode,
};

