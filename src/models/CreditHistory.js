const mongoose = require("mongoose");

const creditHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toolName: {
      type: String,
      required: true,
    },
    creditsUsed: {
      type: Number,
      required: true,
    },
    details: {
      type: String, // Optional: snippet of prompt or file name
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditHistory", creditHistorySchema);
