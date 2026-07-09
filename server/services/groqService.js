const Groq = require("groq-sdk");

// Initialize Groq client safely (handles missing API key gracefully until a call is made)
let groq;
try {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "placeholder-key-to-avoid-startup-crash-if-missing",
  });
} catch (e) {
  console.warn("Could not initialize Groq SDK:", e.message);
}

/**
 * Strips out any `<think> ... </think>` blocks from the AI's response text.
 */
function stripThinkingBlocks(text) {
  if (!text) return "";
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Validates whether the returned string contains valid JSON structure if JSON is expected.
 * Helper utility to verify response structure matches constraints.
 */
function isValidJSONResponse(text) {
  if (!text) return false;
  
  // Clean off reasoning blocks first
  const strippedText = stripThinkingBlocks(text);
  const cleaned = strippedText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    JSON.parse(cleaned);
    return true;
  } catch (err) {
    const jsonRegex = /\{[\s\S]*\}/;
    const match = cleaned.match(jsonRegex);
    if (match) {
      try {
        JSON.parse(match[0]);
        return true;
      } catch (innerErr) {
        return false;
      }
    }
    return false;
  }
}

/**
 * Generates text completions using Groq LLMs.
 * 
 * @param {string} prompt - The text prompt to process
 * @param {string|null} imageBase64 - Base64 encoded image string (optional, for PPDT vision tasks)
 * @returns {Promise<string>} Plain text response from Groq
 */
async function generateWithGroq(prompt, imageBase64 = null) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not defined in environment variables.");
    }
    
    let messages = [];
    let model = "llama-3.3-70b-versatile"; // High-quality text model as default fallback

    if (imageBase64) {
      // Use Llama 4 Scout (17B), Groq's active recommended replacement model for multimodal vision tasks
      model = "meta-llama/llama-4-scout-17b-16e-instruct";
      
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageBase64, // Pass the full browser base64 URL directly
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: prompt,
        },
      ];
    }

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.1, // Low temperature to preserve structured outputs
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("[Groq Service Error]:", err.message || err);
    throw err;
  }
}

/**
 * Promise wrapper to execute operations with a maximum time limit.
 */
function withTimeout(promise, ms, label = "Operation") {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Unified evaluation fallback function.
 * Tries the primary Gemini evaluation first with a dynamic timeout limit.
 * Falls back to Groq if Gemini fails, times out, is rate-limited, or returns empty/invalid JSON.
 */
async function callWithFallback(geminiCall, prompt, imageBase64 = null, timeoutMs = 11000) {
  console.log(`Using Gemini (Timeout: ${timeoutMs}ms)...`);
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    // Phase 1: Call Gemini with the dynamic timeout threshold
    const resultText = await withTimeout(geminiCall(), timeoutMs, "Gemini");

    // Phase 2: Validate response structure
    if (!resultText || !resultText.trim()) {
      throw new Error("Invalid response: Gemini returned an empty string.");
    }

    const isJsonExpected = prompt.toLowerCase().includes("json");
    if (isJsonExpected && !isValidJSONResponse(resultText)) {
      throw new Error("Invalid response: Gemini output does not contain valid JSON.");
    }

    return resultText;
  } catch (error) {
    if (error.message && error.message.includes("timed out")) {
      console.log(`Gemini timed out after ${timeoutMs}ms.`);
    } else {
      console.log("Gemini failed:", error.message || error);
    }

    // Phase 3: Switch to Groq
    console.log("Switching to Groq...");
    try {
      const groqResult = await generateWithGroq(prompt, imageBase64);
      console.log("Groq Success.");
      return groqResult;
    } catch (groqError) {
      console.log("Groq failed:", groqError.message || groqError);
      // Both fail, bubble error back up
      throw new Error("Both Gemini and Groq AI services failed to complete execution.");
    }
  }
}

module.exports = {
  generateWithGroq,
  callWithFallback,
};