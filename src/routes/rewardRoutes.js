const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getMyRewards, applyRewards } = require("../controllers/rewardController");

const router = express.Router();

router.get("/rewards/me", authMiddleware, getMyRewards);
router.post("/rewards/apply", authMiddleware, applyRewards);

module.exports = router;

