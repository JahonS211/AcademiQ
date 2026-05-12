const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { essayCost } = require("../config/dynamicCreditCosts");

const { generateEssayHandler, getMyEssays } = require("../controllers/essayController");

const router = express.Router();

router.post("/generate-essay", authMiddleware, checkCredits(essayCost, "Essay", ["free", "pro", "pro_plus"]), generateEssayHandler);
router.get("/essays", authMiddleware, getMyEssays);

module.exports = router;
