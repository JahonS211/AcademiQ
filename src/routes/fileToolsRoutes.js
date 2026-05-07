const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  pdfToWord,
  imageToText,
  compressFile,
  imageToPdf,
  translateText,
} = require("../controllers/fileToolsController");

const router = express.Router();

router.post("/pdf-to-word", authMiddleware, pdfToWord);
router.post("/image-to-text", authMiddleware, imageToText);
router.post("/image-to-pdf", authMiddleware, imageToPdf);
router.post("/compress", authMiddleware, compressFile);
router.post("/translate", authMiddleware, translateText);

module.exports = router;
