const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");
const authRoutes = require("./modules/auth/auth.routes");

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/ppdt_images", express.static(path.join(__dirname, "public/ppdt_images")));

app.use("/api/auth", authRoutes);
app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;