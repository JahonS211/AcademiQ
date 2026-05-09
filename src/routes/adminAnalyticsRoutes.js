const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const { overview, growth, paymentsStats, referralStats, resetAnalytics, detailedHistory } = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.use(adminMiddleware);

router.get("/analytics/overview", overview);
router.get("/analytics/growth", growth);
router.get("/analytics/payments", paymentsStats);
router.get("/analytics/referrals", referralStats);
router.get("/analytics/detailed-history", detailedHistory);
router.post("/analytics/reset", resetAnalytics);

module.exports = router;

