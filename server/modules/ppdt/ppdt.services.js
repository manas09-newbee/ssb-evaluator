const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callWithFallback } = require("../../services/groqService");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "placeholder-key-to-avoid-startup-crash"
);
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

/**
 * Defensive utility to extract clean JSON matching our target schema,
 * even if the model wraps it inside Markdown code blocks or reasoning blocks.
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

const evaluateHandwrittenStory = async (base64Image) => {
  const prompt = `
You are an expert SSB Assessor specializing in PPDT (Picture Perception & Description Test).

Analyze this image of a candidate's handwritten story and perform these tasks:

1. OCR Transcription: Carefully transcribe the handwritten text word-for-word. Keep spelling or phrasing exactly as written.
2. Handwriting Legibility Assessment: Evaluate readability of the penmanship (Score 0-10).
3. Grammar & Structure Assessment: Grade grammatical accuracy and punctuation (Score 0-10).
4. Story Assessment: Rate the thematic alignment and logical outcome (Score 0-10).
5. Extract key positive and negative narrative indicators.
6. List distinct strengths and weaknesses of the script and overall penmanship.
7. Evaluate the following 5 OLQs, scoring each out of 10:
   - initiative
   - leadership
   - cooperation
   - responsibility
   - courage

Return ONLY a valid JSON object. No conversational filler, no code blocks, no markdown.

Expected JSON Structure:
{
  "transcription": "transcribed handwritten text",
  "handwritingScore": 0,
  "grammarScore": 0,
  "storyScore": 0,
  "positiveIndicators": ["string"],
  "negativeIndicators": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "olqScores": {
    "initiative": 0,
    "leadership": 0,
    "cooperation": 0,
    "responsibility": 0,
    "courage": 0
  }
}
`;

  try {
    // Call Gemini with safe fallback to Groq and vision model handling
    const responseText = await callWithFallback(
      async () => {
        // Run image translation safely inside the handler scope
        const imagePart = prepareImageForGemini(base64Image);
        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
      },
      prompt,
      base64Image,
      60000 // 60-second timeout for PPDT evaluation
    );

    return parseCleanJSON(responseText);
  } catch (err) {
    console.error("Failed to parse structured PPDT JSON, loading safe fallback object:", err);
    return {
      transcription: "Failed to transcribe due to processing limits.",
      handwritingScore: 5,
      grammarScore: 5,
      storyScore: 5,
      positiveIndicators: ["Observation complete"],
      negativeIndicators: ["Review logs for any concerns"],
      strengths: ["Handwritten document successfully submitted"],
      weaknesses: ["Structure could not be parsed dynamically"],
      olqScores: {
        initiative: 5,
        leadership: 5,
        cooperation: 5,
        responsibility: 5,
        courage: 5
      }
    };
  }
};

module.exports = {
  evaluateHandwrittenStory
};