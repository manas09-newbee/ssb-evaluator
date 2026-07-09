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
      type: mongoose.Schema.Types.Mixed, // Mixed to prevent strict casting issues
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

module.exports = mongoose.models.OIRAttempt || mongoose.model("OIRAttempt", oirAttemptSchema);