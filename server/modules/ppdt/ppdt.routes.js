const express = require("express");
const router = express.Router();
const { evaluateStory, getPpdtImages } = require("./ppdt.controller");
const { protect } = require("../../middleware/authentication");
const { limitPPDTUsage } = require("../../middleware/usageLimiter");

router.get("/images", getPpdtImages);
router.post("/evaluate", protect, limitPPDTUsage, evaluateStory); // Secure evaluates with daily limits

module.exports = router;