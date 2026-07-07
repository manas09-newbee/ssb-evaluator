import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getQuestions, submitAnswers } from "../services/oirService";
import "../styles/oir.css";

function OIRTest() {
  const location = useLocation();
  const navigate = useNavigate();

  const difficulty = location.state?.difficulty || "all";
  const questionCount = Number(location.state?.count) || 25;

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Stores answers mapped to indexed keys
  const [markedReview, setMarkedReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const timeTakenRef = useRef(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getQuestions(difficulty, questionCount);
        setQuestions(data);
        // Standard OIR metric constraints: 30 seconds average per question
        const totalDuration = data.length * 30;
        setTimeLeft(totalDuration);
        timeTakenRef.current = 0;
      } catch (err) {
        console.error("Failed to load questions:", err);
        alert("Failed to compile OIR questionnaire.");
        navigate("/oir");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [difficulty, questionCount, navigate]);

  useEffect(() => {
    if (loading || timeLeft <= 0) {
      if (timeLeft === 0 && !loading) {
        handleAutoSubmit();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      timeTakenRef.current += 1;
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading]);

  const handleSelectOption = (option) => {
    setUserAnswers({ ...userAnswers, [currentIdx]: option });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setUserAnswers({ ...userAnswers, [currentIdx]: "" });
    handleNext();
  };

  const toggleMarkReview = () => {
    setMarkedReview({ ...markedReview, [currentIdx]: !markedReview[currentIdx] });
  };

  const handleAutoSubmit = () => {
    alert("Time limit reached. Your test answers are being submitted automatically.");
    executeSubmission();
  };

// ... Locate executeSubmission inside client/src/modules/oir/pages/OIRTest.jsx (around line 107-133) and update it:

  const executeSubmission = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const answersPayload = questions.map((q, idx) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: userAnswers[idx] || "",
        explanation: q.explanation,
        category: q.category,
        marks: q.marks || 1
      }));

      const results = await submitAnswers({
        answers: answersPayload,
        difficulty,
        totalQuestions: questions.length,
        timeTaken: timeTakenRef.current
      });

      // Use { replace: true } to override the test page history.
      // This forces the browser back-button to point straight back to /oir.
      navigate(`/oir/report/${results.attemptId}`, { replace: true });
    } catch (err) {
      console.error("Failed to submit test results:", err);
      alert("Submission crashed. Try submitting again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-container oir-layout tech-text" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Syncing OIR Question Dataset...</h2>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  return (
    <div className="layout-container oir-layout">
      {/* Upper Status Header Card */}
      <div className="card card-dossier" style={{ width: "100%", marginBottom: "var(--space-md)" }}>
        <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="tech-text" style={{ fontWeight: "700" }}>
            QUESTION {currentIdx + 1} OF {questions.length}
          </span>
          <span className="badge badge-danger" style={{ fontSize: "var(--font-size-md)", padding: "4px 12px" }}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        </div>
        <div style={{ width: "100%", height: "4px", backgroundColor: "var(--color-border)" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "var(--color-primary)", transition: "width var(--transition-fast)" }}></div>
        </div>
      </div>

      <div className="oir-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-md)" }}>
        {/* Core Question Layout */}
        <div className="card card-dossier">
          <div className="card-body" style={{ minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span className="badge badge-muted" style={{ marginBottom: "var(--space-xs)" }}>
                {questions[currentIdx]?.category} • {questions[currentIdx]?.difficulty}
              </span>
              <p style={{ fontSize: "var(--font-size-lg)", fontWeight: "bold", margin: "var(--space-sm) 0" }}>
                {questions[currentIdx]?.question}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                {questions[currentIdx]?.options.map((opt, i) => {
                  const isSelected = userAnswers[currentIdx] === opt;
                  return (
                    <button
                      key={i}
                      className="form-control"
                      onClick={() => handleSelectOption(opt)}
                      style={{
                        textAlign: "left",
                        backgroundColor: isSelected ? "var(--color-primary-light)" : "var(--color-bg-surface)",
                        borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                        fontWeight: isSelected ? "700" : "400",
                        cursor: "pointer"
                      }}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-sm)" }}>
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                <button className="btn btn-outline" onClick={handlePrev} disabled={currentIdx === 0}>
                  Previous
                </button>
                <button className="btn btn-outline" onClick={handleNext} disabled={currentIdx === questions.length - 1}>
                  Next
                </button>
              </div>

              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                <button className="btn btn-accent" onClick={toggleMarkReview}>
                  {markedReview[currentIdx] ? "Review Marked" : "Mark Review"}
                </button>
                <button className="btn btn-secondary" onClick={handleSkip}>
                  Skip
                </button>
                <button className="btn btn-primary" onClick={executeSubmission} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Test"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel and Navigator Palette */}
        <div className="card card-dossier">
          <div className="card-body">
            <h3 className="card-title" style={{ fontSize: "var(--font-size-md)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-xs)" }}>
              Question Map
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", margin: "var(--space-md) 0" }}>
              {questions.map((_, idx) => {
                const isSelected = currentIdx === idx;
                const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== "";
                const isMarked = markedReview[idx];

                let bgClass = "palette-unanswered";
                if (isMarked) bgClass = "palette-marked";
                else if (isAnswered) bgClass = "palette-answered";

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      padding: "8px 0",
                      borderRadius: "var(--radius-sm)",
                      border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                    className={`tech-text ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-md)", fontSize: "var(--font-size-xs)" }} className="tech-text">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#2d6a4f", borderRadius: "2px" }}></div>
                <span>Answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#ccd3cb", borderRadius: "2px" }}></div>
                <span>Unanswered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#b38f49", borderRadius: "2px" }}></div>
                <span>Marked for Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OIRTest;