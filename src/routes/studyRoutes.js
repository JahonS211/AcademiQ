const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkCredits } = require("../middleware/creditMiddleware");
const { solveHomeworkHandler, generateFlashcardsHandler } = require("../controllers/studyController");

const router = express.Router();

router.post("/homework-solver", authMiddleware, checkCredits(5, "Homework Solver", ["pro", "pro_plus"]), solveHomeworkHandler);
router.post("/flashcards", authMiddleware, checkCredits(4, "Flashcards", ["pro", "pro_plus"]), generateFlashcardsHandler);

module.exports = router;
