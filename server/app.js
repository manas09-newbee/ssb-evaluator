const express = require("express");
const cors = require("cors");

const app = express();

const ppdtRoutes = require("./modules/ppdt/ppdt.routes");
const interviewRoutes = require("./modules/interview/interview.routes");

app.use(cors());
app.use(express.json());

app.use("/api/ppdt", ppdtRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;