const generateFallbackQuestion = (
  history
) => {

  const answer =
    history[history.length - 1]
      ?.answer || "";

  const lower =
    answer.toLowerCase();

  if (
    lower.includes("leader") ||
    lower.includes("captain")
  ) {
    return "What leadership challenges did you face?";
  }

  if (
    lower.includes("team")
  ) {
    return "How did you handle disagreements within the team?";
  }

  if (
    lower.includes("college")
  ) {
    return "What was your biggest learning during college?";
  }

  if (
    lower.includes("failure")
  ) {
    return "How did that failure change your approach?";
  }

  if (
    lower.includes("book")
  ) {
    return "Which book influenced you the most and why?";
  }

  return `You mentioned "${answer
    .split(" ")
    .slice(0, 5)
    .join(" ")}...". Can you elaborate on that?`;
};

module.exports = {
  generateFallbackQuestion,
};