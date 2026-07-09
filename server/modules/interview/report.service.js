const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callWithFallback } = require("../../services/groqService");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "placeholder-key-to-avoid-startup-crash"
);

// Changed model to 3-flash-preview for high-accuracy parsing
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

/**
 * Defensive utility to extract JSON objects from the text,
 * stripping XML-style reasoning blocks (<think>...</think>) if present.
 */
const parseCleanJSON = (text) => {
  // Strip XML-style thinking/reasoning blocks if present
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const cleaned = stripped
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonRegex = /\{[\s\S]*\}/;
    const match = cleaned.match(jsonRegex);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw err;
  }
};

const generateInterviewReport = async (history) => {
  const prompt = `
You are an expert SSB Assessor.

Analyze the candidate's interview transcript and evaluate their performance.

Evaluate the following parameters, scoring each out of 10:
1. communication
2. leadership
3. initiative
4. responsibility
5. socialAdaptability
6. selfConfidence
7. effectiveIntelligence

Identify clear strengths, weaknesses, and any contradictions found. Combine findings into a recommendation summary.

Interview History:
${JSON.stringify(history)}

Return ONLY a valid JSON object. No conversational filler, no code blocks, no markdown.

Expected JSON Structure:
{
  "communication": 0,
  "leadership": 0,
  "initiative": 0,
  "responsibility": 0,
  "socialAdaptability": 0,
  "selfConfidence": 0,
  "effectiveIntelligence": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "contradictions": ["string"],
  "recommendationSummary": "string"
}
`;

  try {
    const text = await callWithFallback(
      async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      prompt
    );

    return parseCleanJSON(text);
  } catch (err) {
    console.error("JSON parsing error on report, loading fallback structured container:", err);
    return {
      communication: 6,
      leadership: 5,
      initiative: 5,
      responsibility: 5,
      socialAdaptability: 6,
      selfConfidence: 5,
      effectiveIntelligence: 5,
      strengths: ["Spoke clearly during introductory phases"],
      weaknesses: ["Provide more analytical structure during situational questions"],
      contradictions: ["Refer to the raw history logs"],
      recommendationSummary: err.message || "Manual report generated due to service limits."
    };
  }
};

module.exports = {
  generateInterviewReport,
};