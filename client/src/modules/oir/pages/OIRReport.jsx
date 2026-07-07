import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getReportDetails } from "../services/oirService";
import "../styles/oir.css";

function OIRReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReportDetails(id);
        setReport(data);
      } catch (err) {
        console.error("Failed to load OIR report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="layout-container oir-layout tech-text" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Analyzing Performance Profiles...</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="layout-container oir-layout" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Failed to load execution parameters.</h2>
        <Link to="/oir" className="btn btn-primary">Return to Home</Link>
      </div>
    );
  }

  // Calculate weak categories to recommend practice exercises
  const generateRecommendations = () => {
    const categories = Object.keys(report.categoryPerformance);
    let weakestCat = "";
    let lowestRatio = 1;

    categories.forEach((cat) => {
      const data = report.categoryPerformance[cat];
      const ratio = data.correct / data.total;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        weakestCat = cat;
      }
    });

    return weakestCat 
      ? `Based on your test session, your performance in the ${weakestCat} category shows room for improvement. Focus your studies on spatial mapping patterns and reasoning logic.` 
      : "Solid overall logic performance. Maintain consistency across reasoning tests.";
  };

  return (
    <div className="layout-container oir-layout">
      <div className="card card-dossier" style={{ marginBottom: "var(--space-md)" }}>
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title">Officer Intelligence Rating Report</h1>
            <span className="badge badge-success">Evaluation Concluded</span>
          </div>

          <div className="card-body">
            <div style={{ display: "flex", gap: "var(--space-md)", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-md)" }}>
              <button onClick={() => setActiveTab("overview")} className={`btn btn-text ${activeTab === "overview" ? "oir-active-tab" : ""}`}>Overview</button>
              <button onClick={() => setActiveTab("review")} className={`btn btn-text ${activeTab === "review" ? "oir-active-tab" : ""}`}>Review Answers</button>
            </div>

            {activeTab === "overview" ? (
              <div>
                <div className="form-grid form-grid-3" style={{ marginBottom: "var(--space-lg)" }}>
                  <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>FINAL SCORE</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{report.score} / {report.maxScore}</h3>
                    </div>
                  </div>
                  <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>ACCURACY</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{report.accuracy}%</h3>
                    </div>
                  </div>
                  <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>TIME ELAPSED</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{Math.floor(report.timeTaken / 60)}m {report.timeTaken % 60}s</h3>
                    </div>
                  </div>
                </div>

                <div className="form-grid form-grid-2" style={{ marginBottom: "var(--space-lg)" }}>
                  <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: "var(--font-size-md)", margin: 0 }}>Category Breakdown</h3></div>
                    <div className="card-body">
                      {Object.keys(report.categoryPerformance).map((cat, idx) => {
                        const data = report.categoryPerformance[cat];
                        const pct = Math.round((data.correct / data.total) * 100);
                        return (
                          <div key={idx} style={{ marginBottom: "var(--space-sm)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span className="tech-text" style={{ fontWeight: "bold" }}>{cat}</span>
                              <span className="tech-text">{data.correct}/{data.total} ({pct}%)</span>
                            </div>
                            <div style={{ backgroundColor: "var(--color-border)", height: "6px", borderRadius: "var(--radius-sm)", overflow: "hidden", marginTop: "4px" }}>
                              <div style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? "var(--color-success)" : pct >= 40 ? "var(--color-warning)" : "var(--color-danger)", height: "100%" }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: "var(--font-size-md)", margin: 0 }}>Review Panel Comments</h3></div>
                    <div className="card-body" style={{ minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <p className="tech-text" style={{ lineHeight: "1.6", color: "var(--color-text-secondary)" }}>
                        {generateRecommendations()}
                      </p>
                      <Link to="/oir" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
                        Return to OIR Module
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                {report.answers.map((ans, idx) => {
                  const labelType = ans.isCorrect ? "badge-success" : ans.selectedAnswer === "Skipped" ? "badge-muted" : "badge-danger";
                  return (
                    <div key={idx} className="card" style={{ padding: "var(--space-md)", borderLeft: `4px solid ${ans.isCorrect ? "var(--color-success)" : "var(--color-danger)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-xs)" }}>
                        <span className="tech-text" style={{ fontWeight: "700" }}>QUESTION #{idx + 1} ({ans.category})</span>
                        <span className={`badge ${labelType}`}>{ans.isCorrect ? "CORRECT" : ans.selectedAnswer === "Skipped" ? "SKIPPED" : "INCORRECT"}</span>
                      </div>
                      <p style={{ fontWeight: "bold", marginBottom: "var(--space-sm)" }}>{ans.question}</p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "var(--space-xs) 0" }}>
                        {ans.options.map((opt, i) => {
                          const isSelected = ans.selectedAnswer === opt;
                          const isCorrectOpt = ans.correctAnswer === opt;
                          let borderClr = "var(--color-border)";
                          let bgClr = "transparent";
                          if (isCorrectOpt) {
                            borderClr = "var(--color-success)";
                            bgClr = "var(--color-success-bg)";
                          } else if (isSelected) {
                            borderClr = "var(--color-danger)";
                            bgClr = "var(--color-danger-bg)";
                          }

                          return (
                            <div key={i} style={{ border: `1px solid ${borderClr}`, backgroundColor: bgClr, padding: "8px", borderRadius: "var(--radius-sm)" }} className="tech-text">
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: "var(--space-sm)", padding: "var(--space-xs)", backgroundColor: "var(--color-bg-base)", borderRadius: "var(--radius-sm)" }}>
                        <span className="tech-text" style={{ fontWeight: "bold", display: "block" }}>EXPLANATION:</span>
                        <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>{ans.explanation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OIRReport;