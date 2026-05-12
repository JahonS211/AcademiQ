const cron = require("node-cron");
const User = require("../models/User");
const Notification = require("../models/Notification");

const startCronJobs = () => {
  // Daily Credit Reset at Midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily credit reset...");
    try {
      const PLAN_LIMITS = { free: 50, pro: 150, pro_plus: 500 };
      const users = await User.find({});
      
      for (const user of users) {
        // Handle subscription expiration first (already done above, but for clarity)
        const now = new Date();
        if (user.subscriptionEndsAt && user.subscriptionEndsAt < now) {
            user.planType = "free";
            user.subscriptionEndsAt = null;
        }

        const limit = PLAN_LIMITS[user.planType] || PLAN_LIMITS.free;
        user.credits = limit;
        user.lastCreditReset = new Date();
        await user.save();
      }
      console.log("Daily credit reset completed.");
    } catch (error) {
      console.error("Credit Reset Cron Error:", error);
    }
  });
};

module.exports = { startCronJobs };
