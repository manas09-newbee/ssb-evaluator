const express = require("express");
const router = express.Router();
const { getOirQuestions, submitOirTest, getOirStats, getOirReportDetails } = require("./oir.controller");
const { protect } = require("../../middleware/authentication");

router.use(protect); // Secure entire routing stack

router.get("/questions", getOirQuestions);
router.post("/submit", submitOirTest);
router.get("/stats", getOirStats);
router.get("/report/:id", getOirReportDetails);

module.exports = router;