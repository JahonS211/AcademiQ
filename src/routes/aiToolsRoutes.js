const express = require("express");
const { checkGrammar, detectAI, humanizeText } = require("../controllers/aiToolsController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { grammarlyCost, aiDetectorCost, humanizerCost } = require("../config/dynamicCreditCosts");

const router = express.Router();

router.post("/grammarly/check", 
  authMiddleware, 
  checkCredits(grammarlyCost, "Grammarly", ["pro", "pro_plus"]), 
  checkGrammar
);

router.post("/ai-detector/detect", 
  authMiddleware, 
  checkCredits(aiDetectorCost, "AI Detector", ["pro", "pro_plus"]), 
  detectAI
);

router.post("/ai-detector/humanize", 
  authMiddleware, 
  checkCredits(humanizerCost, "Humanizer", ["pro", "pro_plus"]), 
  humanizeText
);

module.exports = router;

