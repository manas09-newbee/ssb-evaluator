const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const { callWithFallback } = require("../../services/groqService");

// Write database to the root directory outside /server so nodemon never triggers a restart
const dbPath = path.join(__dirname, "../../../collectedQuestions.json");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "placeholder-key-to-avoid-startup-crash"
);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

const defaultQuestionBank = {
  introduction: [
    "Welcome, please introduce yourself, starting from your birthplace and leading up to your current status.",
    "Tell me about the city you come from and two things you would like to change about it if given the authority.",
    "Walk me through your daily routine from the moment you wake up until you go to bed."
  ],
  family: [
    "Describe your relationship with your parents and who among them is your go-to person in crisis.",
    "How do you contribute to your family income or assist in managing household expenses?"
  ],
  familyRapidFire: [
    "Tell me your father's occupation, mother's occupation, number of siblings, family income and responsibilities at home."
  ],
  education: [
    "Why did you choose your specific stream of study, and how does it align with your future goals?",
    "Compare your academic performance in 10th standard with 12th standard and explain any fluctuations."
  ],
  educationRapidFire: [
    "Tell me the name of your school, your favorite and least favorite subjects, your percentage in 10th and 12th, and best friends."
  ],
  responsibilities: [
    "As a student, what are the most significant responsibilities you have undertaken either in school or at home?"
  ],
  achievements: [
    "What do you consider your greatest achievement in your school or college life so far?"
  ],
  failures: [
    "Tell me about a time you worked hard but failed to achieve your goal and how you dealt with the disappointment."
  ],
  leadership: [
    "Describe a situation where you had to lead a team or group project and handle differences in opinion."
  ],
  hobbies: [
    "What do you enjoy most about your hobbies and how have they helped shape your thought process?"
  ],
  defenceMotivation: [
    "Why exactly did you choose the Armed Forces as a career path over conventional options?",
    "Which arm of the Defence forces are you most interested in joining and why?"
  ],
  currentAffairs: [
    "Mention three major national or geopolitical news stories from the last month that you found most impactful."
  ],
  situational: [
    "Suppose you are traveling to the SSB and your train gets delayed by 10 hours, making you miss the reporting time; what is your course of action?"
  ],
  closing: [
    "Is there anything mentioned in your PIQ that you feel we haven't discussed but is important to highlight?"
  ]
};

/**
 * Parses and appends new unique questions to a local JSON file database
 * to preserve data for future fine-tuning or training.
 */
const saveUniqueQuestions = (questionBank) => {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existingQuestions = [];
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      try {
        existingQuestions = JSON.parse(raw || "[]");
      } catch (e) {
        existingQuestions = [];
      }
    }

    const normalizedExisting = new Set(
      existingQuestions.map((q) => q.toLowerCase().trim())
    );
    const newlyCollected = [];

    for (const section in questionBank) {
      if (Array.isArray(questionBank[section])) {
        questionBank[section].forEach((q) => {
          if (q && typeof q === "string") {
            const trimmed = q.trim();
            const normalized = trimmed.toLowerCase();
            if (!normalizedExisting.has(normalized) && trimmed.length > 0) {
              newlyCollected.push(trimmed);
              normalizedExisting.add(normalized);
            }
          }
        });
      }
    }

    if (newlyCollected.length > 0) {
      const updated = [...existingQuestions, ...newlyCollected];
      fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2), "utf-8");
      console.log(
        `[Database] Saved ${newlyCollected.length} new unique questions. Total stored: ${updated.length}`
      );
    }
  } catch (err) {
    console.error("Database Save Error:", err);
  }
};

/**
 * Generates a dynamic question bank based on candidate's real PIQ details.
 */
const generateQuestionBank = async (piq) => {
  const prompt = `
You are an experienced SSB Interviewing Officer.

Based on the candidate PIQ below,
generate interview questions.

PIQ:
${JSON.stringify(piq)}

Return ONLY valid JSON.
Return ONLY a valid JSON object.

No markdown.
No explanations.
No code blocks.

Generate realistic SSB Interview questions.

Structure:

{
  "introduction": [],
  "family": [],
  "familyRapidFire": [],

  "education": [],
  "educationRapidFire": [],

  "responsibilities": [],
  "achievements": [],
  "failures": [],

  "leadership": [],
  "hobbies": [],

  "defenceMotivation": [],

  "currentAffairs": [],

  "situational": [],

  "closing": []
}

Rules:

1. Generate exactly 3 questions per normal section.

2. Generate exactly 1 rapid-fire question for:
   - familyRapidFire
   - educationRapidFire

3. Rapid fire should contain 5-8 related questions in one sentence.

Example:

"Tell me your father's occupation, mother's occupation, number of siblings, family income and responsibilities at home."

4. Questions must be based on the PIQ.

5. Questions should feel like a real SSB Interviewing Officer.

6. Avoid generic HR interview questions.

7. Return JSON only.
`;

  try {
    // Process via standard fallback flow with 15-second timeout
    const text = await callWithFallback(
      async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      prompt,
      null,
      15000 
    );

    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "") // Strip reasoning blocks
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedBank = JSON.parse(cleaned);

    // Log the generated questions into the database
    saveUniqueQuestions(parsedBank);

    return parsedBank;
  } catch (error) {
    console.warn("AI Question Bank Generation failed. Activating fallback bank:", error.message);
    return defaultQuestionBank;
  }
};

module.exports = {
  generateQuestionBank,
};