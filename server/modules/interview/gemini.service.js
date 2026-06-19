const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

console.log(
  "KEY EXISTS:",
  !!process.env.GEMINI_API_KEY
);

console.log(
  "Key length:",
  process.env.GEMINI_API_KEY?.length
);

const generateCrossQuestion = async (
  history
) => {
  const prompt = `
You are an SSB Interviewing Officer.

Based on the interview history,
ask ONE realistic follow-up question.

History:
${JSON.stringify(history)}

Return only the next question.
`;

  console.log("Calling Gemini...");

  const result =
    await model.generateContent(prompt);

  console.log(
    "Gemini Response:",
    result.response.text()
  );

  return result.response.text().trim();
};

module.exports = {
  generateCrossQuestion,
};