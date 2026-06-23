import {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  submitAnswer,
  getHistory,
  endInterview,
} from "../services/interviewService";

// Module-specific style imports
import "../styles/interview.css";
import "../styles/voice.css";
import "../styles/analytics.css";
import "../styles/history.css";
import "../styles/report.css";

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve states passed from the PIQ Page
  const initialSessionId = location.state?.sessionId || "";
  const initialQuestion = location.state?.question || "";
  const piq = location.state?.piq;

  console.log("Received Session ID:", initialSessionId);
  console.log("Received Initial Question:", initialQuestion);
  console.log("Received PIQ:", piq);

  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null); 
  const [metrics, setMetrics] = useState(null);
  const [contradictions, setContradictions] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const recognitionRef = useRef(null);
  
  // Track speech timeouts to clear queued voices during component mount/unmount lifecycles
  const speakTimeoutRef = useRef(null);

  // Core refs to manage the infinite continuous speech recognition workaround
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const answerRef = useRef("");

  // Sync state answer to ref on every update to prevent stale closures inside asynchronous events
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Mount logic: speak the initial question exactly once
  useEffect(() => {
    if (initialQuestion) {
      speakQuestion(initialQuestion);
    } else {
      alert("No active interview session found. Please fill PIQ first.");
      navigate("/piq");
    }

    // Cleanup: cancel any scheduled timeouts or unfinished browser speech immediately
    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
      stopListening(); // Ensure microphone is released if component unmounts
    };
  }, [initialQuestion]);

  const startListening = () => {
    if (isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    // Capture current textarea text (preserves manual edits or previous answers across restarts)
    finalTranscriptRef.current = answerRef.current;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true; // Flag indicating we explicitly want continuous listening
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalSessionTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSessionTranscript += transcript + " ";
        } else {
          interimTranscript += transcript + " ";
        }
      }

      // Append current session's text to the saved text of prior sessions
      const currentFullText = finalTranscriptRef.current + finalSessionTranscript;
      
      // Update text-box with finalized text and live interim text
      setAnswer(currentFullText + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // If user did NOT explicitly click "Stop Speaking", trigger auto-restart on silent timeout
      if (isListeningRef.current) {
        console.log("Speech engine timed out due to silence. Auto-restarting...");
        
        // Save text built so far to the base accumulator
        finalTranscriptRef.current = answerRef.current;
        
        try {
          recognition.start();
        } catch (err) {
          console.error("Failed to auto-restart speech recognition:", err);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    isListeningRef.current = false; // Turn off the auto-restart trigger
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Helper function to pick a high-quality, less robotic English voice
  function getBestVoice() {
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith("en"));
    
    const naturalVoice = englishVoices.find(v => 
      v.name.toLowerCase().includes("natural") || 
      v.name.toLowerCase().includes("online")
    );
    if (naturalVoice) return naturalVoice;

    const googleVoice = englishVoices.find(v => v.name.toLowerCase().includes("google"));
    if (googleVoice) return googleVoice;

    const enUSVoice = englishVoices.find(v => v.lang === "en-US");
    if (enUSVoice) return enUSVoice;

    return englishVoices[0] || null;
  }

  function speakQuestion(text) {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
    }

    window.speechSynthesis.cancel();

    speakTimeoutRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);

      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log(`[TTS Voice] Speaking with: ${bestVoice.name}`);
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }, 300);
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert("Please answer first");
      return;
    }

    // Stop listening before submitting answer to release microphone
    stopListening();

    try {
      setLoading(true);

      const data = await submitAnswer(
        sessionId,
        answer
      );

      if (data.interviewCompleted) {
        alert("Interview Completed");
        setQuestion("Interview Completed");
        speakQuestion("Thank you. The interview is completed.");
        if (data.responseMetrics) {
          setMetrics(data.responseMetrics);
        }
        return;
      }

      setQuestion(data.nextQuestion);

      const historyData = await getHistory(sessionId);
      setHistory(historyData);

      console.log("Speaking next question:", data.nextQuestion);
      speakQuestion(data.nextQuestion);

      setAnswer("");
    } catch (error) {
      console.error("Submit Answer Failure:", error);
      alert(
        `Failed to submit answer: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to end the interview?"
    );

    if (!confirmed) return;

    // Release microphone on ending
    stopListening();

    try {
      setLoading(true);
      setIsEnding(true);

      const data = await endInterview(sessionId);
      setReport(data.report);
      if (data.responseMetrics) {
        setMetrics(data.responseMetrics);
      }
      if (data.contradictionNotes) {
        setContradictions(data.contradictionNotes);
      }
      console.log("Generating report...");
      alert("Interview Completed");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <div className="card card-dossier" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title" style={{ margin: 0 }}>AI Interview Officer</h1>
            <span className="badge badge-info">Active Session</span>
          </div>

          <div className="card-body">
            {/* Active question container block */}
            <div className="card card-interactive" style={{ backgroundColor: "var(--color-bg-base)", borderColor: "var(--color-primary-light)" }}>
              <div className="card-body">
                <span className="tech-text" style={{ fontWeight: "bold", textTransform: "uppercase", color: "var(--color-primary)" }}>Active Question</span>
                <p style={{ fontSize: "var(--font-size-lg)", fontWeight: "bold", marginTop: "var(--space-xs)", lineHeight: "1.4" }}>{question}</p>
              </div>
            </div>

            {/* Speaking and recording control badges */}
            <div style={{ margin: "var(--space-lg) 0", display: "flex", gap: "var(--space-md)", alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={startListening} disabled={isEnding}>
                🎤 Start Speaking
              </button>
              <button className="btn btn-danger" onClick={stopListening} disabled={isEnding}>
                🛑 Stop Speaking
              </button>
              <span className={`badge ${isListening ? "badge-success" : "badge-muted"}`}>
                {isListening ? "● Recording Active" : "○ Microphone Inactive"}
              </span>
            </div>

            {/* Candidate text transcription window */}
            <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
              <label className="form-label">Transcription Output / Current Answer Input</label>
              <textarea
                className="form-control form-control-tech"
                rows="8"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Spoken answers are transcribed here in real-time. Manual text input functions as an acceptable fallback..."
              />
            </div>

            <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", marginTop: "var(--space-lg)" }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={loading || isSpeaking || isEnding}
              >
                {isSpeaking ? "IO Speaking..." : loading ? "Processing..." : "Submit Answer"}
              </button>
              <button
                className="btn btn-outline btn-lg"
                onClick={handleEndInterview}
                disabled={isEnding}
              >
                {isEnding ? "Compiling Report..." : "End Interview"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Structured metrics analysis component */}
      {metrics && (
        <div className="card card-dossier" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-dossier-inner">
            <div className="card-header card-header-accent">
              <h2 className="card-title">Candidate Response Analytics</h2>
            </div>
            <div className="card-body">
              <div className="form-grid form-grid-3">
                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                  <div className="card-body">
                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Total Questions</span>
                    <h3 style={{ margin: "var(--space-xs) 0 0 0" }}>{metrics.totalQuestionsAnswered}</h3>
                  </div>
                </div>
                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                  <div className="card-body">
                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Avg Answer Length</span>
                    <h3 style={{ margin: "var(--space-xs) 0 0 0" }}>
                      {metrics.averageAnswerLength} <span className="tech-text" style={{ fontSize: "var(--font-size-xs)" }}>chars</span>
                    </h3>
                  </div>
                </div>
                <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                  <div className="card-body">
                    <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>Duration</span>
                    <h3 style={{ margin: "var(--space-xs) 0 0 0" }}>
                      {Math.floor(metrics.totalInterviewDuration / 60)}m {metrics.totalInterviewDuration % 60}s
                    </h3>
                  </div>
                </div>
              </div>

              {contradictions && contradictions.length > 0 && (
                <div className="card" style={{ marginTop: "var(--space-lg)", borderColor: "var(--color-danger-border)" }}>
                  <div className="card-header" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                    <h4 className="card-title" style={{ color: "var(--color-danger)", fontSize: "var(--font-size-md)" }}>Discrepancies & Contradictions Flagged</h4>
                  </div>
                  <div className="card-body" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                    <ul style={{ paddingLeft: "var(--space-md)" }}>
                      {contradictions.map((item, idx) => (
                        <li key={idx} className="tech-text" style={{ color: "var(--color-danger)", marginBottom: "var(--space-xs)", listStyleType: "square" }}>
                          <strong>Verification check #{item.atQuestion}:</strong> {item.findings}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Evaluation Report Panel */}
      {report && (
        <div className="card card-dossier" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-dossier-inner">
            <div className="card-header">
              <h2 className="card-title">Interview Evaluation Report</h2>
              <span className="badge badge-success">Evaluation Concluded</span>
            </div>
            <div className="card-body">
              {typeof report === "object" ? (
                <div>
                  <h4 className="tech-text" style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "var(--space-md)" }}>Officer Like Qualities (OLQ) Ratings</h4>
                  <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-lg)" }}>
                    <div className="card">
                      <div className="card-body" style={{ padding: "var(--space-md)" }}>
                        <ul className="tech-text" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Effective Intelligence:</span>
                            <span className="badge badge-outline badge-info">{report.effectiveIntelligence}/10</span>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Self Confidence:</span>
                            <span className="badge badge-outline badge-info">{report.selfConfidence}/10</span>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Leadership:</span>
                            <span className="badge badge-outline badge-info">{report.leadership}/10</span>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Initiative:</span>
                            <span className="badge badge-outline badge-info">{report.initiative}/10</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-body" style={{ padding: "var(--space-md)" }}>
                        <ul className="tech-text" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Responsibility:</span>
                            <span className="badge badge-outline badge-info">{report.responsibility}/10</span>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Social Adaptability:</span>
                            <span className="badge badge-outline badge-info">{report.socialAdaptability}/10</span>
                          </li>
                          <li style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Communication:</span>
                            <span className="badge badge-outline badge-info">{report.communication}/10</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-lg)" }}>
                    <div className="card">
                      <div className="card-header card-header-accent"><h4 className="card-title" style={{ fontSize: "var(--font-size-md)" }}>Thematic Strengths</h4></div>
                      <div className="card-body">
                        <ul style={{ paddingLeft: "var(--space-md)", listStyleType: "circle" }}>
                          {report.strengths && report.strengths.map((str, idx) => (
                            <li key={idx} style={{ marginBottom: "var(--space-xxs)", fontSize: "var(--font-size-sm)" }}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header" style={{ borderLeft: "4px solid var(--color-danger)" }}><h4 className="card-title" style={{ fontSize: "var(--font-size-md)", color: "var(--color-danger)" }}>Thematic Weaknesses</h4></div>
                      <div className="card-body">
                        <ul style={{ paddingLeft: "var(--space-md)", listStyleType: "circle" }}>
                          {report.weaknesses && report.weaknesses.map((wk, idx) => (
                            <li key={idx} style={{ marginBottom: "var(--space-xxs)", fontSize: "var(--font-size-sm)" }}>{wk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {report.contradictions && report.contradictions.length > 0 && (
                    <div className="card" style={{ marginBottom: "var(--space-lg)", borderColor: "var(--color-danger-border)" }}>
                      <div className="card-header" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                        <h4 className="card-title" style={{ color: "var(--color-danger)", fontSize: "var(--font-size-md)" }}>Contradictions Log</h4>
                      </div>
                      <div className="card-body" style={{ backgroundColor: "var(--color-danger-bg)" }}>
                        <ul style={{ paddingLeft: "var(--space-md)" }}>
                          {report.contradictions.map((con, idx) => (
                            <li key={idx} className="tech-text" style={{ color: "var(--color-danger)", marginBottom: "var(--space-xs)" }}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <h3 className="card-title" style={{ fontSize: "var(--font-size-md)", marginBottom: "var(--space-xs)" }}>Assessor Recommendation Summary</h3>
                  <p style={{ lineHeight: "1.6", backgroundColor: "var(--color-bg-base)", padding: "var(--space-md)", borderLeft: "4px solid var(--color-primary)", borderRadius: "var(--radius-sm)" }}>
                    {report.recommendationSummary}
                  </p>
                </div>
              ) : (
                <pre className="form-control-tech" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "var(--space-md)", backgroundColor: "var(--color-bg-base)" }}>
                  {report}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Conversation Log details */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: "var(--font-size-md)" }}>Interview Conversation Log</h3>
          </div>
          <div className="card-body">
            {history.map((item, index) => (
              <div key={index} style={{ marginBottom: "var(--space-md)", paddingBottom: "var(--space-md)", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ marginBottom: "var(--space-xxs)" }}>
                  <span className="badge badge-muted" style={{ marginRight: "var(--space-xs)" }}>IO</span>
                  <strong>{item.question}</strong>
                </div>
                <div>
                  <span className="badge badge-outline badge-info" style={{ marginRight: "var(--space-xs)" }}>You</span>
                  <span>{item.answer}</span>
                </div>
                {item.stage && (
                  <div className="tech-text" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-xxs)" }}>
                    Stage: {item.stage} | Character Count: {item.answerLength}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPage;