const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { generateEssayHandler } = require("../controllers/essayController");
const { getMyEssays } = require("../controllers/essayHistoryController");

const router = express.Router();

router.post("/generate-essay", authMiddleware, generateEssayHandler);
router.get("/essays", authMiddleware, getMyEssays);

module.exports = router;
