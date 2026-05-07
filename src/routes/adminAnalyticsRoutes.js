const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { overview, growth, paymentsStats, referralStats } = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.use(adminMiddleware);

router.get("/analytics/overview", overview);
router.get("/analytics/growth", growth);
router.get("/analytics/payments", paymentsStats);
router.get("/analytics/referrals", referralStats);

module.exports = router;

