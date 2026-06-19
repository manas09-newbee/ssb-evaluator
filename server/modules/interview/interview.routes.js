const express = require("express");
const {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
} = require("./interview.controller");
const router = express.Router();


router.get("/start", startInterview);
router.get("/history/:sessionId", getHistory);
router.post("/answer", submitAnswer);
router.post(
  "/end",
  endInterview
);


module.exports = router;