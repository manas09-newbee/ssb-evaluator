const oirService = require("./oir.service");
const OIRAttempt = require("../../models/OIRAttempt");
const crypto = require("crypto");

const getOirQuestions = async (req, res) => {
  try {
    const { difficulty, limit } = req.query;
    const questions = oirService.getTestQuestions(difficulty, limit);

    // Standard safety fallback to prevent empty tests
    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found matching your filter parameters." });
    }

    res.json(questions);
  } catch (err) {
    console.error("Get OIR Questions controller error:", err);
    res.status(500).json({ message: "Failed to compile OIR questionnaire." });
  }
};

const submitOirTest = async (req, res) => {
  try {
    const { answers, difficulty, totalQuestions, timeTaken } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers submitted." });
    }

    // Fetch the raw questions once per request context
    const allQuestions = oirService.loadAllQuestions();

    // Map all questions dynamically to a cache keyed by SHA-256 hash ids
    const questionLookupMap = new Map();
    allQuestions.forEach((q) => {
      const qId = crypto.createHash("sha256").update(q.question).digest("hex");
      questionLookupMap.set(qId, q);
    });

    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let score = 0;
    let maxScore = 0;

    const categoryPerformance = {};
    const detailedAnswers = [];

    answers.forEach((ans) => {
      // Look up directly from request context cache Map
      const realQ = questionLookupMap.get(ans.questionId);
      if (!realQ) {
        skipped++;
        return; // Skip evaluation if the question key doesn't resolve
      }

      const isCorrect = ans.selectedAnswer === realQ.correctAnswer;
      const isSkipped = !ans.selectedAnswer || ans.selectedAnswer.trim() === "";
      const marks = realQ.marks || 1;
      maxScore += marks;

      // Track individual category metrics
      if (!categoryPerformance[realQ.category]) {
        categoryPerformance[realQ.category] = { correct: 0, total: 0 };
      }
      categoryPerformance[realQ.category].total += 1;

      if (isSkipped) {
        skipped++;
      } else if (isCorrect) {
        correct++;
        score += marks;
        categoryPerformance[realQ.category].correct += 1;
      } else {
        incorrect++;
      }

      detailedAnswers.push({
        question: realQ.question,
        options: realQ.options,
        correctAnswer: realQ.correctAnswer,
        selectedAnswer: ans.selectedAnswer || "Skipped",
        isCorrect: !isSkipped && isCorrect,
        explanation: realQ.explanation,
        category: realQ.category
      });
    });

    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    const newAttempt = new OIRAttempt({
      user: userId,
      score,
      maxScore,
      correct,
      incorrect,
      skipped,
      timeTaken,
      accuracy,
      difficulty,
      totalQuestions,
      categoryPerformance,
      answers: detailedAnswers
    });

    await newAttempt.save();

    res.status(201).json({
      attemptId: newAttempt._id,
      score,
      maxScore,
      correct,
      incorrect,
      skipped,
      accuracy,
      timeTaken,
      difficulty,
      totalQuestions,
      categoryPerformance,
      answers: detailedAnswers
    });
  } catch (err) {
    console.error("Submit OIR controller error:", err);
    res.status(500).json({ message: "Failed to process test results." });
  }
};

const getOirStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const attempts = await OIRAttempt.find({ user: userId }).sort({ createdAt: 1 });

    if (attempts.length === 0) {
      return res.json({
        hasStats: false,
        totalAttempts: 0,
        highestScore: 0,
        averageScore: 0,
        recentAttempts: [],
        performanceTrend: []
      });
    }

    const totalAttempts = attempts.length;
    const scorePercentages = attempts.map((a) => (a.score / a.maxScore) * 100);
    const highestScore = Math.max(...scorePercentages);
    const averageScore = scorePercentages.reduce((sum, s) => sum + s, 0) / totalAttempts;

    const recentAttempts = attempts.slice(-5).reverse();
    const performanceTrend = attempts.map((a) => ({
      date: a.createdAt,
      scorePercent: Math.round((a.score / a.maxScore) * 100)
    }));

    res.json({
      hasStats: true,
      totalAttempts,
      highestScore: Math.round(highestScore),
      averageScore: Math.round(averageScore),
      recentAttempts,
      performanceTrend
    });
  } catch (err) {
    console.error("OIR aggregate stats fetch error:", err);
    res.status(500).json({ message: "Failed to load OIR statistics." });
  }
};

const getOirReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await OIRAttempt.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report profile not found." });
    }

    // Verify requesting candidate is the resource owner
    if (String(report.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to view this report." });
    }

    res.json(report);
  } catch (err) {
    console.error("Get individual OIR report error:", err);
    res.status(500).json({ message: "Failed to fetch evaluation details." });
  }
};

module.exports = {
  getOirQuestions,
  submitOirTest,
  getOirStats,
  getOirReportDetails
};