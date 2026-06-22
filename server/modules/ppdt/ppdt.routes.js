const express = require("express");
const router = express.Router();
const { evaluateStory } = require("./ppdt.controller");

router.post("/evaluate", evaluateStory);

module.exports = router;