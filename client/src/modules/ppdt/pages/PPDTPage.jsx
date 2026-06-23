import { useState, useEffect, useRef } from "react";
import { evaluateHandwrittenStory, getPpdtImages } from "../services/ppdtservice";

// Module-specific style imports
import "../styles/ppdt.css";
import "../styles/timers.css";
import "../styles/upload.css";
import "../styles/evaluation.css";

function PPDTPage() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [step, setStep] = useState("init"); // 'init' | 'viewing' | 'writing' | 'upload'
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null); 
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
    <div className="layout-container">
      <div className="card card-dossier" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title">PPDT Screening Evaluator</h1>
            <span className="badge badge-info">Stage 1 Testing</span>
          </div>

          <div className="card-body">
            
            {/* STEP 1: INITIAL STATE & CARD SELECTOR */}
            {step === "init" && (
              <div>
                <p className="form-feedback" style={{ fontSize: "var(--font-size-md)", marginBottom: "var(--space-lg)" }}>
                  This module simulates the physical screening environment of the Picture Perception & Description Test (PPDT).
                </p>
                
                <div className="card card-interactive" style={{ backgroundColor: "var(--color-bg-base)", marginBottom: "var(--space-lg)" }}>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">1. Select Dynamic Scenario Card</label>
                      {cards.length > 0 && selectedCard ? (
                        <div>
                          <select
                            className="form-control"
                            value={selectedCard.id}
                            onChange={(e) => {
                              const found = cards.find(c => c.id === e.target.value);
                              if (found) setSelectedCard(found);
                            }}
                          >
                            {cards.map((card) => (
                              <option key={card.id} value={card.id}>
                                {card.title}
                              </option>
                            ))}
                          </select>
                          <div className="tech-text" style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-xs)" }}>
                            Active Image Pointer: {selectedCard.description}
                          </div>
                        </div>
                      ) : (
                        <div className="tech-text">Querying local PPDT folders...</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
                  <div className="card-header card-header-accent">
                    <h3 className="card-title" style={{ fontSize: "var(--font-size-md)" }}>2. Standard Operating Procedures</h3>
                  </div>
                  <div className="card-body">
                    <ul style={{ paddingLeft: "var(--space-md)", listStyleType: "decimal" }}>
                      <li style={{ marginBottom: "var(--space-xs)" }}>Prepare a physical sheet of paper and pen.</li>
                      <li style={{ marginBottom: "var(--space-xs)" }}>The designated hazy scenario picture will display on-screen for exactly 30 seconds.</li>
                      <li style={{ marginBottom: "var(--space-xs)" }}>Following observation, write your story within a strict 4-minute timeline.</li>
                      <li style={{ marginBottom: "var(--space-xs)" }}>Upload a clean photograph of the handwritten sheet to execute OCR and OLQ evaluation.</li>
                    </ul>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={startViewingPhase} 
                  disabled={!selectedCard}
                  style={{ width: "100%" }}
                >
                  Start PPDT Assessment Run
                </button>
              </div>
            )}

            {/* STEP 2: OBSERVING DYNAMIC HAZY PICTURE */}
            {step === "viewing" && selectedCard && (
              <div style={{ textAlign: "center" }}>
                <h2>Observe the Hazy Scenario Card</h2>
                <div style={{ margin: "var(--space-md) 0" }}>
                  <span className="badge badge-danger" style={{ fontSize: "var(--font-size-md)", padding: "var(--space-xs) var(--space-md)" }}>
                    Time Remaining: {timeLeft} seconds
                  </span>
                </div>
                
                {/* Visual filter classes recreating real hazy slides */}
                <img
                  src={selectedCard.url}
                  alt="Trigger Scenario"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    height: "auto",
                    filter: "grayscale(100%) contrast(70%) brightness(85%) blur(2.5px)",
                    border: "3px double var(--color-border-dark)",
                    borderRadius: "var(--radius-sm)",
                    display: "inline-block",
                    marginTop: "var(--space-md)"
                  }}
                />
              </div>
            )}

            {/* STEP 3: PHYSICAL WRITING TIMER */}
            {step === "writing" && (
              <div style={{ textAlign: "center" }}>
                <h2>Record Your Narrative on Paper</h2>
                <div style={{ margin: "var(--space-md) 0" }}>
                  <span className="badge badge-danger" style={{ fontSize: "var(--font-size-md)", padding: "var(--space-xs) var(--space-md)" }}>
                    Time Remaining: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                  </span>
                </div>
                <p className="form-feedback" style={{ fontSize: "var(--font-size-md)" }}>
                  Draw characters, mood, and age within the designated square first, then formulate the structured narrative.
                </p>
                
                <div className="card" style={{ maxWidth: "500px", margin: "var(--space-lg) auto", textAlign: "left" }}>
                  <div className="card-header card-header-accent">
                    <h4 className="card-title" style={{ fontSize: "var(--font-size-sm)" }}>Story Framework Rules</h4>
                  </div>
                  <div className="card-body">
                    <p style={{ marginBottom: "var(--space-xs)" }}><strong>1. Past:</strong> What actions led to the scene?</p>
                    <p style={{ marginBottom: "var(--space-xs)" }}><strong>2. Present:</strong> What is currently taking place?</p>
                    <p style={{ marginBottom: "var(--space-xs)" }}><strong>3. Future:</strong> What is the logical resolution of the plot?</p>
                  </div>
                </div>
                
                <button className="btn btn-primary" onClick={() => setStep("upload")}>
                  Conclude Writing (Proceed to Submission)
                </button>
              </div>
            )}

            {/* STEP 4: UPLOADING HANDWRITING */}
            {step === "upload" && (
              <div>
                <h2>Submit Your Handwritten Sheet</h2>
                
                {loading ? (
                  <div style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
                    <h3>Transcribing Penmanship & Analyzing Narrative...</h3>
                    <p className="form-feedback" style={{ maxWidth: "600px", margin: "var(--space-md) auto" }}>
                      Gemini Multimodal AI is running background OCR transcription, verifying grammar structure, and mapping positive/negative indicators.
                    </p>
                    <div className="tech-text" style={{ color: "var(--color-text-muted)" }}>Please wait. Do not refresh this page.</div>
                  </div>
                ) : (
                  <div>
                    {!evaluation ? (
                      <div className="card" style={{ backgroundColor: "var(--color-bg-base)" }}>
                        <div className="card-body" style={{ textAlign: "center" }}>
                          <p style={{ marginBottom: "var(--space-md)", fontSize: "var(--font-size-md)" }}>Capture a clear, flat photograph of the handwritten paper sheet and upload it below:</p>
                          <input
                            className="form-control"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            style={{ maxWidth: "400px", display: "inline-block" }}
                          />
                          <div style={{ marginTop: "var(--space-lg)" }}>
                            <button className="btn btn-outline" onClick={() => setStep("init")}>Reset Test</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: "var(--space-md)" }}>
                          <button className="btn btn-outline" onClick={() => setStep("init")}>
                            Reset & Select New Card
                          </button>
                        </div>
                        
                        {/* PPDT evaluation details */}
                        <div className="card" style={{ borderColor: "var(--color-primary)" }}>
                          <div className="card-header">
                            <h2 className="card-title">PPDT Evaluation Report</h2>
                            <span className="badge badge-success">Analysis Finished</span>
                          </div>
                          
                          {evaluation && typeof evaluation === "object" && ("transcription" in evaluation || "handwritingScore" in evaluation) ? (
                            <div className="card-body">
                              
                              <h3 className="card-title" style={{ fontSize: "var(--font-size-md)", marginBottom: "var(--space-xs)" }}>1. Handwritten Transcription (OCR)</h3>
                              <p className="form-control-tech" style={{ backgroundColor: "var(--color-bg-base)", padding: "var(--space-md)", borderLeft: "4px solid var(--color-primary)", borderRadius: "var(--radius-sm)", fontStyle: "italic", lineHeight: "1.6" }}>
                                "{evaluation.transcription}"
                              </p>

                              <h3 className="card-title" style={{ fontSize: "var(--font-size-md)", marginTop: "var(--space-lg)", marginBottom: "var(--space-xs)" }}>2. Narrative & Penmanship Scoring</h3>
                              <div className="form-grid form-grid-3" style={{ marginBottom: "var(--space-lg)" }}>
                                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)", margin: 0 }}>
                                  <div className="card-body">
                                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Penmanship Legibility</span>
                                    <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{evaluation.handwritingScore}/10</h3>
                                  </div>
                                </div>
                                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)", margin: 0 }}>
                                  <div className="card-body">
                                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Grammar & Syntax</span>
                                    <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{evaluation.grammarScore}/10</h3>
                                  </div>
                                </div>
                                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)", margin: 0 }}>
                                  <div className="card-body">
                                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Thematic Structure</span>
                                    <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{evaluation.storyScore}/10</h3>
                                  </div>
                                </div>
                              </div>

                              <h3 className="card-title" style={{ fontSize: "var(--font-size-md)", marginBottom: "var(--space-xs)" }}>3. GTO OLQ Assessment</h3>
                              <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-lg)" }}>
                                <div className="card">
                                  <div className="card-body" style={{ padding: "var(--space-md)" }}>
                                    <ul className="tech-text" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                                      <li style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Initiative:</span>
                                        <span className="badge badge-outline badge-info">{evaluation.olqScores?.initiative}/10</span>
                                      </li>
                                      <li style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Leadership:</span>
                                        <span className="badge badge-outline badge-info">{evaluation.olqScores?.leadership}/10</span>
                                      </li>
                                      <li style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Cooperation:</span>
                                        <span className="badge badge-outline badge-info">{evaluation.olqScores?.cooperation}/10</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="card">
                                  <div className="card-body" style={{ padding: "var(--space-md)" }}>
                                    <ul className="tech-text" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                                      <li style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Responsibility:</span>
                                        <span className="badge badge-outline badge-info">{evaluation.olqScores?.responsibility}/10</span>
                                      </li>
                                      <li style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Courage:</span>
                                        <span className="badge badge-outline badge-info">{evaluation.olqScores?.courage}/10</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-lg)" }}>
                                <div className="card">
                                  <div className="card-header card-header-accent"><h4 className="card-title" style={{ fontSize: "var(--font-size-md)" }}>Narrative Strengths</h4></div>
                                  <div className="card-body">
                                    <ul style={{ paddingLeft: "var(--space-md)", listStyleType: "circle" }}>
                                      {evaluation.strengths && evaluation.strengths.map((str, idx) => (
                                        <li key={idx} style={{ marginBottom: "var(--space-xxs)", fontSize: "var(--font-size-sm)" }}>{str}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div className="card">
                                  <div className="card-header" style={{ borderLeft: "4px solid var(--color-danger)" }}><h4 className="card-title" style={{ fontSize: "var(--font-size-md)", color: "var(--color-danger)" }}>Narrative Weaknesses</h4></div>
                                  <div className="card-body">
                                    <ul style={{ paddingLeft: "var(--space-md)", listStyleType: "circle" }}>
                                      {evaluation.weaknesses && evaluation.weaknesses.map((wk, idx) => (
                                        <li key={idx} style={{ marginBottom: "var(--space-xxs)", fontSize: "var(--font-size-sm)" }}>{wk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-md)" }}>
                                <div className="card" style={{ borderColor: "var(--color-success-border)" }}>
                                  <div className="card-header" style={{ backgroundColor: "var(--color-success-bg)" }}>
                                    <h4 className="card-title" style={{ fontSize: "var(--font-size-md)", color: "var(--color-success)" }}>Positive Narrative Indicators</h4>
                                  </div>
                                  <div className="card-body" style={{ backgroundColor: "var(--color-success-bg)" }}>
                                    <ul style={{ paddingLeft: "var(--space-md)" }}>
                                      {evaluation.positiveIndicators && evaluation.positiveIndicators.map((pos, idx) => (
                                        <li className="tech-text" key={idx} style={{ color: "var(--color-success)", marginBottom: "var(--space-xs)" }}>{pos}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div className="card" style={{ borderColor: "var(--color-danger-border)" }}>
                                  <div className="card-header" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                                    <h4 className="card-title" style={{ fontSize: "var(--font-size-md)", color: "var(--color-danger)" }}>Negative Narrative Indicators</h4>
                                  </div>
                                  <div className="card-body" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                                    <ul style={{ paddingLeft: "var(--space-md)" }}>
                                      {evaluation.negativeIndicators && evaluation.negativeIndicators.map((neg, idx) => (
                                        <li className="tech-text" key={idx} style={{ color: "var(--color-danger)", marginBottom: "var(--space-xs)" }}>{neg}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                            </div>
                          ) : (
                            /* Fallback parser verification */
                            <div className="card-body">
                              <pre className="form-control-tech" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--color-bg-base)", padding: "var(--space-md)" }}>
                                {typeof evaluation === "object" ? JSON.stringify(evaluation, null, 2) : evaluation}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PPDTPage;