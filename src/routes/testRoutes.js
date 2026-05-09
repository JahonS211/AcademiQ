const express = require("express");
const { getTests, submitTest, generateAITest } = require("../controllers/testController");
const { authMiddleware } = require("../middleware/authMiddleware");

const { checkCredits } = require("../middleware/creditMiddleware");

const router = express.Router();

router.get("/tests", getTests);
router.post("/tests/generate", authMiddleware, checkCredits(5, "Quiz/Test", ["pro", "pro_plus"]), generateAITest);
router.post("/submit-test", authMiddleware, submitTest);

module.exports = router;
