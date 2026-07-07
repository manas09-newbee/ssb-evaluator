const express = require("express");
const router = express.Router();
const { evaluateStory, getPpdtImages } = require("./ppdt.controller");
const { protect } = require("../../middleware/authentication");

router.get("/images", getPpdtImages);
router.post("/evaluate", protect, evaluateStory); // Secures PPDT uploading and evaluation

module.exports = router;