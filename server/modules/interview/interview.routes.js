const express = require("express");
const {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
} = require("./interview.controller");
const { protect } = require("../../middleware/authentication");
const { limitInterviewUsage } = require("../../middleware/usageLimiter");
const router = express.Router();

router.use(protect); // Secures all interview transactions

router.post("/start", limitInterviewUsage, startInterview); // Verify and count daily limit on starting
router.get("/history/:sessionId", getHistory);
router.post("/answer", limitInterviewUsage, submitAnswer); // Apply limits during execution
router.post("/end", endInterview);

module.exports = router;