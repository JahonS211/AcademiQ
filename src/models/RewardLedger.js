const mongoose = require("mongoose");

const rewardLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "expire", "adjust"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    ref: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

rewardLedgerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("RewardLedger", rewardLedgerSchema);

