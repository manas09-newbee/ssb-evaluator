const interviewService = require("./interview.service");

const startInterview = (req, res) => {
  const data = interviewService.getFirstQuestion();

  res.json(data);
};

const submitAnswer = (req, res) => {
  const { answer } = req.body;

  console.log("Candidate Answer:", answer);

  res.json({
    nextQuestion:
      "Can you give a real example from your life?",
  });
};

module.exports = {
  startInterview,
  submitAnswer,
};