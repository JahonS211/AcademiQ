const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");
const geminiService = require("../services/gemini.service");

const createZipArchive = (options) => {
  if (typeof archiver === "function") return archiver("zip", options);
  if (typeof archiver.ZipArchive === "function") return new archiver.ZipArchive(options);
  throw new Error("Unsupported archiver package version");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const uploadSingle = multer({ storage }).single("file");
const uploadMultiple = multer({ storage }).array("files", 20); // Up to 20 files for ZIP

const handleToolRequest = async (req, res, next, mockResponse) => {
  try {
    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits();
    }
    return res.status(200).json({ success: true, ...mockResponse, remainingCredits });
  } catch (error) {
    console.error("Tool Request Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in tool" });
  }
};

const pdfToWord = (req, res, next) =>
  handleToolRequest(req, res, next, {
    message: "PDF to Word conversion completed",
    resultUrl: "/uploads/mock-output.docx",
  });

const imageToText = async (req, res, next) => {
  uploadSingle(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: "Upload failed" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    try {
      const prompt = `
        Sen professional OCR asbobisan. Ushbu rasmdagi barcha matnlarni aniqlik bilan chiqarib ber. 
        Agar rasmda qo'lyozma bo'lsa, uni ham o'qishga harakat qil. 
        Matn tarkibini va strukturasini buzmasdan, tushunarli formatda qaytar.
      `.trim();
      const ext = path.extname(req.file.path).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

      const extractedText = await geminiService.generateFromImage(prompt, fs.readFileSync(req.file.path), mimeType);

      if (!extractedText || typeof extractedText !== "string" || extractedText.error) {
        return res.status(503).json({ 
          success: false, 
          message: extractedText?.error || "OCR analysis failed. Please try again." 
        });
      }

      let remainingCredits = null;
      if (req.deductCredits) {
        remainingCredits = await req.deductCredits(`OCR: ${req.file.originalname}`);
      }

      // Cleanup
      fs.unlink(req.file.path, () => {});

      res.status(200).json({
        success: true,
        message: "OCR completed successfully",
        extractedText,
        remainingCredits,
      });
    } catch (error) {
      console.error("OCR Error:", error);
      if (req.file) fs.unlink(req.file.path, () => {}); 
      return res.status(500).json({ success: false, message: "Error processing image for OCR" });
    }
  });
};

const compressFile = async (req, res, next) => {
  uploadMultiple(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: "Upload failed" });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No files provided" });

    const fileName = `archive-${Date.now()}.zip`;
    const filePath = path.join(process.cwd(), "uploads", fileName);
    const output = fs.createWriteStream(filePath);
    const archive = createZipArchive({ zlib: { level: 9 } });

    output.on("close", async () => {
      let remainingCredits = null;
      if (req.deductCredits) {
        try {
          remainingCredits = await req.deductCredits(`ZIP: ${req.files.length} files`);
        } catch (e) {
          console.error("Credit deduction failed in ZIP:", e);
        }
      }

      // Cleanup original files
      req.files.forEach(f => {
        try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(e) {}
      });

      res.status(200).json({
        success: true,
        message: "Files zipped successfully",
        resultUrl: `/uploads/${fileName}`,
        remainingCredits,
      });
    });

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error creating zip archive" });
      }
    });

    archive.pipe(output);

    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.originalname });
      }
    });

    try {
      await archive.finalize();
    } catch (e) {
      console.error("Finalize error:", e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error finalizing zip archive" });
      }
    }
  });
};

const imageToPdf = async (req, res, next) => {
  uploadSingle(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: "Upload failed" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    try {
      let remainingCredits = null;
      if (req.deductCredits) {
        remainingCredits = await req.deductCredits(`Image to PDF: ${req.file.originalname}`);
      }

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
        fs.unlink(req.file.path, () => {});
        res.status(200).json({
          success: true,
          message: "Converted successfully",
          resultUrl: `/uploads/${fileName}`,
          remainingCredits,
        });
      });
    } catch (error) {
      console.error("Image to PDF Error:", error);
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ success: false, message: "Error converting image to PDF" });
    }
  });
};

const translateText = async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ success: false, message: "Text and targetLanguage are required" });
    }

    const prompt = `Translate the following text into ${targetLanguage}. Return ONLY the translated text.\n\nText: "${text}"`;
    const translatedText = await geminiService.generateText(prompt, null, req.user.plan || "free");

    if (!translatedText || translatedText.error) {
      return res.status(503).json({ 
        success: false, 
        message: translatedText?.error || "Translation failed. AI service unavailable." 
      });
    }

    return res.status(200).json({ success: true, translatedText, remainingCredits: null });
  } catch (error) {
    console.error("Translation Handler Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in translation" });
  }
};

module.exports = {
  pdfToWord,
  imageToText,
  compressFile,
  imageToPdf,
  translateText
};
