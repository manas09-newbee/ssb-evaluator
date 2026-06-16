const express = require("express");

const router = express.Router();

const {
  startInterview,
  submitAnswer,
} = require("./interview.controller");

router.get("/start", startInterview);

router.post("/answer", submitAnswer);

module.exports = router;