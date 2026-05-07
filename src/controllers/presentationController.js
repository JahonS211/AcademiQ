const Presentation = require("../models/Presentation");

const getPresentations = async (req, res, next) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });
    return res.status(200).json({ presentations });
  } catch (error) {
    return next(error);
  }
};

const uploadPresentation = async (req, res, next) => {
  try {
    const { title, category, fileUrl } = req.body;
    const presentation = await Presentation.create({ title, category, fileUrl });
    return res.status(201).json({ message: "Presentation uploaded", presentation });
  } catch (error) {
    return next(error);
  }
};

const { generatePresentationAI } = require("../utils/presentationGenerator");

const generateAIPresentation = async (req, res, next) => {
  try {
    const { topic, language } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const result = await generatePresentationAI({ 
      topic, 
      language: language || "uz",
      slideCount: 7 
    });

    const presentation = await Presentation.create({
      userId: req.user._id,
      title: result.title,
      category: "AI Generated",
      fileUrl: result.fileUrl
    });

    return res.status(201).json({
      message: "Presentation generated successfully",
      presentation
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPresentations,
  uploadPresentation,
  generateAIPresentation
};
