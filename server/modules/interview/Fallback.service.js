const leadershipQuestions = [
  "Can you describe a situation where you had to take charge?",
  "What was the biggest challenge you faced as a leader?",
  "How do you handle disagreements in a team?",
  "Tell me about a time when your team depended on you.",
  "What leadership quality do you think you need to improve?"
];

const educationQuestions = [
  "Why did you choose this field of study?",
  "What has been your biggest learning during college?",
  "Which subject interests you the most and why?",
  "What academic achievement are you most proud of?",
  "How has MCA helped in your personal growth?"
];

const familyQuestions = [
  "Tell me more about your family background.",
  "Who has influenced you the most in your family?",
  "How has your family shaped your personality?",
  "What values have you learned from your parents?",
  "How would your family describe you?"
];

const defenceQuestions = [
  "Why do you want to join the Armed Forces?",
  "What attracts you most towards military life?",
  "What qualities are essential for an officer?",
  "How has your father's service influenced you?",
  "Why should the Armed Forces select you?"
];

const achievementQuestions = [
  "Which achievement are you most proud of?",
  "What challenges did you overcome to achieve it?",
  "What did you learn from that experience?",
  "How did your contribution impact others?"
];

const failureQuestions = [
  "Tell me about a failure that taught you something important.",
  "How did that failure change your approach?",
  "What would you do differently today?",
  "How did you recover from that setback?"
];

const hobbyQuestions = [
  "What do you enjoy most about this hobby?",
  "How has this hobby helped you develop as a person?",
  "What skills have you gained from it?",
  "How much time do you dedicate to it?"
];

const randomQuestion = (arr) => {
  return arr[
    Math.floor(Math.random() * arr.length)
  ];
};

const generateFallbackQuestion = (history) => {

  const answer =
    history[history.length - 1]?.answer || "";

  const lower =
    answer.toLowerCase();

  // Defence first (high priority)
  if (
    lower.includes("army") ||
    lower.includes("defence") ||
    lower.includes("iaf") ||
    lower.includes("air force") ||
    lower.includes("officer") ||
    lower.includes("fauji")
  ) {
    return randomQuestion(
      defenceQuestions
    );
  }

  // Leadership
  if (
    lower.includes("leader") ||
    lower.includes("lead") ||
    lower.includes("captain") ||
    lower.includes("managed") ||
    lower.includes("organised") ||
    lower.includes("organized")
  ) {
    return randomQuestion(
      leadershipQuestions
    );
  }

  // Family
  if (
    lower.includes("father") ||
    lower.includes("mother") ||
    lower.includes("family") ||
    lower.includes("brother") ||
    lower.includes("sister")
  ) {
    return randomQuestion(
      familyQuestions
    );
  }

  // Education
  if (
    lower.includes("mca") ||
    lower.includes("bca") ||
    lower.includes("college") ||
    lower.includes("university") ||
    lower.includes("study") ||
    lower.includes("education")
  ) {
    return randomQuestion(
      educationQuestions
    );
  }

  // Achievements
  if (
    lower.includes("achievement") ||
    lower.includes("award") ||
    lower.includes("event") ||
    lower.includes("hosted") ||
    lower.includes("won")
  ) {
    return randomQuestion(
      achievementQuestions
    );
  }

  // Failure
  if (
    lower.includes("failure") ||
    lower.includes("failed") ||
    lower.includes("mistake") ||
    lower.includes("rejected")
  ) {
    return randomQuestion(
      failureQuestions
    );
  }

  // Hobbies
  if (
    lower.includes("reading") ||
    lower.includes("book") ||
    lower.includes("football") ||
    lower.includes("cricket") ||
    lower.includes("hobby")
  ) {
    return randomQuestion(
      hobbyQuestions
    );
  }

  return "Could you explain that with a real-life example?";
};

module.exports = {
  generateFallbackQuestion,
};