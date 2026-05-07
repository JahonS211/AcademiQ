const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // a user can only be referred once
      index: true,
    },
    status: {
      type: String,
      enum: ["registered", "paid"],
      default: "registered",
      index: true,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

referralSchema.index({ referrerUserId: 1, createdAt: -1 });

module.exports = mongoose.model("Referral", referralSchema);

