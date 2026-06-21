const sessions = require("./sessionStore");
const crypto = require("crypto");
const {
  generateMockPIQ,
  generateQuestionBank
} = require("./piq.service");

const getFirstQuestion = async () => {

  const sessionId =
    crypto.randomUUID();

  const piq =
    generateMockPIQ();

  const questionBank =
    await generateQuestionBank(
      piq
    );

    console.log(
      "Question Bank Generated:"
    );

console.log(questionBank);

  sessions.set(sessionId, {

    history: [],

    currentQuestion:
      questionBank.introduction[0],

    askedQuestions: [
      questionBank.introduction[0]
    ],

    questionBank,

    followUpQuestions: [],

    stage: "introduction",

    stageIndex: 0,

    questionIndex: 0,

    createdAt: Date.now()
  });

  console.log(sessions);

  return {
    sessionId,
    question:
      questionBank.introduction[0]
  };
};



module.exports = {
  getFirstQuestion
};