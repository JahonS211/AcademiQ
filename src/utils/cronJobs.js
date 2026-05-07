const cron = require("node-cron");
const User = require("../models/User");
const Notification = require("../models/Notification");

const startCronJobs = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily subscription check...");
    try {
      const now = new Date();
      const expiredUsers = await User.find({
        subscriptionEndsAt: { $lt: now },
        planType: { $in: ["pro", "pro_plus"] },
      });

      for (const user of expiredUsers) {
        const oldPlan = user.planType;
        user.planType = "free";
        user.subscriptionEndsAt = null;
        await user.save();

        if (Notification) {
          await Notification.create({
            userId: user._id,
            title: "Subscription Expired",
            message: `Your ${oldPlan.replace("_", " ")} subscription has expired. You are now on the free plan.`,
            type: "system",
            isRead: false,
          });
        }
      }
      console.log(`Updated ${expiredUsers.length} expired subscriptions.`);
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};

module.exports = { startCronJobs };
