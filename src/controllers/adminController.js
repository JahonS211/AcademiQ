const User = require("../models/User");
const Presentation = require("../models/Presentation");
const CreditHistory = require("../models/CreditHistory");

const PLAN_TYPES = ["pro_plus", "pro", "free"];

const normalizeCommand = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[`‘’]/g, "'")
    .replace(/ё/g, "yo");

const findCommandUser = async (message) => {
  const email = String(message).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  const id = String(message).match(/\b[a-f0-9]{24}\b/i)?.[0];
  if (id) {
    return User.findById(id);
  }

  return null;
};

const findCreditAmount = (message) => {
  const withoutTargets = String(message)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
    .replace(/\b[a-f0-9]{24}\b/gi, " ");

  const beforeCredit = withoutTargets.match(/\b(\d{1,7})\s*(?:ta\s*)?(?:credit|credits|kredit|kreditlar)\b/i);
  if (beforeCredit) return Number(beforeCredit[1]);

  const afterCredit = withoutTargets.match(/\b(?:credit|credits|kredit|kreditlar)\b\D{0,20}(\d{1,7})\b/i);
  if (afterCredit) return Number(afterCredit[1]);

  const anyNumber = withoutTargets.match(/\b(\d{1,7})\b/);
  return anyNumber ? Number(anyNumber[1]) : null;
};

const createAdminCreditHistory = (user, toolName, creditsUsed, details) =>
  CreditHistory.create({
    userId: user._id,
    toolName,
    creditsUsed,
    details,
  }).catch((error) => {
    console.error("Admin credit history error:", error);
  });

const getAdminAssistantHelp = () =>
  [
    "AcademiQ admin assistant tayyor. Buyruqni email yoki user ID bilan yozing.",
    "",
    "Misollar:",
    "- `user@mail.com ga 50 credit qo'sh`",
    "- `user@mail.com kreditini 120 qil`",
    "- `user@mail.com dan 10 credit ayir`",
    "- `user@mail.com planini pro_plus qil`",
    "- `user@mail.com ni blokla`",
    "- `user@mail.com ni blokdan chiqar`",
    "- `user@mail.com haqida ma'lumot`",
  ].join("\n");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, planType, credits, rewardBalance, isUnlimitedCredits } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (planType !== undefined) user.planType = planType;
    if (credits !== undefined) user.credits = credits;
    if (rewardBalance !== undefined) user.rewardBalance = rewardBalance;
    if (isUnlimitedCredits !== undefined) user.isUnlimitedCredits = isUnlimitedCredits;

    await user.save();
    return res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBlocked, blockedUntil } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = isBlocked;
    user.blockedUntil = blockedUntil ? new Date(blockedUntil) : null;

    await user.save();
    return res.status(200).json({ 
      message: isBlocked ? "User blocked" : "User unblocked", 
      user 
    });
  } catch (error) {
    return next(error);
  }
};

const adminAssistantCommand = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: "Command message is required" });
    }

    const command = normalizeCommand(message);

    if (/^(salom|help|yordam|commands|buyruqlar)\b/.test(command)) {
      return res.status(200).json({ success: true, executed: false, reply: getAdminAssistantHelp() });
    }

    const user = await findCommandUser(message);
    if (!user) {
      return res.status(200).json({
        success: true,
        executed: false,
        reply: "Qaysi foydalanuvchiga amal qilishimni topolmadim. Buyruqda foydalanuvchi emaili yoki ID sini yozing.",
      });
    }

    const adminEmail = req.admin?.email || "admin";
    const hasCreditWord = /\b(credit|credits|kredit|kreditlar)\b/.test(command);
    const amount = hasCreditWord ? findCreditAmount(message) : null;
    const oldCredits = Number(user.credits || 0);

    if (hasCreditWord && (!Number.isFinite(amount) || amount < 0)) {
      return res.status(200).json({
        success: true,
        executed: false,
        reply: "Credit miqdori aniq emas. Masalan: `user@mail.com ga 50 credit qo'sh`.",
      });
    }

    if (hasCreditWord && /(qo'?sh|qosh|add|ber|plus)/i.test(command)) {
      user.credits = oldCredits + amount;
      await user.save();
      await createAdminCreditHistory(user, "Admin Assistant", -amount, `Added by ${adminEmail}: ${message}`);

      return res.status(200).json({
        success: true,
        executed: true,
        action: "add_credits",
        reply: `${user.email} foydalanuvchisiga ${amount} credit qo'shildi. Balans: ${oldCredits} -> ${user.credits}.`,
        user,
      });
    }

    if (hasCreditWord && /(ayir|subtract|minus|kamaytir|olib tashla)/i.test(command)) {
      user.credits = Math.max(oldCredits - amount, 0);
      await user.save();
      await createAdminCreditHistory(user, "Admin Assistant", amount, `Subtracted by ${adminEmail}: ${message}`);

      return res.status(200).json({
        success: true,
        executed: true,
        action: "subtract_credits",
        reply: `${user.email} foydalanuvchisidan ${amount} credit ayirildi. Balans: ${oldCredits} -> ${user.credits}.`,
        user,
      });
    }

    if (hasCreditWord && /(qil|set|belgila|o'zgartir|ozgartir)/i.test(command)) {
      user.credits = amount;
      await user.save();
      await createAdminCreditHistory(user, "Admin Assistant", oldCredits - amount, `Set by ${adminEmail}: ${message}`);

      return res.status(200).json({
        success: true,
        executed: true,
        action: "set_credits",
        reply: `${user.email} credit balansi ${amount} qilib belgilandi. Oldingi balans: ${oldCredits}.`,
        user,
      });
    }

    const requestedPlan = command.includes("pro+") || command.includes("pro plus")
      ? "pro_plus"
      : PLAN_TYPES.find((plan) => command.includes(plan));
    if (/(plan|tarif)/i.test(command) && requestedPlan) {
      const oldPlan = user.planType;
      user.planType = requestedPlan;
      await user.save();

      return res.status(200).json({
        success: true,
        executed: true,
        action: "set_plan",
        reply: `${user.email} tarifi ${oldPlan} -> ${requestedPlan} qilindi.`,
        user,
      });
    }

    if (/(blokdan chiqar|unblock|faollashtir)/i.test(command)) {
      user.isBlocked = false;
      user.blockedUntil = null;
      await user.save();

      return res.status(200).json({
        success: true,
        executed: true,
        action: "unblock_user",
        reply: `${user.email} blokdan chiqarildi.`,
        user,
      });
    }

    if (/(blokla|block|ban)/i.test(command)) {
      user.isBlocked = true;
      user.blockedUntil = null;
      await user.save();

      return res.status(200).json({
        success: true,
        executed: true,
        action: "block_user",
        reply: `${user.email} bloklandi.`,
        user,
      });
    }

    if (/(info|haqida|ma'lumot|malumot|top|find)/i.test(command)) {
      return res.status(200).json({
        success: true,
        executed: false,
        action: "user_info",
        reply: [
          `User: ${user.email}`,
          `Ism: ${user.name || "No Name"}`,
          `Plan: ${user.planType}`,
          `Credits: ${user.credits}`,
          `Reward balance: ${user.rewardBalance || 0}`,
          `Status: ${user.isBlocked ? "Blocked" : "Active"}`,
        ].join("\n"),
        user,
      });
    }

    return res.status(200).json({
      success: true,
      executed: false,
      reply: `Buyruqni tushunmadim.\n\n${getAdminAssistantHelp()}`,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  blockUser,
  adminAssistantCommand
};
