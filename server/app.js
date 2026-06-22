const express = require("express");
const cors = require("cors");

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");

app.use(cors());

// Increased standard limit to 10MB to handle base64 handwritten photos comfortably
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;