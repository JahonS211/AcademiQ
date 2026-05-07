const { Telegraf, Markup } = require("telegraf");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Referral = require("../models/Referral");
const RewardLedger = require("../models/RewardLedger");
const { createNotification } = require("../services/notificationService");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "mock_token");
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

// Mock function if bot token is not valid
let isBotReady = false;

try {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    bot.launch();
    isBotReady = true;
    console.log("Telegram bot is running");
  } else {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Bot will not send actual messages.");
  }
} catch (error) {
  console.error("Failed to launch telegram bot:", error);
}

bot.start((ctx) => {
  ctx.reply(`Salom! Bot ishlayapti. Sizning Telegram ID: ${ctx.from.id}\n\nUshbu ID ni .env faylidagi TELEGRAM_ADMIN_ID qismiga yozib qo'ying.`);
});

bot.command("id", (ctx) => {
  ctx.reply(`Sizning ID: ${ctx.from.id}`);
});

const sendPaymentRequestToAdmin = async (payment, userEmail) => {
  if (!isBotReady || !ADMIN_ID) return;

  const rewardsText = payment.rewardsApplied > 0 ? `\n🎁 Ishlatilgan mukofot: ${payment.rewardsApplied} UZS` : "";
  const promoText = payment.promoCode ? `\n🎟 Promo: ${payment.promoCode} (-${payment.promoDiscountPercent}%)` : "";

  const message = `
🔔 <b>Yangi To'lov So'rovi!</b>
  
👤 User: ${userEmail}
💰 To'lanadi: ${payment.amount} UZS (Asl narxi: ${payment.originalAmount} UZS)${promoText}${rewardsText}
📦 Tarif: ${payment.plan}
🔑 Kod: <code>${payment.code}</code>
  `;

  try {
    const options = {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        Markup.button.callback("✅ Tasdiqlash", `approve_${payment._id}`),
        Markup.button.callback("❌ Bekor qilish", `reject_${payment._id}`),
      ]),
    };

    if (payment.receiptUrl) {
      const fullPath = require("path").join(__dirname, "../../", payment.receiptUrl);
      if (payment.receiptUrl.match(/\.(jpg|jpeg|png)$/i)) {
        await bot.telegram.sendPhoto(ADMIN_ID, { source: fullPath }, { caption: message, ...options });
      } else {
        await bot.telegram.sendDocument(ADMIN_ID, { source: fullPath }, { caption: message, ...options });
      }
    } else {
      await bot.telegram.sendMessage(ADMIN_ID, message, options);
    }
  } catch (error) {
    console.error("Error sending message to admin:", error);
  }
};

const sendSupportMessageToAdmin = async (userEmail, text) => {
  if (!isBotReady || !ADMIN_ID) return;
  const message = `
📩 <b>Yangi Support Xabari!</b>

👤 Kimdan: ${userEmail}
💬 Xabar: ${text}
  `;
  await bot.telegram.sendMessage(ADMIN_ID, message, { parse_mode: "HTML" });
};

// --- Admin Panel Commands ---

bot.command("id", (ctx) => {
  ctx.reply(`Sizning ID: <code>${ctx.from.id}</code>\n\nUshbu ID ni .env faylidagi TELEGRAM_ADMIN_ID qismiga yozing.`, { parse_mode: "HTML" });
});

bot.command("users", async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Siz admin emassiz!");
  try {
    const users = await User.find().limit(20).sort("-createdAt");
    let text = "👥 <b>Oxirgi 20 ta foydalanuvchi:</b>\n\n";
    users.forEach((u, i) => {
      text += `${i + 1}. ${u.email}\nPlan: <code>${u.planType}</code>\nID: <code>${u._id}</code>\n\n`;
    });
    ctx.reply(text, { parse_mode: "HTML" });
  } catch (err) {
    ctx.reply("Xatolik: " + err.message);
  }
});

