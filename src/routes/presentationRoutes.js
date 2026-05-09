const express = require("express");
const { getPresentations, uploadPresentation, generateAIPresentation } = require("../controllers/presentationController");
const { authMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { checkCredits } = require("../middleware/creditMiddleware");

const router = express.Router();

router.get("/presentations", getPresentations);
router.post("/presentations/generate", authMiddleware, checkCredits(10, "Presentation", ["pro", "pro_plus"]), generateAIPresentation);
router.post("/admin/upload", adminMiddleware, uploadPresentation);

module.exports = router;
