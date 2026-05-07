const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { createPromoCode, validatePromoCode, getPromoCodes, deletePromoCode } = require("../controllers/promoController");

const router = express.Router();

router.get("/admin/promo", adminMiddleware, getPromoCodes);
router.post("/admin/promo", adminMiddleware, createPromoCode);
router.delete("/admin/promo/:id", adminMiddleware, deletePromoCode);

router.post("/promo/validate", authMiddleware, validatePromoCode);

module.exports = router;

