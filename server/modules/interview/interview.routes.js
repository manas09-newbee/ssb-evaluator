const express = require("express");
const {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
} = require("./interview.controller");
const router = express.Router();
const {
  generateMockPIQ,
  generateQuestionBank
} = require(
  "./piq.service"
);

router.get("/start", startInterview);
router.get("/history/:sessionId", getHistory);
router.post("/answer", submitAnswer);
router.post(
  "/end",
  endInterview
);
router.get(
  "/generate-bank",
  async (req, res) => {

    try {

      const piq =
        generateMockPIQ();

      const bank =
        await generateQuestionBank(
          piq
        );

      res.json(bank);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Failed to generate bank"
      });
    }
  }
);


module.exports = router;