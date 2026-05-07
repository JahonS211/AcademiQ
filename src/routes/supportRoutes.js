const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { sendSupportMessage } = require("../controllers/supportController");

const router = express.Router();

router.post("/support", authMiddleware, sendSupportMessage);

module.exports = router;
