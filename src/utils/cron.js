const cron = require("node-cron");
const User = require("../models/User");

const PLAN_LIMITS = {
  free: 50,
  pro: 150,
  pro_plus: 500,
};

const initCron = () => {
  // Reset credits every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily credit reset...");
    try {
      const users = await User.find({});
      for (const user of users) {
        const limit = PLAN_LIMITS[user.planType] || PLAN_LIMITS.free;
        user.credits = limit;
        user.lastCreditReset = new Date();
        await user.save();
      }
      console.log("Daily credit reset completed.");
    } catch (error) {
      console.error("Credit reset error:", error);
    }
  });
};

module.exports = { initCron };
