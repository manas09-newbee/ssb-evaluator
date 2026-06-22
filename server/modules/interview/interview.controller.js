const interviewService = require("./interview.service");
const sessions = require("./sessionStore");
const {
  generateInterviewReport,
} = require("./report.service");
const {

  getNextQuestion,
} = require(
  "./stage.service"
);

const startInterview = async (
  req,
  res
) => {
  
  try {

    const { piq } = req.body;
    console.log(
  "PIQ RECEIVED:",
  piq
);

const data =
  await interviewService
    .getFirstQuestion(piq);

    console.log(
      "START DATA:",
      data
    );

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
    if (!answer || !answer.trim()) {
  return res.status(400).json({
    message: "Answer required",
  });
}
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

    

    const nextQuestion =  getNextQuestion(session);
    
    if (!nextQuestion) {

  return res.json({
    interviewCompleted:
      true,
  });
}

    session.currentQuestion = nextQuestion;
    session.askedQuestions.push(
  nextQuestion
);
    console.log(session.history);

    res.json({
  nextQuestion,
  stage: session.stage,
  historyCount:
    session.history.length,
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


const endInterview = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.body;

    const session =
      sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    let report;

try {
  report =
    await generateInterviewReport(
      session.history
    );
} catch (error) {
  console.error(
    "Report Generation Failed:",
    error
  );

  report = `
Interview Completed

Questions Answered:
${session.history.length}

Gemini report unavailable due to API limits.
`;
}

    sessions.delete(sessionId);
    console.log(
  "Session deleted:",
  sessionId
);
    res.json({
      report,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to generate report",
    });
  }
};


module.exports = {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
};