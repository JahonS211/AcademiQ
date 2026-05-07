const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getMyReferralStats, adminReferralStats } = require("../controllers/referralController");

const router = express.Router();

router.get("/referrals/me", authMiddleware, getMyReferralStats);
router.get("/admin/referrals/stats", adminMiddleware, adminReferralStats);

module.exports = router;