bot.command("payments", async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Siz admin emassiz!");
  try {
    const payments = await Payment.find().sort("-createdAt").limit(15);
    if (payments.length === 0) return ctx.reply("Hozircha to'lovlar yo'q.");

    let text = "📋 <b>Oxirgi 15 ta to'lov:</b>\n\n";
    const buttons = [];
    
    payments.forEach((p, i) => {
      const statusIcon = p.status === "paid" ? "✅" : (p.status === "pending" ? "⏳" : "❌");
      text += `${i + 1}. <code>${p.code}</code> - ${statusIcon} ${p.plan}\n`;
      buttons.push([Markup.button.callback(`${statusIcon} ${p.code} (pay_${p._id.toString().slice(-4)})`, `view_pay_${p._id}`)]);
    });

    ctx.reply(text, { 
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (err) {
    ctx.reply("Xatolik: " + err.message);
  }
});

bot.command("support", async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.reply("Siz admin emassiz!");
  try {
    const messages = await Support.find().sort("-createdAt").limit(15);
    if (messages.length === 0) return ctx.reply("Hozircha support xabarlari yo'q.");

    let text = "📩 <b>Oxirgi 15 ta xabar:</b>\n\n";
    const buttons = [];
    
    for (const m of messages) {
      const user = await User.findById(m.userId);
      text += `👤 ${user?.email || "Noma'lum"}: ${m.message.slice(0, 20)}...\n`;
      buttons.push([Markup.button.callback(`📩 ${user?.email || "Noma'lum"}`, `view_sup_${m._id}`)]);
    }

    ctx.reply(text, { 
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(buttons)
    });
  } catch (err) {
    ctx.reply("Xatolik: " + err.message);
  }
});

bot.action(/view_pay_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("Siz admin emassiz!");
  const paymentId = ctx.match[1];
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) return ctx.answerCbQuery("Topilmadi");

    const user = await User.findById(payment.userId);
    const text = `
📄 <b>To'lov Tafsilotlari:</b>
🆔 ID: <code>pay_${payment._id}</code>
🔑 Kod: <code>${payment.code}</code>
👤 User: ${user?.email || "Noma'lum"}
💰 Miqdor: ${payment.amount} UZS
📦 Tarif: ${payment.plan}
📅 Sana: ${payment.createdAt.toLocaleString()}
📊 Holat: ${payment.status.toUpperCase()}
    `;

    const buttons = [];
    if (payment.status === "pending") {
      buttons.push([
        Markup.button.callback("✅ Tasdiqlash", `approve_${payment._id}`),
        Markup.button.callback("❌ Bekor qilish", `reject_${payment._id}`)
      ]);
    }

    if (payment.receiptUrl) {
      const fullPath = require("path").join(__dirname, "../../", payment.receiptUrl);
      if (payment.receiptUrl.match(/\.(jpg|jpeg|png)$/i)) {
        await ctx.replyWithPhoto({ source: fullPath }, { caption: text, parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
      } else {
        await ctx.replyWithDocument({ source: fullPath }, { caption: text, parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
      }
    } else {
      ctx.reply(text, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    }
    ctx.answerCbQuery();
  } catch (err) {
    ctx.answerCbQuery("Xatolik");
  }
});

bot.action(/view_sup_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("Siz admin emassiz!");
  const supId = ctx.match[1];
  try {
    const sup = await Support.findById(supId);
    if (!sup) return ctx.answerCbQuery("Topilmadi");

    const user = await User.findById(sup.userId);
    const text = `
📩 <b>Support Xabari:</b>
👤 Kimdan: ${user?.email || "Noma'lum"} (ID: <code>${user?._id}</code>)
📅 Sana: ${sup.createdAt.toLocaleString()}
💬 Xabar:
${sup.message}
    `;
    ctx.reply(text, { parse_mode: "HTML" });
    ctx.answerCbQuery();
  } catch (err) {
    ctx.answerCbQuery("Xatolik");
  }
});

bot.command("setplan", async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /setplan <USER_ID> <PLAN_NAME>\nPlanlar: free, pro, pro_plus");

  const [_, userId, plan] = args;
  try {
    const user = await User.findById(userId);
    if (!user) return ctx.reply("Foydalanuvchi topilmadi");
    user.planType = plan;
    await user.save();
    ctx.reply(`✅ Foydalanuvchi ${user.email} plani ${plan} ga o'zgartirildi.`);
  } catch (err) {
    ctx.reply("Xatolik: " + err.message);
  }
});

bot.action(/approve_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("Siz admin emassiz!");
  
  const paymentId = ctx.match[1];
  try {
    const payment = await Payment.findById(paymentId);
    let messageText = ctx.callbackQuery.message.text || ctx.callbackQuery.message.caption || "";

    if (!payment || payment.status !== "pending") {
      const errorText = messageText + "\n\n❌ To'lov topilmadi yoki allaqachon ko'rib chiqilgan.";
      if (ctx.callbackQuery.message.photo || ctx.callbackQuery.message.document) {
        return ctx.editMessageCaption(errorText);
      } else {
        return ctx.editMessageText(errorText);
      }
    }

    payment.status = "paid";
    await payment.save();

    const user = await User.findById(payment.userId);
    if (user) {
      user.planType = payment.plan;
      // Extend subscription by 30 days from now (or from existing end date)
      const base = user.subscriptionEndsAt && user.subscriptionEndsAt > new Date() ? user.subscriptionEndsAt : new Date();
      user.subscriptionEndsAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      await user.save();

      // Notification: payment approved
      await createNotification({
        userId: user._id,
        type: "payment",
        severity: "success",
        title: "✅ Payment approved",
        message: `Your payment (${payment.code}) was approved. Premium activated.`,
        meta: { paymentId: payment._id, plan: payment.plan, amount: payment.amount },
      });

      // Rewards: configurable via env (default 5% cashback)
      const rewardPercent = Number(process.env.REWARD_PERCENT || 5);
      const rewardAmount = Math.max(Math.floor((payment.amount * rewardPercent) / 100), 0);
      if (rewardAmount > 0) {
        user.rewardBalance = Number(user.rewardBalance || 0) + rewardAmount;
        await user.save();
        await RewardLedger.create({
          userId: user._id,
          type: "earn",
          amount: rewardAmount,
          ref: { paymentId: payment._id, code: payment.code, plan: payment.plan },
        });
      }

      // If user used rewards as discount, deduct them here on approval
      const used = Number(payment.rewardsApplied || 0);
      if (used > 0) {
        user.rewardBalance = Math.max(Number(user.rewardBalance || 0) - used, 0);
        user.rewardUsedTotal = Number(user.rewardUsedTotal || 0) + used;
        await user.save();
        await RewardLedger.create({
          userId: user._id,
          type: "redeem",
          amount: -used,
          ref: { paymentId: payment._id, code: payment.code, plan: payment.plan },
        });
      }

      // Referral: if user was referred, mark as paid and credit referrer (configurable)
      const rewardFixed = Number(process.env.REFERRAL_REWARD_AMOUNT || 0);
      const rewardPct = Number(process.env.REFERRAL_REWARD_PERCENT || 0);
      const referralReward = Math.max(rewardFixed, Math.floor((payment.amount * rewardPct) / 100));
      const referral = await Referral.findOne({ referredUserId: user._id });
      if (referral && referral.status !== "paid") {
        referral.status = "paid";
        referral.rewardAmount = referralReward;
        await referral.save();
        if (referralReward > 0) {
          await User.updateOne(
            { _id: referral.referrerUserId },
            { $inc: { referralEarnings: referralReward } }
          );
          await createNotification({
            userId: referral.referrerUserId,
            type: "referral",
            severity: "success",
            title: "🎁 Referral reward",
            message: `Your referral made a purchase. You earned ${referralReward} points.`,
            meta: { referredUserId: user._id, paymentId: payment._id },
          });
        }
      }
    }

    const newText = messageText + "\n\n✅ <b>Tasdiqlandi va Premium faollashtirildi!</b>";
    if (ctx.callbackQuery.message.photo || ctx.callbackQuery.message.document) {
      await ctx.editMessageCaption(newText, { parse_mode: "HTML" });
    } else {
      await ctx.editMessageText(newText, { parse_mode: "HTML" });
    }
    ctx.answerCbQuery("Tasdiqlandi!");
  } catch (error) {
    console.error(error);
    ctx.answerCbQuery("Xatolik yuz berdi");
  }
});

