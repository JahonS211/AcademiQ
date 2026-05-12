const User = require("../models/User");
const CreditHistory = require("../models/CreditHistory");

const resolveCost = (cost, req) => {
  const value = typeof cost === "function" ? cost(req) : cost;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.ceil(numeric) : 0;
};

/**
 * Middleware to check and deduct credits with plan-based restrictions.
 * Cost may be a number or a function that reads req.body.
 */
const checkCredits = (cost, toolName, allowedPlans = ["free", "pro", "pro_plus"]) => {
  return async (req, res, next) => {
    try {
      const actualCost = resolveCost(cost, req);

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

        req.creditCost = actualCost;
        req.deductCredits = async () => null;
        return next();
      }

      const user = await User.findById(req.user.id || req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const planType = user.planType || "free";
      if (!allowedPlans.includes(planType)) {
        return res.status(403).json({
          success: false,
          code: "UPGRADE_REQUIRED",
          message: `${toolName} xizmati uchun rejangizni yangilang.`,
          currentPlan: planType,
          allowedPlans
        });
      }

      if (!user.isUnlimitedCredits && user.credits < actualCost) {
        return res.status(403).json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          message: "Kreditlar yetarli emas. Iltimos, balansingizni to'ldiring.",
          required: actualCost,
          current: user.credits,
        });
      }

      req.creditCost = actualCost;
      req.deductCredits = async (details = "") => {
        if (!user.isUnlimitedCredits && actualCost > 0) {
          user.credits -= actualCost;
          user.totalCreditsUsed += actualCost;
        }

        // Increment stats
        if (!user.stats) user.stats = { essays: 0, presentations: 0, tools: 0 };
        const toolLower = toolName.toLowerCase();
        if (toolLower.includes("essay")) {
          user.stats.essays += 1;
        } else if (toolLower.includes("presentation") || toolLower.includes("slide")) {
          user.stats.presentations += 1;
        } else {
          user.stats.tools += 1;
        }

        await user.save();

        await CreditHistory.create({
          userId: user._id,
          toolName,
          creditsUsed: (user.isUnlimitedCredits || actualCost === 0) ? 0 : actualCost,
          details: user.isUnlimitedCredits ? `(Unlimited) ${details}` : details,
        });

        return user.credits;
      };

      next();
    } catch (error) {
      console.error("Credit Middleware Error:", error);
      res.status(500).json({ message: "Kreditni tekshirishda xatolik yuz berdi" });
    }
  };
};

module.exports = { checkCredits };
