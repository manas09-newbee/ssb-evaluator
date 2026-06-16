const express = require("express");

const router = express.Router();

router.post("/evaluate", (req, res) => {
  const { story } = req.body;

  res.json({
    message: "Story received successfully",
    story,
  });
});

module.exports = router;