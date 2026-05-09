const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  pdfToWord,
  imageToText,
  compressFile,
  imageToPdf,
  translateText,
} = require("../controllers/fileToolsController");

const { checkCredits } = require("../middleware/creditMiddleware");

const router = express.Router();

router.post("/pdf-to-word", authMiddleware, checkCredits(2, "PDF-to-Word", ["pro", "pro_plus"]), pdfToWord);
router.post("/image-to-text", authMiddleware, checkCredits(3, "OCR", ["pro", "pro_plus"]), imageToText);
router.post("/image-to-pdf", authMiddleware, checkCredits(2, "Image-to-PDF", ["free", "pro", "pro_plus"]), imageToPdf);
router.post("/compress", authMiddleware, checkCredits(1, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/translate", authMiddleware, translateText);

module.exports = router;
