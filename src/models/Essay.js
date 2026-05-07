const mongoose = require("mongoose");

const essaySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      introduction: { type: String, required: true },
      body: { type: String, required: true },
      conclusion: { type: String, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Essay", essaySchema);
