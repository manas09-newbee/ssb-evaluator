const express = require("express");
const cors = require("cors");
const path = require("path"); // Added to manage local system paths securely

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");

app.use(cors());

// Increased standard limit to 10MB to handle base64 handwritten photos comfortably
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve the local PPDT image directory statically to client browsers
app.use("/ppdt_images", express.static(path.join(__dirname, "public/ppdt_images")));

app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;