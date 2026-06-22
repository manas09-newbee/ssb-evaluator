const ppdtServices = require("./ppdt.services");

const evaluateStory = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({
        message: "Handwritten story image is required."
      });
    }

    const result = await ppdtServices.evaluateHandwrittenStory(image);
    res.json(result);
  } catch (error) {
    console.error("PPDT Controller Error:", error);
    res.status(500).json({
      message: "Failed to process PPDT evaluation."
    });
  }
};

module.exports = {
  evaluateStory
};