const User = require("../models/User");

const pingPresence = async (req, res, next) => {
  try {
    const now = new Date();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Streak logic
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate.getFullYear(), user.lastLoginDate.getMonth(), user.lastLoginDate.getDate()) : null;

    let updated = false;

    if (!lastLogin) {
      user.loginStreak = 1;
      user.lastLoginDate = now;
      updated = true;
    } else {
      const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        user.loginStreak = (user.loginStreak || 0) + 1;
        user.lastLoginDate = now;
        updated = true;
      } else if (diffDays > 1) {
        user.loginStreak = 1;
        user.lastLoginDate = now;
        updated = true;
      }
    }

    // Reward Logic: If streak >= 2, give 500 rewards once a week
    if (user.loginStreak >= 2) {
      const lastReward = user.lastWeeklyRewardDate ? new Date(user.lastWeeklyRewardDate.getFullYear(), user.lastWeeklyRewardDate.getMonth(), user.lastWeeklyRewardDate.getDate()) : null;
      let giveReward = false;
      
      if (!lastReward) {
        giveReward = true;
      } else {
        const diffRewardDays = Math.floor((today - lastReward) / (1000 * 60 * 60 * 24));
        if (diffRewardDays >= 7) {
          giveReward = true;
        }
      }

      if (giveReward) {
        user.rewardBalance = (user.rewardBalance || 0) + 500;
        user.lastWeeklyRewardDate = now;
        updated = true;
      }
    }

    user.lastSeenAt = now;
    user.isOnline = true;
    await user.save();

    return res.status(200).json({ 
      ok: true, 
      lastSeenAt: now, 
      streak: user.loginStreak, 
      rewardBalance: user.rewardBalance 
    });
  } catch (e) {
    return next(e);
  }
};

const getPresence = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.userId).select("isOnline lastSeenAt");
    if (!u) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ isOnline: !!u.isOnline, lastSeenAt: u.lastSeenAt });
  } catch (e) {
    return next(e);
  }
};

module.exports = { pingPresence, getPresence };

