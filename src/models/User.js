const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: false, // Optional for Google Auth
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls
    },
    planType: {
      type: String,
      enum: ["free", "pro", "pro_plus"],
      default: "free",
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    credits: {
      type: Number,
      default: 50, // Daily free plan limit
    },
    isUnlimitedCredits: {
      type: Boolean,
      default: false,
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
    lastCreditReset: {
      type: Date,
      default: Date.now,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      enum: ["uz", "ru", "en"],
      default: "uz",
    },
    themePreference: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    rewardBalance: {
      type: Number,
      default: 0,
    },
    rewardUsedTotal: {
      type: Number,
      default: 0,
    },
    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
    loginStreak: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
    lastWeeklyRewardDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("User", userSchema);
