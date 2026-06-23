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
    <div style={{ maxWidth: "850px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#2e4a36" }}>AI Interview Officer</h1>

      {/* 1. Current Question */}
      <div style={{ background: "#f4fcf6", border: "1px solid #c2cdc2", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#4a5d4e" }}>Active Question:</h3>
        <p style={{ fontSize: "16px", margin: 0, fontWeight: "bold" }}>{question}</p>
      </div>

      {/* 2. Speak Control panel */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={startListening}
          disabled={isEnding}
          style={{ padding: "8px 15px", background: "#4a5d4e", color: "white", border: "none", cursor: "pointer", borderRadius: "3px" }}
        >
          🎤 Start Speaking
        </button>

        <button
          onClick={stopListening}
          disabled={isEnding}
          style={{ padding: "8px 15px", background: "#8c3b3b", color: "white", border: "none", cursor: "pointer", borderRadius: "3px" }}
        >
          🛑 Stop Speaking
        </button>

        <span style={{ fontSize: "13px", fontWeight: "bold", color: isListening ? "green" : "grey" }}>
          {isListening ? "● Listening..." : "○ Microphone Inactive"}
        </span>
      </div>

      {/* 3. Input text box */}
      <textarea
        rows="8"
        style={{ width: "100%", padding: "10px", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", border: "1px solid #ccc", borderRadius: "4px" }}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer will appear here dynamically while speaking..."
      />

      <br />
      <br />

      {/* 4. Action submission controls */}
      <div style={{ display: "flex", gap: "15px" }}>
        <button
          onClick={handleSubmit}
          disabled={loading || isSpeaking || isEnding}
          style={{ padding: "10px 20px", background: "#2e4a36", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", fontSize: "15px" }}
        >
          {isSpeaking
            ? "IO Speaking..."
            : loading
            ? "Thinking..."
            : "Submit Answer"}
        </button>

        <button
          onClick={handleEndInterview}
          disabled={isEnding}
          style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", fontSize: "15px" }}
        >
          {isEnding ? "Generating Report..." : "End Interview"}
        </button>
      </div>

      {/* PHASE 6/Objective 2: Response Analytics Panel */}
      {metrics && (
        <div style={{ marginTop: "30px", border: "2px solid #2e4a36", padding: "20px", background: "#fcfdfc", borderRadius: "6px" }}>
          <h2 style={{ color: "#2e4a36", marginTop: 0, textTransform: "uppercase", fontSize: "18px", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>Candidate Performance Dashboard</h2>
          
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginTop: "15px" }}>
            <div style={{ flex: 1, minWidth: "150px", background: "#f4fcf6", padding: "15px", border: "1px solid #c2cdc2", borderRadius: "4px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#555", textTransform: "uppercase" }}>Questions Completed</span>
              <h2 style={{ margin: "5px 0 0 0", color: "#2e4a36" }}>{metrics.totalQuestionsAnswered}</h2>
            </div>
            <div style={{ flex: 1, minWidth: "150px", background: "#f4fcf6", padding: "15px", border: "1px solid #c2cdc2", borderRadius: "4px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#555", textTransform: "uppercase" }}>Avg Response Length</span>
              <h2 style={{ margin: "5px 0 0 0", color: "#2e4a36" }}>{metrics.averageAnswerLength} <span style={{ fontSize: "13px", fontWeight: "normal" }}>chars</span></h2>
            </div>
            <div style={{ flex: 1, minWidth: "150px", background: "#f4fcf6", padding: "15px", border: "1px solid #c2cdc2", borderRadius: "4px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#555", textTransform: "uppercase" }}>Active Interview Time</span>
              <h2 style={{ margin: "5px 0 0 0", color: "#2e4a36" }}>{Math.floor(metrics.totalInterviewDuration / 60)}m {metrics.totalInterviewDuration % 60}s</h2>
            </div>
          </div>

          {contradictions && contradictions.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "#c0392b", margin: "10px 0" }}>Contradictions & Discrepancies Flagged:</h3>
              <ul style={{ background: "#fff5f5", padding: "15px 15px 15px 35px", border: "1px solid #f5c6cb", borderRadius: "4px" }}>
                {contradictions.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: "10px", color: "#721c24", fontSize: "14px" }}>
                    <strong>Validation finding:</strong> {item.findings}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5. PHASE 4: Structured Report Display */}
      {report && (
        <div style={{ marginTop: "30px", border: "1px solid #ddd", padding: "20px", background: "#fcfcfc", borderRadius: "6px" }}>
          <h2 style={{ color: "#4a5d4e", marginTop: 0 }}>Interview Evaluation Report</h2>
          {typeof report === "object" ? (
            <div>
              <h3>Core OLQ Scores:</h3>
              <ul style={{ paddingLeft: "20px" }}>
                <li><strong>Communication:</strong> {report.communication}/10</li>
                <li><strong>Self Confidence:</strong> {report.selfConfidence}/10</li>
                <li><strong>Leadership:</strong> {report.leadership}/10</li>
                <li><strong>Initiative:</strong> {report.initiative}/10</li>
                <li><strong>Responsibility:</strong> {report.responsibility}/10</li>
                <li><strong>Social Adaptability:</strong> {report.socialAdaptability}/10</li>
                <li><strong>Effective Intelligence:</strong> {report.effectiveIntelligence}/10</li>
              </ul>

              <h3>Strengths:</h3>
              <ul style={{ paddingLeft: "20px" }}>
                {report.strengths && report.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>

              <h3>Weaknesses:</h3>
              <ul style={{ paddingLeft: "20px" }}>
                {report.weaknesses && report.weaknesses.map((wk, idx) => (
                  <li key={idx}>{wk}</li>
                ))}
              </ul>

              {report.contradictions && report.contradictions.length > 0 && (
                <div>
                  <h3>Contradictions Detected:</h3>
                  <ul style={{ paddingLeft: "20px", color: "#c0392b" }}>
                    {report.contradictions.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h3>Assessor Recommendation Summary:</h3>
              <p style={{ lineHeight: "1.5", background: "#f9f9f9", padding: "15px", borderLeft: "4px solid #4a5d4e" }}>{report.recommendationSummary}</p>
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "15px", background: "#eee" }}>
              {report}
            </pre>
          )}
        </div>
      )}

      {/* 6. Saved History */}
      {history.length > 0 && (
        <div style={{ marginTop: "30px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
          <h3 style={{ color: "#4a5d4e" }}>Interview Conversation Log</h3>
          {history.map((item, index) => (
            <div key={index} style={{ marginBottom: "15px", background: "#fafafa", padding: "10px", borderRadius: "4px" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>IO:</strong> {item.question}
              </p>
              <p style={{ margin: 0, color: "#2b4c3f" }}>
                <strong>You:</strong> {item.answer}
              </p>
              {item.stage && (
                <span style={{ fontSize: "11px", color: "#888", display: "block", marginTop: "5px" }}>
                  Section Stage: {item.stage} | Character Length: {item.answerLength}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InterviewPage;