const sessions = require("./sessionStore");
const crypto = require("crypto");
const { generateQuestionBank } = require("./piq.service");

// Import Google Generative AI components for the contradiction analysis
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/**
 * Defensive utility to parse JSON outputs cleanly, extracting content 
 * even if the model wraps it in Markdown blocks or text.
 */
const cleanAndParseJSON = (text) => {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: Locate any JSON block within curly braces
    const jsonRegex = /\{[\s\S]*\}/;
    const match = cleaned.match(jsonRegex);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        throw innerErr;
      }
    }
    throw err;
  }
};

const getFirstQuestion = async (piq) => {
  const sessionId = crypto.randomUUID();

  const questionBank = await generateQuestionBank(piq);

  console.log("Question Bank Generated:");
  console.log(questionBank);

  // PHASES 1 & 6: Session object stores the PIQ, empty contradiction notes, and response metric structures
  sessions.set(sessionId, {
    piq, // Stored persistently inside active session
    history: [],
    currentQuestion: questionBank.introduction[0],
    askedQuestions: [questionBank.introduction[0]],
    questionBank,
    followUpQuestions: [],
    stage: "introduction",
    stageIndex: 0,
    questionIndex: 0,
    createdAt: Date.now(),
    contradictionNotes: [], // Store running background evaluations here
    responseMetrics: {      // Placeholder analytics variables initialized
      averageAnswerLength: 0,
      totalQuestionsAnswered: 0,
      totalInterviewDuration: 0
    }
  });

  console.log(sessions);

  return {
    sessionId,
    question: questionBank.introduction[0]
  };
};

/**
 * PHASE 3: Background analysis comparing candidate answers against their stated PIQ
 */
const analyzeContradictionsAndGenerateQuestion = async (session) => {
  const prompt = `
You are an expert SSB Interviewing Officer.

Compare the candidate's PIQ details against their current interview history. Perform these tasks:
1. Identify any contradictions between their responses and the PIQ.
2. Identify unexplored areas inside the PIQ.
3. Identify weak or brief answers.
4. Generate EXACTLY ONE deep-dive follow-up question that addresses these observations directly.

PIQ:
${JSON.stringify(session.piq)}

Interview History:
${JSON.stringify(session.history)}

Return ONLY a valid JSON object. No conversational filler, no code blocks, no markdown.

Expected Structure:
{
  "contradictionDetected": true/false,
  "findings": "Detail contradictions, weak responses, or unexplored details here.",
  "deepDiveQuestion": "The single follow-up question to inject next."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("[Contradiction Analyzer] Service failure:", error);
    return {
      contradictionDetected: false,
      findings: "Skipped background verification due to processing limits.",
      deepDiveQuestion: null
    };
  }
};

module.exports = {
  getFirstQuestion,
  analyzeContradictionsAndGenerateQuestion
};