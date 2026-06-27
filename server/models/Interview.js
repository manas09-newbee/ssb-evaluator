const mongoose = require("mongoose");

const transcriptItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  followUpQuestion: { type: String, default: null },
  stage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  answerLength: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 1.0 }
}, { _id: false });

const contradictionItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  finding: { type: String, required: true },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    piq: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PIQ",
      required: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["ongoing", "completed", "aborted"],
      default: "ongoing"
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    transcript: [transcriptItemSchema],
    evaluation: {
      overallFeedback: { type: String, default: "" },
      overallScore: { type: Number, default: 0 },
      olqScores: {
        communication: { type: Number, default: 0 },
        reasoning: { type: Number, default: 0 },
        leadership: { type: Number, default: 0 },
        socialAdaptability: { type: Number, default: 0 },
        effectiveIntelligence: { type: Number, default: 0 },
        initiative: { type: Number, default: 0 },
        responsibility: { type: Number, default: 0 },
        courage: { type: Number, default: 0 },
        selfConfidence: { type: Number, default: 0 }
      }
    },
    contradictions: [contradictionItemSchema],
    // DYNAMIC TTL: Fallback mechanism to clean unclosed/abandoned sessions after 24 hours
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) 
    }
  },
  {
    timestamps: true
  }
);

// Dynamic expire TTL index definition
interviewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
interviewSchema.index({ user: 1, createdAt: -1 });

/**
 * STATIC HELPER: Call this programmatic function right inside your Logout controller:
 * await mongoose.model("Interview").cleanupUserInterviews(req.user._id);
 */
interviewSchema.statics.cleanupUserInterviews = async function(userId) {
  return this.deleteMany({ user: userId });
};

module.exports = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);