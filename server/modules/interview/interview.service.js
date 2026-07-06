const sessions = require("./sessionStore");
const crypto = require("crypto");
const { generateQuestionBank } = require("./piq.service");

// Import Google Generative AI components for the contradiction analysis
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callWithFallback } = require("../../services/groqService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Load database models to persist candidate sessions
const User = require("../../models/User");
const PIQ = require("../../models/PIQ");
const Interview = require("../../models/Interview");

/**
 * Defensive utility to parse JSON outputs cleanly.
 */
const cleanAndParseJSON = (text) => {
  // Strip XML-style thinking/reasoning blocks if present
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const cleaned = stripped
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
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

/**
 * Intelligent helper to extract and parse flat frontend text strings
 * into nested Mongoose validation-ready academic structures.
 */
const parseAcademicRecord = (textStr, levelDefaultPercent, defaultYear) => {
  if (!textStr || !textStr.trim()) {
    return {
      institution: "Not Provided",
      boardOrUniversity: "Not Provided",
      percentageOrCgpa: levelDefaultPercent,
      yearOfPassing: defaultYear,
      mediumOfInstruction: "English",
      achievements: []
    };
  }

  const parts = textStr.split(",").map(p => p.trim());
  const institution = parts[0] || "Not Provided";
  const boardOrUniversity = parts[1] || "Not Provided";

  // Parse 4-digit passing year
  let yearOfPassing = defaultYear;
  const yearMatch = textStr.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) {
    yearOfPassing = parseInt(yearMatch[1]);
  }

  // Parse percentages
  let percentageOrCgpa = levelDefaultPercent;
  const percentMatch = textStr.match(/(\d+(\.\d+)?)\s*%/);
  if (percentMatch) {
    percentageOrCgpa = parseFloat(percentMatch[1]);
  }

  return {
    institution,
    boardOrUniversity,
    percentageOrCgpa,
    yearOfPassing,
    mediumOfInstruction: parts[4] || "English",
    achievements: []
  };
};

/**
 * Maps the flat form payload received from the React state 
 * into your production-ready nested MongoDB PIQ schema.
 */
const mapFlatPiqToSchema = (flatPiq, userId) => {
  let ageValue = 21;
  let dobDate = new Date();
  
  if (flatPiq.dob) {
    const parsedDate = new Date(flatPiq.dob);
    if (!isNaN(parsedDate.getTime())) {
      dobDate = parsedDate;
      const ageDifMs = Date.now() - parsedDate.getTime();
      const ageDate = new Date(ageDifMs);
      ageValue = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  }

  return {
    user: userId,
    fullName: flatPiq.name || "Default Candidate",
    dateOfBirth: dobDate,
    age: ageValue,
    gender: "Male", // Fallback default value required by the schema
    maritalStatus: "Single",
    nationality: "Indian",
    address: {
      present: flatPiq.presentResidence || "Not Provided",
      permanent: flatPiq.permanentResidence || "Not Provided"
    },
    contact: {
      phone: "0000000000",
      email: "candidate@ssbevaluator.com"
    },
    family: {
      father: {
        alive: true,
        education: "Graduate",
        occupation: flatPiq.fatherOccupation || "Govt Service",
        incomePerMonth: parseFloat(flatPiq.fatherIncome) || 50000
      },
      mother: {
        alive: true,
        education: "Matric",
        occupation: flatPiq.motherOccupation || "Homemaker",
        incomePerMonth: parseFloat(flatPiq.motherIncome) || 0
      },
      siblings: [],
      totalMonthlyIncome: (parseFloat(flatPiq.fatherIncome) || 50000) + (parseFloat(flatPiq.motherIncome) || 0)
    },
    education: {
      class10: parseAcademicRecord(flatPiq.education_10th, 90, 2018),
      class12: parseAcademicRecord(flatPiq.education_12th, 85, 2020),
      graduation: parseAcademicRecord(flatPiq.education_graduation, 80, 2023)
    },
    employment: {
      currentStatus: flatPiq.presentOccupation || "Preparing",
      company: "",
      experienceMonths: 0
    },
    sports: flatPiq.sports ? [{ games: flatPiq.sports, level: "College", achievements: "" }] : [],
    ncc: {
      wing: flatPiq.nccTraining || "None",
      certificate: "None",
      campExperience: ""
    },
    responsibilities: {
      school: [],
      college: [],
      home: flatPiq.positionsOfResponsibility ? [flatPiq.positionsOfResponsibility] : []
    },
    hobbies: {
      hobbiesList: flatPiq.hobbies ? [flatPiq.hobbies] : [],
      interests: [],
      readingPreferences: [],
      creativeActivities: []
    },
    previousAttempts: {
      ssbAttemptsCount: parseInt(flatPiq.attempts) || 0,
      recommendedCount: 0,
      historyList: []
    },
    miscellaneous: {
      strengths: [],
      weaknesses: [],
      careerGoals: ""
    },
    status: "active"
  };
};

const getFirstQuestion = async (piq) => {
  const sessionId = crypto.randomUUID();

  const questionBank = await generateQuestionBank(piq);

  console.log("Question Bank Generated:");
  console.log(questionBank);

  // Retrieve or create our default candidate user to satisfy schema index constraints
  let user;
  try {
    user = await User.findOne({ email: "candidate@ssbevaluator.com" });
    if (!user) {
      user = new User({
        name: "Mock Candidate",
        email: "candidate@ssbevaluator.com",
        authProvider: "local",
        role: "candidate",
        isActive: true
      });
      user.password = "password123";
      await user.save();
      console.log("[Database] Automatically seeded standard mock candidate record.");
    }
  } catch (dbErr) {
    console.error("[Database] Error locating/seeding base user record:", dbErr.message);
  }

  let dbPiqId = null;
  let dbInterviewId = null;

  if (user) {
    try {
      // 1. Map and save PIQ snapshot natively to MongoDB
      const mappedPiqData = mapFlatPiqToSchema(piq, user._id);
      const newPiqDoc = new PIQ(mappedPiqData);
      const savedPiq = await newPiqDoc.save();
      dbPiqId = savedPiq._id;
      console.log("[Database] Persisted PIQ document directly to MongoDB, ID:", dbPiqId);

      // Bind current PIQ to active candidate record
      user.activePiq = dbPiqId;
      await user.save();

      // 2. Create ongoing Interview document in MongoDB
      const newInterviewDoc = new Interview({
        user: user._id,
        piq: dbPiqId,
        sessionId,
        status: "ongoing",
        startedAt: new Date(),
        transcript: []
      });
      const savedInterview = await newInterviewDoc.save();
      dbInterviewId = savedInterview._id;
      console.log("[Database] Ongoing Interview document initialized in MongoDB, ID:", dbInterviewId);
    } catch (saveErr) {
      console.error("[Database] Error writing user schemas to MongoDB:", saveErr);
    }
  }

  sessions.set(sessionId, {
    piq, 
    dbPiqId,
    dbInterviewId,
    userId: user ? user._id : null,
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
    const text = await callWithFallback(
      async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      prompt,
      null,
      60000 // 60-second timeout for background follow-up contradiction evaluation
    );
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