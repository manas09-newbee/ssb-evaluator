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

const generateCrossQuestion =
  async (history) => {

    const prompt = `
You are an SSB Interviewing Officer.

Based on the interview history,
ask ONE realistic follow-up question.

History:
${JSON.stringify(history)}

Return only the next question.
`;

    let attempts = 3;

    while (attempts > 0) {
      try {

        console.log(
          `Gemini Attempt ${
            4 - attempts
          }`
        );

        const result =
          await model.generateContent(
            prompt
          );

        return result.response
          .text()
          .trim();

      } catch (error) {

        attempts--;

        console.log(
          "Gemini Failed:",
          error.message
        );

        if (attempts === 0) {
          throw error;
        }

        await sleep(2000);
      }
    }
};

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

module.exports = {
  generateCrossQuestion,
};