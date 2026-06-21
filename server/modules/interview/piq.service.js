const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");


const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

const model =
  genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

const generateMockPIQ = () => {
  return {
    personal: {
      name: "Manas",
      age: 24,
      entry: "AFCAT"
    },

    education: {
      qualification: "MCA"
    },

    hobbies: [
      "Reading",
      "Railfanning"
    ],

    sports: [
      "Gym"
    ],

    ssbHistory: {
      attempts: 10
    }
  };
};


const generateQuestionBank =
  async (piq) => {

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

1. Generate 5 questions per normal section.

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

    const result =
      await model.generateContent(
        prompt
      );

    const text =
  result.response.text();

const cleaned =
  text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

try {

  return JSON.parse(
    cleaned
  );

} catch (error) {

  console.error(
    "Invalid JSON:"
  );

  console.error(cleaned);

  throw error;
}
};

module.exports = {
  generateMockPIQ,
  generateQuestionBank
};