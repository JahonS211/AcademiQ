const User = require("../models/User");
const Payment = require("../models/Payment");
const Referral = require("../models/Referral");

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
    const referralTotal = await Referral.countDocuments({});
    const referralPaid = await Referral.countDocuments({ status: "paid" });

    return res.status(200).json({
      totalUsers,
      activeUsers,
      payments,
      revenue,
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

module.exports = { overview, growth, paymentsStats, referralStats };

