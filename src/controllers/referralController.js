const Referral = require("../models/Referral");
const User = require("../models/User");

const getMyReferralStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const total = await Referral.countDocuments({ referrerUserId: user._id });
    const paid = await Referral.countDocuments({ referrerUserId: user._id, status: "paid" });
    const recent = await Referral.find({ referrerUserId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("referredUserId", "email name createdAt");

    return res.status(200).json({
      referralCode: user.referralCode,
      referralLink: `${process.env.PUBLIC_WEB_URL || "http://localhost:3001"}/register?ref=${user.referralCode}`,
      totalReferrals: total,
      paidReferrals: paid,
      referralEarnings: user.referralEarnings || 0,
      recent,
    });
  } catch (e) {
    return next(e);
  }
};

const adminReferralStats = async (req, res, next) => {
  try {
    const total = await Referral.countDocuments({});
    const paid = await Referral.countDocuments({ status: "paid" });
    const top = await Referral.aggregate([
      { $group: { _id: "$referrerUserId", total: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } } } },
      { $sort: { paid: -1, total: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({ total, paid, top });
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  getMyReferralStats,
  adminReferralStats,
};

