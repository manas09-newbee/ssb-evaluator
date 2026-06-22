import { useState, useEffect, useRef } from "react";
import { evaluateHandwrittenStory, getPpdtImages } from "../services/ppdtservice";

function PPDTPage() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [step, setStep] = useState("init"); // 'init' | 'viewing' | 'writing' | 'upload'
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null); // Changed to accept structures or strings
  const timerRef = useRef(null);

  // Load the list of PPDT cards dynamically from the server folder on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await getPpdtImages();
        setCards(data);
        if (data.length > 0) {
          setSelectedCard(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch PPDT images from backend directory:", error);
      }
    };
    fetchCards();
  }, []);

  // Clean up any active timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer lifecycle controller
  useEffect(() => {
    if (timeLeft <= 0) {
      if (step === "viewing") {
        startWritingPhase();
      } else if (step === "writing") {
        setStep("upload");
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, step]);

  const startViewingPhase = () => {
    setEvaluation(null);
    setStep("viewing");
    setTimeLeft(30); // 30 seconds observation window
  };

  const startWritingPhase = () => {
    setStep("writing");
    setTimeLeft(240); // 4 minutes (240 seconds) to write physically on paper
  };

  // Convert handwriting upload photo to Base64
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setLoading(true);
        console.log("Processing image upload. Sending to Gemini 3 Flash...");
        
        const data = await evaluateHandwrittenStory(reader.result);
        setEvaluation(data); // Stored directly as parsed object
        
      } catch (error) {
        console.error("Evaluation error:", error);
        alert("Failed to evaluate story. Check if server and Gemini connections are healthy.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h1>SSB PPDT Evaluator</h1>

      {/* STEP 1: INITIAL STATE & CARD SELECTOR */}
      {step === "init" && (
        <div>
          <p>This module simulates the exact conditions of the SSB screening test.</p>
          
          <div style={{ background: "#f9f9f9", padding: "15px", border: "1px solid #ddd", marginBottom: "20px" }}>
            <h3>1. Select Your Practice Card:</h3>
            {cards.length > 0 && selectedCard ? (
              <div>
                <select
                  value={selectedCard.id}
                  onChange={(e) => {
                    const found = cards.find(c => c.id === e.target.value);
                    if (found) setSelectedCard(found);
                  }}
                  style={{ padding: "8px", width: "100%", maxWidth: "400px", fontSize: "14px" }}
                >
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.title}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: "13px", color: "#666" }}>
                  <em>Active Description: {selectedCard.description}</em>
                </p>
              </div>
            ) : (
              <p>Loading available PPDT cards...</p>
            )}
          </div>

          <h3>2. Instructions:</h3>
          <ul>
            <li>Keep a physical sheet of paper and a pen ready.</li>
            <li>Once started, you will observe your selected hazy picture for 30 seconds.</li>
            <li>Write your story on paper under a strict 4-minute timer.</li>
            <li>Take a photo of your paper and upload it for handwriting and OLQ evaluation.</li>
          </ul>
          
          <button 
            onClick={startViewingPhase} 
            disabled={!selectedCard}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Start PPDT Test
          </button>
        </div>
      )}

      {/* STEP 2: OBSERVING DYNAMIC HAZY PICTURE */}
      {step === "viewing" && selectedCard && (
        <div>
          <h2>Observe the Picture Closely</h2>
          <h3 style={{ color: "#333" }}>Time Remaining: {timeLeft} seconds</h3>
          
          {/* Grayscale, low-contrast, blurred sketch CSS filters simulating SSB boards */}
          <img
            src={selectedCard.url}
            alt="Standard SSB PPDT Hazy Trigger Card"
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              filter: "grayscale(100%) contrast(70%) brightness(85%) blur(2.5px)",
              border: "1px solid #999",
              display: "block",
              marginTop: "20px"
            }}
          />
        </div>
      )}

      {/* STEP 3: PHYSICAL WRITING TIMER */}
      {step === "writing" && (
        <div>
          <h2>Write Your Story on Paper</h2>
          <h3 style={{ color: "red" }}>
            Time Remaining: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
          </h3>
          <p>
            Mark the characters, mood, and age in the box first, then construct your story narrative.
          </p>
          
          <div style={{ border: "1px dashed #aaa", padding: "20px", display: "inline-block", background: "#fcfcfc" }}>
            <h4>Story guidelines:</h4>
            <p>1. What led to the situation?</p>
            <p>2. What is currently happening?</p>
            <p>3. What is the logical outcome?</p>
          </div>
          
          <br /><br />
          <button onClick={() => setStep("upload")} style={{ padding: "10px 20px", fontSize: "15px" }}>
            Done Writing (Go to Upload)
          </button>
        </div>
      )}

      {/* STEP 4: UPLOADING HANDWRITING */}
      {step === "upload" && (
        <div>
          <h2>Submit Your Handwritten Story</h2>
          
          {loading ? (
            <div>
              <h3>Analyzing your handwriting & narrative...</h3>
              <p>Gemini 3 Flash is performing OCR transcription, checking legibility, and conducting an OLQ analysis.</p>
              <p>Please wait. Do not refresh.</p>
            </div>
          ) : (
            <div>
              {!evaluation ? (
                <div>
                  <p>Take a clear photo of your handwritten paper and upload it below:</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <br /><br />
                  <button onClick={() => setStep("init")}>Reset Test</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setStep("init")} style={{ marginBottom: "20px" }}>
                    Take Another Test
                  </button>
                  
                  {/* PHASE 5: Clean, structured layout displaying assessment sections separately */}
                  <h2>PPDT Evaluation Report</h2>
                  {/* Check if the received object actually has the required structured keys */}
                  {evaluation && typeof evaluation === "object" && ("transcription" in evaluation || "handwritingScore" in evaluation) ? (
                    <div style={{ background: "#fdfdfd", padding: "20px", border: "1px solid #ddd" }}>
                      <h3>1. Handwritten Transcription (OCR)</h3>
                      <p style={{ fontStyle: "italic", background: "#f0f0f0", padding: "15px", borderRadius: "4px" }}>
                        "{evaluation.transcription}"
                      </p>

                      <h3>2. Handwriting & Grammar Scores</h3>
                      <ul>
                        <li><strong>Handwriting Legibility Score:</strong> {evaluation.handwritingScore}/10</li>
                        <li><strong>Grammar & Structure Score:</strong> {evaluation.grammarScore}/10</li>
                        <li><strong>Story Narrative Score:</strong> {evaluation.storyScore}/10</li>
                      </ul>

                      <h3>3. OLQ Evaluations</h3>
                      <ul>
                        <li><strong>Initiative:</strong> {evaluation.olqScores?.initiative}/10</li>
                        <li><strong>Leadership:</strong> {evaluation.olqScores?.leadership}/10</li>
                        <li><strong>Cooperation:</strong> {evaluation.olqScores?.cooperation}/10</li>
                        <li><strong>Responsibility:</strong> {evaluation.olqScores?.responsibility}/10</li>
                        <li><strong>Courage:</strong> {evaluation.olqScores?.courage}/10</li>
                      </ul>

                      <h3>4. Narrative Strengths & Weaknesses</h3>
                      <p><strong>Strengths:</strong></p>
                      <ul>
                        {evaluation.strengths && evaluation.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                      <p><strong>Weaknesses:</strong></p>
                      <ul>
                        {evaluation.weaknesses && evaluation.weaknesses.map((wk, idx) => (
                          <li key={idx}>{wk}</li>
                        ))}
                      </ul>

                      <h3>5. Story Performance Indicators</h3>
                      <p style={{ color: "green" }}><strong>Positive Indicators:</strong></p>
                      <ul>
                        {evaluation.positiveIndicators && evaluation.positiveIndicators.map((pos, idx) => (
                          <li key={idx}>{pos}</li>
                        ))}
                      </ul>
                      <p style={{ color: "red" }}><strong>Negative Indicators:</strong></p>
                      <ul>
                        {evaluation.negativeIndicators && evaluation.negativeIndicators.map((neg, idx) => (
                          <li key={idx}>{neg}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    /* Fallback: Print the raw string or stringified object if keys are missing */
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: "15px", border: "1px solid #ddd" }}>
                      {typeof evaluation === "object" ? JSON.stringify(evaluation, null, 2) : evaluation}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PPDTPage;