const express = require("express");
const { getTests, submitTest, generateAITest } = require("../controllers/testController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/tests", getTests);
router.post("/tests/generate", authMiddleware, generateAITest);
router.post("/submit-test", authMiddleware, submitTest);

module.exports = router;
