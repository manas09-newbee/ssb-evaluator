const express = require("express");
const { registerUser, loginUser, googleLogin } = require("./auth.controller");
const { authLimiter } = require("../../middleware/rateLimiter");
const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/google", authLimiter, googleLogin);

module.exports = router;