const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { homeworkCost, flashcardsCost } = require("../config/dynamicCreditCosts");
const { solveHomeworkHandler, generateFlashcardsHandler } = require("../controllers/studyController");

const router = express.Router();
const uploadStudyImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype || "")) {
      return cb(new Error("Faqat PNG, JPG yoki WEBP rasm yuklang"));
    }
    return cb(null, true);
  },
}).single("image");

router.post("/homework-solver", authMiddleware, uploadStudyImage, checkCredits(homeworkCost, "Homework Solver", ["pro", "pro_plus"]), solveHomeworkHandler);
router.post("/flashcards", authMiddleware, checkCredits(flashcardsCost, "Flashcards", ["pro", "pro_plus"]), generateFlashcardsHandler);

module.exports = router;

