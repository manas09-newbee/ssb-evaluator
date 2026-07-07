const express = require("express");
const {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
} = require("./interview.controller");
const { protect } = require("../../middleware/authentication");
const router = express.Router();

router.use(protect); // Secures all interview transactions

router.post("/start", startInterview);
router.get("/history/:sessionId", getHistory);
router.post("/answer", submitAnswer);
router.post("/end", endInterview);

module.exports = router;