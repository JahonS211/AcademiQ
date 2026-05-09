const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
      default: "",
      index: true,
    },
    promoDiscountPercent: {
      type: Number,
      default: 0,
    },
    rewardsApplied: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["plan", "credits"],
      default: "plan",
      required: true,
    },
    plan: {
      type: String,
      enum: ["pro", "pro_plus"],
    },
    creditAmount: {
      type: Number,
      default: 0,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
    },
    receiptUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
