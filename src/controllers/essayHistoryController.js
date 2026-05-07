const Essay = require("../models/Essay");

const getMyEssays = async (req, res, next) => {
  try {
    const essays = await Essay.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ essays });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyEssays };
