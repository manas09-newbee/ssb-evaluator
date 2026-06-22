const express = require("express");
const router = express.Router();
const { evaluateStory, getPpdtImages } = require("./ppdt.controller");

router.post("/evaluate", evaluateStory);
router.get("/images", getPpdtImages); // Scans the folder and returns available cards

module.exports = router;