const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { ESSAY } = require("../config/creditCosts");

const { generateEssayHandler, getMyEssays } = require("../controllers/essayController");

const router = express.Router();

router.post("/generate-essay", authMiddleware, checkCredits(10, "Essay", ["free", "pro", "pro_plus"]), generateEssayHandler);
router.get("/essays", authMiddleware, getMyEssays);

module.exports = router;
