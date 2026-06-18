const sessions = require("./sessionStore");
const crypto = require("crypto");

const getFirstQuestion = () => {
  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    history: [],
    currentQuestion: "Tell me about yourself."
  });
   
  console.log(sessions);

  return {
    sessionId,
    question: "Tell me about yourself."
  };
};

module.exports = {
  getFirstQuestion
};