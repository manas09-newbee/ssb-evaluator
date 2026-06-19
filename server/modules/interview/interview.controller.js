const interviewService = require("./interview.service");
const sessions = require("./sessionStore");

const {
  generateCrossQuestion,
} = require("./gemini.service");

const startInterview = (req, res) => {
  try {
    const data = interviewService.getFirstQuestion();

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to start interview",
    });
  }
};

const submitAnswer = async (req, res) => {
  try {
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

    let nextQuestion;

    try {
      nextQuestion =
        await generateCrossQuestion(
          session.history
        );
    } catch (error) {
      console.error(error);

      nextQuestion =
        "Could you explain that further?";
    }

    session.currentQuestion = nextQuestion;

    console.log(session.history);

    res.json({
      nextQuestion,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to process answer",
    });
  }
};


const getHistory = (req, res) => {
  const { sessionId } = req.params;

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    });
  }

  res.json(session.history);
};


module.exports = {
  startInterview,
  submitAnswer,
  getHistory,
};