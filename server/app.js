const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");
const authRoutes = require("./modules/auth/auth.routes");
const oirRoutes = require("./modules/oir/oir.routes"); // Map route engine

const { globalLimiter } = require("./middleware/rateLimiter");
const { protect } = require("./middleware/authentication");

// Configure restricted CORS policy
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// Configure standard IP payload sizes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Apply production grade Global rate limiting safely across endpoints
app.use(globalLimiter);

app.use("/ppdt_images", express.static(path.join(__dirname, "public/ppdt_images")));

app.use("/api/auth", authRoutes);
app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/oir", oirRoutes); // Mount OIR module endpoints

// POST Endpoint to wipe transactional database sessions on logout
const Interview = require("./models/Interview");
const PPDTReport = require("./models/PPDTReport");
const OIRAttempt = require("./models/OIRAttempt");

app.post("/api/logout", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    await Interview.cleanupUserInterviews(userId);
    await PPDTReport.cleanupUserPPDT(userId, true);
    await OIRAttempt.deleteMany({ user: userId }); // Clean OIR session history on logout

    console.log(`[Database Cleanup] Successfully purged records for user: ${userId}`);
    res.json({ success: true, message: "Storage optimized. Active sessions deleted." });
  } catch (err) {
    console.error("Logout DB cleanup failed:", err);
    res.status(500).json({ message: "Failed to execute database session purge." });
  }
});

module.exports = app;