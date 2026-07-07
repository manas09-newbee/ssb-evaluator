const mongoose = require("mongoose");

const oirAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    correct: { type: Number, required: true },
    incorrect: { type: Number, required: true },
    skipped: { type: Number, required: true },
    timeTaken: { type: Number, required: true }, // duration in seconds
    accuracy: { type: Number, required: true },
    difficulty: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    categoryPerformance: {
      type: mongoose.Schema.Types.Mixed, // Change to Mixed to prevent any strict schema Mongoose casting issues
      default: {}
    },
    answers: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
        selectedAnswer: String,
        isCorrect: Boolean,
        explanation: String,
        category: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Define standard 15 days TTL index so OIR attempts are purged in sync with parent User documents
oirAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1296000 });

module.exports = mongoose.models.OIRAttempt || mongoose.model("OIRAttempt", oirAttemptSchema);