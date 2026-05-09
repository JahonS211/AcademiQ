const User = require("../models/User");
const CreditHistory = require("../models/CreditHistory");

/**
 * Middleware to check and deduct credits with plan-based restrictions
 * @param {number} cost - Number of credits required
 * @param {string} toolName - Name of the tool for history tracking
 * @param {string[]} allowedPlans - List of plans allowed to use this tool (optional)
 */
const checkCredits = (cost, toolName, allowedPlans = ["free", "pro", "pro_plus"]) => {
  return async (req, res, next) => {
    try {
      if (req.user?.isVirtual) {
        const planType = req.user.planType || "pro_plus";
        if (!allowedPlans.includes(planType)) {
          return res.status(403).json({
            success: false,
            code: "UPGRADE_REQUIRED",
            message: `${toolName} xizmati uchun rejangizni yangilang.`,
            currentPlan: planType,
            allowedPlans
          });
        }

        req.deductCredits = async () => null;
        return next();
      }

      const user = await User.findById(req.user.id || req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Check Plan restrictions
      if (!allowedPlans.includes(user.planType)) {
        return res.status(403).json({
          success: false,
          code: "UPGRADE_REQUIRED",
          message: `${toolName} xizmati uchun rejangizni yangilang.`,
          currentPlan: user.planType,
          allowedPlans
        });
      }

      if (!user.isUnlimitedCredits && user.credits < cost) {
        return res.status(403).json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          message: "Kreditlar yetarli emas. Iltimos, balansingizni to'ldiring.",
          required: cost,
          current: user.credits,
        });
      }

      // Add a helper to the request object to deduct credits later
      req.deductCredits = async (details = "") => {
        if (!user.isUnlimitedCredits && cost > 0) {
          user.credits -= cost;
          user.totalCreditsUsed += cost;
          await user.save();
        }

        await CreditHistory.create({
          userId: user._id,
          toolName,
          creditsUsed: (user.isUnlimitedCredits || cost === 0) ? 0 : cost,
          details: user.isUnlimitedCredits ? `(Unlimited) ${details}` : details,
        });

        return user.credits; // Return current balance
      };

      next();
    } catch (error) {
      console.error("Credit Middleware Error:", error);
      res.status(500).json({ message: "Kreditni tekshirishda xatolik yuz berdi" });
    }
  };
};

module.exports = { checkCredits };
