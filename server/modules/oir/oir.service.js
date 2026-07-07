const fs = require("fs");
const path = require("path");

const oirDataDir = path.join(__dirname, "../../data/oir");

// Safely generate folder directory if missing
if (!fs.existsSync(oirDataDir)) {
  fs.mkdirSync(oirDataDir, { recursive: true });
}

/**
 * Dynamically parse and pool questions from all JSON files in the directory
 */
const loadAllQuestions = () => {
  try {
    const files = fs.readdirSync(oirDataDir);
    let allQuestions = [];

    files.forEach((file) => {
      if (path.extname(file).toLowerCase() === ".json") {
        const filePath = path.join(oirDataDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const questions = JSON.parse(fileContent);
          if (Array.isArray(questions)) {
            allQuestions = allQuestions.concat(questions);
          }
        } catch (err) {
          console.error(`[Question Loader] Error parsing JSON file: ${file}`, err.message);
        }
      }
    });

    return allQuestions;
  } catch (err) {
    console.error("[Question Loader] Service directory parsing crash:", err);
    return [];
  }
};

/**
 * Filters and shuffles questions according to parameters.
 * Automatically loops and shuffles questions if the pool is smaller than the requested limit.
 */
const getTestQuestions = (difficulty, limit) => {
  const allQuestions = loadAllQuestions();
  
  let filtered = allQuestions;
  if (difficulty && difficulty.toLowerCase() !== "all") {
    filtered = allQuestions.filter(
      (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  // Safety fallback if no questions are found
  if (filtered.length === 0) {
    return [];
  }

  // Shuffle the initial list
  let shuffled = filtered.sort(() => 0.5 - Math.random());

  const targetCount = Number(limit) || 25;
  let result = [];

  // Loop and pad questions if the pool is smaller than the requested limit
  while (result.length < targetCount) {
    // Clone each object to prevent React state component reference sharing
    const clonedPool = shuffled.map((q) => ({ ...q }));
    result = result.concat(clonedPool);
  }

  // Slice exactly the requested count (25, 50, 75, 100)
  result = result.slice(0, targetCount);

  // Shuffle the final selection again to randomize duplicates
  return result.sort(() => 0.5 - Math.random());
};

module.exports = {
  loadAllQuestions,
  getTestQuestions,
};