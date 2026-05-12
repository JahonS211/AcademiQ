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
const { pdfToWordCost, imageToTextCost, imageToPdfCost, compressCost } = require("../config/dynamicCreditCosts");

const router = express.Router();

router.post("/pdf-to-word", authMiddleware, checkCredits(pdfToWordCost, "PDF-to-Word", ["pro", "pro_plus"]), pdfToWord);
router.post("/image-to-text", authMiddleware, checkCredits(imageToTextCost, "OCR", ["pro", "pro_plus"]), imageToText);
router.post("/image-to-pdf", authMiddleware, checkCredits(imageToPdfCost, "Image-to-PDF", ["pro", "pro_plus"]), imageToPdf);
router.post("/compress", authMiddleware, checkCredits(compressCost, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/zip", authMiddleware, checkCredits(compressCost, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/zip-tool", authMiddleware, checkCredits(compressCost, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/tools/compress", authMiddleware, checkCredits(compressCost, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/file-tools/compress", authMiddleware, checkCredits(compressCost, "Compress", ["pro", "pro_plus"]), compressFile);
router.post("/translate", authMiddleware, translateText);

module.exports = router;

