const express = require("express");
const { getPresentations, uploadPresentation, generateAIPresentation } = require("../controllers/presentationController");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/presentations", getPresentations);
router.post("/presentations/generate", authMiddleware, generateAIPresentation);
router.post("/admin/upload", adminMiddleware, uploadPresentation);

module.exports = router;
