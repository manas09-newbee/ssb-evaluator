const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini 3 Flash Preview as requested
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

/**
 * Parses a Base64 data URL string into the exact structure expected by the Gemini SDK.
 */
const prepareImageForGemini = (base64Str) => {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format. Expected a standard base64 data URL.");
  }
  return {
    inlineData: {
      data: matches[2],
      mimeType: matches[1]
    }
  };
};

const evaluateHandwrittenStory = async (base64Image) => {
  const imagePart = prepareImageForGemini(base64Image);

  const prompt = `
You are an expert SSB Assessor specializing in PPDT (Picture Perception & Description Test).

Analyze this image of a candidate's handwritten story and perform the following tasks:

1. OCR Transcription: Carefully transcribe the handwritten text word-for-word. Keep spelling or phrasing exactly as written (do not auto-correct mistakes in transcription).
2. Handwriting Legibility Assessment: Evaluate the readability and neatness of the penmanship under timed stress conditions. Provide a score from 1 to 10 and practical feedback.
3. Grammar & Structure Assessment: Highlight grammatical, structural, or spelling errors found in the story.
4. SSB Narrative Analysis:
   - Identify the character traits (estimated age, mood, sex) of the hero and supporting cast.
   - Summarize the central theme and action of the story (Is the hero actively solving a problem, or is the narrative passive?).
   - Identify demonstrated Officer Like Qualities (OLQs) (e.g. Effective Intelligence, Initiative, Reasoning Ability, Social Adaptability, Speed of Decision).
   - Point out key positive/negative narrative indicators (e.g., escape tendencies, unnecessary tragedy, or constructive resolutions).
5. Assessor's Recommendations: Provide concrete tips for improvement.

Please return your entire evaluation in this clean text format:

--- TRANSCRIPTION ---
[Word-for-word handwritten text transcription here]

--- HANDWRITING ASSESSMENT ---
Score: X/10
Feedback: [Details on legibility, neatness, and suggestions]

--- GRAMMAR & STRUCTURE ---
[Grammar, syntax, and spelling observations]

--- SSB NARRATIVE & CHARACTER ANALYSIS ---
[Character profiles, mood, theme, and actions]

--- OLQ EVALUATION ---
[Detailed list of reflected OLQs and indicators]

--- ASSESSOR RECOMMENDATIONS ---
[Actionable tips to improve story structure, handwriting neatness under timed pressure, or theme development]
`;

  const result = await model.generateContent([prompt, imagePart]);
  const evaluationText = result.response.text();

  return {
    evaluation: evaluationText
  };
};

module.exports = {
  evaluateHandwrittenStory
};