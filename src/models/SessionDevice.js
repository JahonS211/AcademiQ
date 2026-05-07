const mongoose = require("mongoose");

const sessionDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    ip: { type: String, default: "", index: true },
    userAgent: { type: String, default: "" },
    lastSeenAt: { type: Date, default: null, index: true },
    suspiciousScore: { type: Number, default: 0 },
    flags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

sessionDeviceSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });

module.exports = mongoose.model("SessionDevice", sessionDeviceSchema);

