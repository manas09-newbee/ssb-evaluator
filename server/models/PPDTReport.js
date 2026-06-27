const mongoose = require("mongoose");

const ppdtReportSchema = new mongoose.Schema(
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
    // imageUrl is marked optional to let you wipe the bulky URL string after test completion.
    imageUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allows unsetting/clearing the string representation
          return /^(https?:\/\/)/.test(v);
        },
        message: "Invalid image destination format. Direct HTTP/HTTPS URLs only."
      }
    },
    extractedText: {
      type: String,
      default: "" 
    },
    handwrittenStory: {
      type: String,
      default: "" 
    },
    evaluation: {
      aiEvaluation: { type: String, default: "" }, 
      narration: { type: String, default: "" },
      imagination: { type: String, default: "" },
      positivity: { type: String, default: "" },
      officerLikeQualities: { type: String, default: "" },
      recommendations: { type: String, default: "" }
    },
    olqScores: {
      effectiveIntelligence: { type: Number, default: 0 },
      reasoning: { type: Number, default: 0 },
      initiative: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      cooperation: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      responsibility: { type: Number, default: 0 },
      selfConfidence: { type: Number, default: 0 }
    },
    pictureId: {
      type: String,
      required: true 
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    // DYNAMIC TTL: Fallback cleanup after 24 hours if unsubmitted
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  {
    timestamps: true
  }
);

ppdtReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ppdtReportSchema.index({ user: 1, createdAt: -1 });

/**
 * STATIC HELPERS:
 * 
 * 1. Wipe everything for a user (Call on Logout):
 *    await mongoose.model("PPDTReport").cleanupUserPPDT(req.user._id, true);
 * 
 * 2. Wipe ONLY the bulky picture references immediately after test evaluation:
 *    await mongoose.model("PPDTReport").cleanupUserPPDT(req.user._id, false);
 */
ppdtReportSchema.statics.cleanupUserPPDT = async function(userId, deleteFullReport = false) {
  if (deleteFullReport) {
    return this.deleteMany({ user: userId });
  }
  // Strip the image property from database records to save memory while keeping text analytics
  return this.updateMany({ user: userId }, { $unset: { imageUrl: "" } });
};

module.exports = mongoose.models.PPDTReport || mongoose.model("PPDTReport", ppdtReportSchema);