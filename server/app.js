const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");

// Import models for on-logout memory purges
const Interview = require("./models/Interview");
const PPDTReport = require("./models/PPDTReport");

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/ppdt_images", express.static(path.join(__dirname, "public/ppdt_images")));

app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);

// POST Endpoint to wipe transactional database sessions on logout [1]
app.post("/api/logout", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required for session cleanup." });
    }

    // 1. Purge all interview transcripts for the candidate
    await Interview.cleanupUserInterviews(userId);

    // 2. Purge all PPDT reports for the candidate
    await PPDTReport.cleanupUserPPDT(userId, true);

    console.log(`[Database Cleanup] Successfully purged records for user: ${userId}`);
    res.json({ success: true, message: "Storage optimized. Active sessions deleted." });
  } catch (err) {
    console.error("Logout DB cleanup failed:", err);
    res.status(500).json({ message: "Failed to execute database session purge." });
  }
});

module.exports = app;