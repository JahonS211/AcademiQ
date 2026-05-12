const TestSubmission = require("../models/TestSubmission");

const mockTests = [
  {
    id: 1,
    title: "English Grammar Basics",
    questions: 10,
    durationMinutes: 15,
  },
  {
    id: 2,
    title: "Math Logic Test",
    questions: 12,
    durationMinutes: 20,
  },
];

const getTests = async (req, res, next) => {
  try {
    return res.status(200).json({ tests: mockTests });
  } catch (error) {
    return next(error);
  }
};

const submitTest = async (req, res, next) => {
  try {
    const { answers = [], score = 0 } = req.body;
    const submission = await TestSubmission.create({
      userId: req.user._id,
      answers,
      score,
    });
    return res.status(201).json({ message: "Test submitted", submission });
  } catch (error) {
    return next(error);
  }
};

const { generateTestAI } = require("../utils/testGenerator");

const generateAITest = async (req, res, next) => {
  try {
    const { topic, language, questionCount } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const parsedQuestionCount = Number(questionCount);
    const safeQuestionCount = [5, 10, 15, 20].includes(parsedQuestionCount)
      ? parsedQuestionCount
      : 10;

    const test = await generateTestAI({ 
      topic, 
      language: language || "uz",
      questionCount: safeQuestionCount,
      userPlan: req.user.planType || req.user.plan || "free"
    });

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Topic: ${topic}`);
    }

    return res.status(200).json({
      message: "Test generated successfully",
      test,
      remainingCredits,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTests,
  submitTest,
  generateAITest
};
