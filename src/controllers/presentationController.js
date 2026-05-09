const Presentation = require("../models/Presentation");
const { generatePresentationAI } = require("../utils/presentationGenerator");

const getPresentations = async (req, res, next) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, presentations });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch presentations" });
  }
};

const uploadPresentation = async (req, res, next) => {
  try {
    const { title, category, fileUrl } = req.body;
    const presentation = await Presentation.create({ title, category, fileUrl });
    return res.status(201).json({ success: true, message: "Presentation uploaded", presentation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

const generateAIPresentation = async (req, res, next) => {
  try {
    const { topic, language } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: "Topic is required" });
    const selectedLanguage = ["uz", "ru", "en"].includes(language) ? language : "uz";

    const result = await generatePresentationAI({ 
      topic, 
      language: selectedLanguage,
      slideCount: 7,
      userPlan: req.user.plan || "free"
    });

    const presentation = await Presentation.create({
      userId: req.user.id || req.user._id,
      title: result.title,
      category: "AI Generated",
      fileUrl: result.fileUrl
    });

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Presentation: ${topic.slice(0, 30)}`);
    }

    return res.status(201).json({
      success: true,
      message: "Presentation generated successfully",
      presentation,
      remainingCredits,
    });
  } catch (error) {
    console.error("Presentation Generation Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate presentation" });
  }
};

module.exports = {
  getPresentations,
  uploadPresentation,
  generateAIPresentation
};
