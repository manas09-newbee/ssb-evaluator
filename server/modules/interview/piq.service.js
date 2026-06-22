const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Write database to the root directory outside /server so nodemon never triggers a restart
const dbPath = path.join(__dirname, "../../../collectedQuestions.json");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsedBank = JSON.parse(cleaned);

    // Log the generated questions into the database
    saveUniqueQuestions(parsedBank);

    return parsedBank;
  } catch (error) {
    console.error("Invalid JSON received from Gemini API:");
    console.error(cleaned);
    throw error;
  }
};

module.exports = {
  generateQuestionBank,
};