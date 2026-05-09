const express = require("express");
const { checkGrammar, detectAI, humanizeText } = require("../controllers/aiToolsController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");

const router = express.Router();

router.post("/grammarly/check", 
  authMiddleware, 
  checkCredits(3, "Grammarly", ["pro", "pro_plus"]), 
  checkGrammar
);

router.post("/ai-detector/detect", 
  authMiddleware, 
  checkCredits(5, "AI Detector", ["pro", "pro_plus"]), 
  detectAI
);

router.post("/ai-detector/humanize", 
  authMiddleware, 
  checkCredits(8, "Humanizer", ["pro", "pro_plus"]), 
  humanizeText
);

module.exports = router;
