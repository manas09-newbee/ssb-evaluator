const interviewService = require("./interview.service");
const sessions = require("./sessionStore");
const startInterview = (req, res) => {
  const data = interviewService.getFirstQuestion();

  res.json(data);
};

const submitAnswer = (req, res) => {
  const { sessionId, answer } = req.body;

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    });
  }

  session.history.push({
    question: session.currentQuestion,
    answer,
  });

  console.log(session.history);

  res.json({
    nextQuestion:
      "Can you give a real example from your life?",
  });
};


module.exports = {
  startInterview,
  submitAnswer,
};