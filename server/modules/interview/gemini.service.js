const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");
const { callWithFallback } = require("../../services/groqService");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "placeholder-key-to-avoid-startup-crash"
);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

console.log(
  "KEY EXISTS:",
  !!process.env.GEMINI_API_KEY
);

console.log(
  "Key length:",
  process.env.GEMINI_API_KEY?.length
);

const generateCrossQuestion = async (history) => {
  const prompt = `
You are an SSB Interviewing Officer.

Based on the interview history,
ask ONE realistic follow-up question.

History:
${JSON.stringify(history)}

Return only the next question.
`;

  // Process via standard fallback flow with a 6-second timeout
  const result = await callWithFallback(
    async () => {
      const res = await model.generateContent(prompt);
      return res.response.text().trim();
    },
    prompt,
    null,
    20000 // 20-second timeout for follow-up cross questions
  );

  return result;
};

module.exports = {
  generateCrossQuestion,
};