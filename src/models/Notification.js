const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = broadcast / system-wide
      index: true,
    },
    type: {
      type: String,
      enum: ["payment", "subscription", "announcement", "referral", "system"],
      default: "system",
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
      index: true,
    },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

