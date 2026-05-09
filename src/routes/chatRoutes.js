const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { aiChatHandler } = require("../controllers/chatController");
const { CHAT } = require("../config/creditCosts");

const router = express.Router();

router.post("/chat", authMiddleware, checkCredits(1, "AI Chat", ["pro", "pro_plus"]), aiChatHandler);

module.exports = router;
