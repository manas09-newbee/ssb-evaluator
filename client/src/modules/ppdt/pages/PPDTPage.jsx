import { useState } from "react";
import { evaluateStory } from "../services/ppdtService";

function PPDTPage() {
  const [story, setStory] = useState("");

  const handleEvaluate = async () => {
    try {
      const result = await evaluateStory(story);

      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>SSB PPDT Evaluator</h1>

      <textarea
        rows="10"
        cols="60"
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleEvaluate}>
        Evaluate Story
      </button>
    </div>
  );
}

export default PPDTPage;