bot.action(/reject_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return ctx.answerCbQuery("Siz admin emassiz!");
  
  const paymentId = ctx.match[1];
  try {
    const payment = await Payment.findById(paymentId);
    let messageText = ctx.callbackQuery.message.text || ctx.callbackQuery.message.caption || "";

    if (!payment || payment.status !== "pending") {
      const errorText = messageText + "\n\n❌ To'lov topilmadi yoki allaqachon ko'rib chiqilgan.";
      if (ctx.callbackQuery.message.photo || ctx.callbackQuery.message.document) {
        return ctx.editMessageCaption(errorText);
      } else {
        return ctx.editMessageText(errorText);
      }
    }

    payment.status = "rejected";
    await payment.save();

    const rejectText = messageText + "\n\n❌ <b>Bekor qilindi.</b>";
    if (ctx.callbackQuery.message.photo || ctx.callbackQuery.message.document) {
      await ctx.editMessageCaption(rejectText, { parse_mode: "HTML" });
    } else {
      await ctx.editMessageText(rejectText, { parse_mode: "HTML" });
    }
    ctx.answerCbQuery("Bekor qilindi!");
  } catch (error) {
    console.error(error);
    ctx.answerCbQuery("Xatolik yuz berdi");
  }
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = {
  sendPaymentRequestToAdmin,
  sendSupportMessageToAdmin,
};
