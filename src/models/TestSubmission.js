const mongoose = require("mongoose");

const testSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("TestSubmission", testSubmissionSchema);
