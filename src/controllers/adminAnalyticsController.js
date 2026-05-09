const User = require("../models/User");
const Payment = require("../models/Payment");
const Referral = require("../models/Referral");
const CreditHistory = require("../models/CreditHistory");
const RewardLedger = require("../models/RewardLedger");

const overview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    const payments = await Payment.countDocuments({ status: "paid" });
    const revenueAgg = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ]);
    const revenue = revenueAgg[0]?.revenue || 0;
    
    const creditsUsedAgg = await CreditHistory.aggregate([
      { $group: { _id: null, total: { $sum: "$creditsUsed" } } }
    ]);
    const creditsUsed = creditsUsedAgg[0]?.total || 0;

    const rewardsEarnedAgg = await RewardLedger.aggregate([
      { $match: { type: "earn" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const rewardsEarned = rewardsEarnedAgg[0]?.total || 0;

    const referralTotal = await Referral.countDocuments({});
    const referralPaid = await Referral.countDocuments({ status: "paid" });

    return res.status(200).json({
      totalUsers,
      activeUsers,
      payments,
      revenue,
      creditsUsed,
      rewardsEarned,
      referralTotal,
      referralPaid,
    });
  } catch (e) {
    return next(e);
  }
};

const growth = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || "30", 10), 7), 180);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usersSeries = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueSeries = await Payment.aggregate([
      { $match: { status: "paid", createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          payments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({ usersSeries, revenueSeries });
  } catch (e) {
    return next(e);
  }
};

const resetAnalytics = async (req, res, next) => {
  try {
    // Delete payment history, credit history, and reward history
    // We don't delete Users or Referrals, just the transactional history
    await Payment.deleteMany({});
    await CreditHistory.deleteMany({});
    await RewardLedger.deleteMany({});
    
    return res.status(200).json({ success: true, message: "Analytics history reset successfully" });
  } catch (e) {
    return next(e);
  }
};

const detailedHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    
    const payments = await Payment.find({ status: "paid" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");

    const credits = await CreditHistory.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");

    const rewards = await RewardLedger.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");

    return res.status(200).json({ payments, credits, rewards });
  } catch (e) {
    return next(e);
  }
};

const paymentsStats = async (req, res, next) => {
  try {
    const topPlans = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$plan", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      { $sort: { revenue: -1 } },
    ]);
    return res.status(200).json({ topPlans });
  } catch (e) {
    return next(e);
  }
};

const referralStats = async (req, res, next) => {
  try {
    const total = await Referral.countDocuments({});
    const paid = await Referral.countDocuments({ status: "paid" });
    return res.status(200).json({ total, paid });
  } catch (e) {
    return next(e);
  }
};

module.exports = { overview, growth, paymentsStats, referralStats, resetAnalytics, detailedHistory };

