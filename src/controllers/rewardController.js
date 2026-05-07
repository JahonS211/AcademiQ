const RewardLedger = require("../models/RewardLedger");
const User = require("../models/User");

const getMyRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const ledger = await RewardLedger.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({
      rewardBalance: user.rewardBalance || 0,
      rewardUsedTotal: user.rewardUsedTotal || 0,
      ledger,
    });
  } catch (e) {
    return next(e);
  }
};

// Calculates discount if user wants to apply rewards to a purchase amount.
const applyRewards = async (req, res, next) => {
  try {
    const { amount, useRewards } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: "amount must be > 0" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const balance = Number(user.rewardBalance || 0);
    const applied = useRewards ? Math.min(balance, amt) : 0;
    const finalAmount = Math.max(amt - applied, 0);

    return res.status(200).json({
      amount: amt,
      rewardBalance: balance,
      appliedRewards: applied,
      finalAmount,
    });
  } catch (e) {
    return next(e);
  }
};

module.exports = { getMyRewards, applyRewards };

