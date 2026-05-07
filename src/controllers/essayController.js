const Essay = require("../models/Essay");
const User = require("../models/User");
const { generateEssay } = require("../utils/essayGenerator");

const DAILY_LIMIT = 3;

const getStartOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const generateEssayHandler = async (req, res, next) => {
  try {
    const { topic, language, length } = req.body;
    const validLanguages = ["uz", "ru", "en"];
    const validLengths = ["short", "medium", "long"];

    if (!topic || !language || !length) {
      return res.status(400).json({ message: "topic, language and length are required" });
    }

    if (!validLanguages.includes(language)) {
      return res.status(400).json({ message: "language must be uz, ru, or en" });
    }

    if (!validLengths.includes(length)) {
      return res.status(400).json({ message: "length must be short, medium, or long" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const LIMITS = { free: 3, pro: 10, pro_plus: Infinity };
    const limit = LIMITS[user.planType] || LIMITS.free;

    if (limit !== Infinity) {
      const todayCount = await Essay.countDocuments({
        userId: user._id,
        createdAt: { $gte: getStartOfDay() },
      });

      if (todayCount >= limit) {
        return res.status(429).json({
          message: `Daily essay limit (${limit}) exceeded. Upgrade your plan for more.`,
        });
      }
    }

    const generated = await generateEssay({ topic, language, length });

    // Validate and sanitize content
    if (!generated.introduction || !generated.body || !generated.conclusion) {
      throw new Error("Generated essay is missing required sections");
    }

    const essayContent = {
      introduction: String(generated.introduction || ""),
      body: String(generated.body || ""),
      conclusion: String(generated.conclusion || ""),
    };

    const savedEssay = await Essay.create({
      userId: user._id,
      topic,
      content: essayContent,
    });

    if (limit !== Infinity) {
      user.dailyEssayCount = await Essay.countDocuments({
        userId: user._id,
        createdAt: { $gte: getStartOfDay() },
      });
      await user.save();
    }

    return res.status(201).json({
      message: "Essay generated successfully",
      essay: {
        content: {
          introduction: essayContent.introduction,
          body: essayContent.body,
          conclusion: essayContent.conclusion,
        }
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateEssayHandler,
};
