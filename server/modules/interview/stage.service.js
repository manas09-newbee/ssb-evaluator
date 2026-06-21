const interviewBlueprint =
  require("../../data/interviewBlueprint");

const getNextQuestion =
  (session) => {

    const currentStage =
      session.stage;

    const questions =
      session.questionBank[
        currentStage
      ];

    session.questionIndex++;

    if (
      session.questionIndex <
      questions.length
    ) {
      return questions[
        session.questionIndex
      ];
    }

    session.stageIndex++;

    if (
      session.stageIndex >=
      interviewBlueprint.length
    ) {
      return null;
    }

    const nextStage =
      interviewBlueprint[
        session.stageIndex
      ];

    session.stage =
      nextStage;

    session.questionIndex = 0;

    return session.questionBank[
      nextStage
    ][0];
};

module.exports = {
  getNextQuestion,
};