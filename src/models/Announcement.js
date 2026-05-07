const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdByAdminEmail: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);

