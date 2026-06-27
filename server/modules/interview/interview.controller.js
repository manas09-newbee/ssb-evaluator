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
const { analyzeContradictionsAndGenerateQuestion } = require("./interview.service");

// Import Interview model directly to write transcripts in real-time [1]
const Interview = require("../../models/Interview");

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

    // Phase 2: Enhanced History Logging
    const currentStage = session.stage;
    const questionNumber = session.history.length + 1;
    session.history.push({
      question: session.currentQuestion,
      answer,
      stage: currentStage,
      timestamp: Date.now(),
      answerLength: answer.trim().length,
      questionNumber
    });

    // Write-back current transcript line natively to MongoDB if session is linked [1]
    if (session.dbInterviewId) {
      try {
        await Interview.findByIdAndUpdate(session.dbInterviewId, {
          $push: {
            transcript: {
              question: session.currentQuestion,
              answer: answer,
              stage: currentStage,
              timestamp: new Date(),
              answerLength: answer.trim().length
            }
          }
        });
        console.log(`[Database] Real-time saved answer for question #${questionNumber} to MongoDB.`);
      } catch (dbErr) {
        console.error("[Database] Failed real-time answer sync to MongoDB:", dbErr.message);
      }
    }

    // Phase 6: Future Analytics Foundation
    const totalQuestions = session.history.length;
    const totalLength = session.history.reduce((sum, h) => sum + (h.answerLength || 0), 0);
    session.responseMetrics = session.responseMetrics || {
      averageAnswerLength: 0,
      totalQuestionsAnswered: 0,
      totalInterviewDuration: 0
    };
    session.responseMetrics.totalQuestionsAnswered = totalQuestions;
    session.responseMetrics.averageAnswerLength = totalQuestions > 0 ? Math.round(totalLength / totalQuestions) : 0;
    session.responseMetrics.totalInterviewDuration = Math.round((Date.now() - session.createdAt) / 1000);

    let nextQuestion = null;
    let isDeepDive = false;

    // Phase 3: PIQ-Aware Contradiction Analyzer
    if (totalQuestions > 0 && totalQuestions % 2 === 0) {
      console.log(`[Contradiction Analyzer] Running background validation at question #${totalQuestions}...`);
      try {
        const analysis = await analyzeContradictionsAndGenerateQuestion(session);
        if (analysis && analysis.deepDiveQuestion) {
          nextQuestion = analysis.deepDiveQuestion;
          isDeepDive = true;
          console.log("[Contradiction Analyzer] Injected dynamic deep-dive:", nextQuestion);
          if (analysis.findings) {
            session.contradictionNotes.push({
              atQuestion: totalQuestions,
              findings: analysis.findings
            });
          }
        }
      } catch (analysisErr) {
        console.error("[Contradiction Analyzer] Failed background run:", analysisErr.message);
      }
    }

    // Fallback to standard blueprint path if no deep-dive question was injected
    if (!nextQuestion) {
      nextQuestion = getNextQuestion(session);
    }

    if (!nextQuestion) {
      // Trigger update to completed state in DB if session is linked [1]
      if (session.dbInterviewId) {
        try {
          await Interview.findByIdAndUpdate(session.dbInterviewId, {
            status: "completed",
            completedAt: new Date(),
            durationSeconds: Math.round((Date.now() - session.createdAt) / 1000)
          });
          console.log("[Database] Marked interview as completed on natural run end.");
        } catch (dbErr) {
          console.error("[Database] Failed natural run end sync:", dbErr.message);
        }
      }

      return res.json({
        interviewCompleted: true,
        responseMetrics: session.responseMetrics
      });
    }

    session.currentQuestion = nextQuestion;
    session.askedQuestions.push(nextQuestion);

    res.json({
      nextQuestion,
      stage: isDeepDive ? "dynamic_deep_dive" : session.stage,
      historyCount: totalQuestions,
      responseMetrics: session.responseMetrics
    });
  } catch (error) {
    console.error("Submit Answer Error:", error);
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

    // Save/Update final report metrics & findings directly to MongoDB Interview document [1]
    if (session.dbInterviewId) {
      try {
        const communicationVal = typeof report === "object" ? (report.communication || 0) : 0;
        const leadershipVal = typeof report === "object" ? (report.leadership || 0) : 0;
        const initiativeVal = typeof report === "object" ? (report.initiative || 0) : 0;
        const responsibilityVal = typeof report === "object" ? (report.responsibility || 0) : 0;
        const socialAdaptabilityVal = typeof report === "object" ? (report.socialAdaptability || 0) : 0;
        const selfConfidenceVal = typeof report === "object" ? (report.selfConfidence || 0) : 0;
        const effectiveIntelligenceVal = typeof report === "object" ? (report.effectiveIntelligence || 0) : 0;

        const contradictionsData = (session.contradictionNotes || []).map(note => ({
          question: `Question Verification #${note.atQuestion}`,
          finding: note.findings || "",
          severity: "medium",
          timestamp: new Date()
        }));

        await Interview.findByIdAndUpdate(session.dbInterviewId, {
          status: "completed",
          completedAt: new Date(),
          durationSeconds: Math.round((Date.now() - session.createdAt) / 1000),
          evaluation: {
            overallFeedback: typeof report === "object" ? (report.recommendationSummary || "") : "Manual report generated",
            overallScore: typeof report === "object" ? (report.overallScore || 0) : 0,
            olqScores: {
              communication: communicationVal,
              reasoning: typeof report === "object" ? (report.reasoning || 0) : 0,
              leadership: leadershipVal,
              socialAdaptability: socialAdaptabilityVal,
              effectiveIntelligence: effectiveIntelligenceVal,
              initiative: initiativeVal,
              responsibility: responsibilityVal,
              courage: typeof report === "object" ? (report.courage || 0) : 0,
              selfConfidence: selfConfidenceVal
            }
          },
          contradictions: contradictionsData
        });
        console.log("[Database] Successfully committed final compiled Interview report details to MongoDB.");
      } catch (dbErr) {
        console.error("[Database] Failed final report database save:", dbErr.message);
      }
    }

    // Extract metrics and notes before clearing memory
    const responseMetrics = session.responseMetrics || {
      averageAnswerLength: 0,
      totalQuestionsAnswered: session.history.length,
      totalInterviewDuration: Math.round((Date.now() - session.createdAt) / 1000)
    };
    const contradictionNotes = session.contradictionNotes || [];

    sessions.delete(sessionId);
    console.log(
      "Session deleted:",
      sessionId
    );
    res.json({
      report,
      responseMetrics,
      contradictionNotes
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