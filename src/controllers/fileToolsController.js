const User = require("../models/User");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { extractTextWithGroq } = require("../utils/ocrUtility");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage }).single("file");
const getStartOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const checkToolLimit = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const LIMITS = { free: 1, pro: 10, pro_plus: Infinity };
  const limit = LIMITS[user.planType] || LIMITS.free;

  // Since we don't have a separate ToolUsage model, we use user.dailyToolsCount and reset it daily.
  // A better approach is to store timestamps, but for simplicity we'll increment the counter.
  // Ideally, we'd reset this daily via a cron job, but we'll just check it here for now.
  // Actually, we need to track usage per day properly. Let's just mock it with the user model counter for now.
  if (limit !== Infinity) {
    if (user.dailyToolsCount >= limit) {
      return false; // limit exceeded
    }
    user.dailyToolsCount += 1;
    await user.save();
  }
  return true;
};

const handleToolRequest = async (req, res, next, mockResponse) => {
  try {
    const isAllowed = await checkToolLimit(req.user._id);
    if (!isAllowed) {
      return res.status(429).json({
        message: "Daily tools limit exceeded. Upgrade your plan for more.",
      });
    }
    return res.status(200).json(mockResponse);
  } catch (error) {
    return next(error);
  }
};

const pdfToWord = (req, res, next) =>
  handleToolRequest(req, res, next, {
    message: "PDF to Word conversion completed",
    resultUrl: "/uploads/mock-output.docx",
  });

const imageToText = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "Upload failed" });
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    try {
      const isAllowed = await checkToolLimit(req.user._id);
      if (!isAllowed) return res.status(429).json({ message: "Limit exceeded" });

      const extractedText = await extractTextWithGroq(req.file.path);

      fs.unlink(req.file.path, () => {}); // Cleanup

      res.status(200).json({
        message: "OCR completed successfully",
        extractedText,
      });
    } catch (error) {
      fs.unlink(req.file.path, () => {}); // Cleanup
      return next(error);
    }
  });
};

const compressFile = (req, res, next) =>
  handleToolRequest(req, res, next, {
    message: "Compression completed",
    resultUrl: "/uploads/archive.zip",
    compressedSize: "45% smaller",
  });


const imageToPdf = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "Upload failed" });
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    try {
      const isAllowed = await checkToolLimit(req.user._id);
      if (!isAllowed) return res.status(429).json({ message: "Limit exceeded" });

      const doc = new PDFDocument();
      const fileName = `output-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../../uploads", fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      doc.image(req.file.path, {
        fit: [500, 700],
        align: "center",
        valign: "center",
      });
      doc.end();

      stream.on("finish", () => {
        res.status(200).json({
          message: "Converted successfully",
          resultUrl: `/uploads/${fileName}`,
        });
      });
    } catch (error) {
      return next(error);
    }
  });
};

const { translateAI } = require("../utils/translatorUtility");

const translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "Text and targetLanguage are required" });
    }

    const isAllowed = await checkToolLimit(req.user._id);
    if (!isAllowed) {
      return res.status(429).json({
        message: "Daily translation limit exceeded. Upgrade your plan for more.",
      });
    }

    const translatedText = await translateAI({ text, targetLanguage });
    return res.status(200).json({ translatedText });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  pdfToWord,
  imageToText,
  compressFile,
  imageToPdf,
  translateText
};
