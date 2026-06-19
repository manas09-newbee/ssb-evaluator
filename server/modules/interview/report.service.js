const {
  GoogleGenerativeAI,
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generateInterviewReport =
  async (history) => {
    const prompt = `
You are an SSB assessor.

Evaluate the candidate based on:

1. Communication
2. Confidence
3. Leadership
4. Initiative
5. Responsibility
6. Social Adaptability

Interview History:
${JSON.stringify(history)}

Return the evaluation in this format:

Communication: X/10
Confidence: X/10
Leadership: X/10
Initiative: X/10
Responsibility: X/10
Social Adaptability: X/10

Summary:
`;

    const result =
      await model.generateContent(prompt);

    return result.response.text();
  };

module.exports = {
  generateInterviewReport,
};