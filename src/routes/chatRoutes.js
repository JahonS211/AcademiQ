const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { aiChatHandler, uploadChatImage } = require("../controllers/chatController");
const { chatCost } = require("../config/dynamicCreditCosts");

const router = express.Router();

router.post("/chat", authMiddleware, uploadChatImage, checkCredits(chatCost, "AI Chat", ["pro", "pro_plus"]), aiChatHandler);

module.exports = router;

