const express = require("express");
const { createManualPayment, uploadReceipt, checkPaymentStatus, getPaymentHistory } = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createManualPayment);
router.post("/upload-receipt", authMiddleware, uploadReceipt);
router.get("/status/:code", authMiddleware, checkPaymentStatus);
router.get("/history", authMiddleware, getPaymentHistory);
router.post("/support", authMiddleware, async (req, res, next) => {
  const { message } = req.body;
  const { sendSupportMessageToAdmin } = require("../utils/telegramBot");
  const Support = require("../models/Support");
  try {
    await Support.create({ userId: req.user._id, message });
    await sendSupportMessageToAdmin(req.user.email, message);
    res.status(200).json({ message: "Xabar yuborildi" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
