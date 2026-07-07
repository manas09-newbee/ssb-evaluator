const Interview = require("../models/Interview");
const PPDTReport = require("../models/PPDTReport");

const limitInterviewUsage = async (req, res, next) => {
  try {
    // Standard bypass logic: skip limit checks for Pro or Premium accounts without changing route code
    if (req.user && (req.user.subscription === "premium" || req.user.subscription === "pro")) {
      return next();
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Scan DB count of AI-generated answers compiled by the candidate today
    const interviews = await Interview.find({ user: req.user._id });
    let dailyAICalls = 0;
    
    interviews.forEach((inv) => {
      inv.transcript.forEach((item) => {
        if (item.timestamp >= startOfToday) {
          dailyAICalls++;
        }
      });
    });

    if (dailyAICalls >= 20) {
      console.warn(`[Usage limit exceeded] Candidate ID: ${req.user._id} blocked from daily Interview AI call.`);
      return res.status(429).json({
        message: "You have reached your limit of 20 Interview questions per day. Upgrade to Premium for unlimited access."
      });
    }

    next();
  } catch (err) {
    console.error("Interview usage validation failed:", err);
    next();
  }
};

const limitPPDTUsage = async (req, res, next) => {
  try {
    if (req.user && (req.user.subscription === "premium" || req.user.subscription === "pro")) {
      return next();
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Evaluate physical written scripts saved today in DB
    const ppdtCount = await PPDTReport.countDocuments({
      user: req.user._id,
      createdAt: { $gte: startOfToday }
    });

    if (ppdtCount >= 10) {
      console.warn(`[Usage limit exceeded] Candidate ID: ${req.user._id} blocked from daily PPDT evaluation.`);
      return res.status(429).json({
        message: "You have reached your limit of 10 PPDT evaluations per day. Upgrade to Premium for unlimited access."
      });
    }

    next();
  } catch (err) {
    console.error("PPDT usage validation failed:", err);
    next();
  }
};

module.exports = {
  limitInterviewUsage,
  limitPPDTUsage
};