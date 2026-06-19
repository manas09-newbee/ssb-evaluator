const express = require("express");
const {
  startInterview,
  submitAnswer,
  getHistory,
} = require("./interview.controller");
const router = express.Router();


router.get("/start", startInterview);
router.get("/history/:sessionId", getHistory);
router.post("/answer", submitAnswer);



module.exports = router;