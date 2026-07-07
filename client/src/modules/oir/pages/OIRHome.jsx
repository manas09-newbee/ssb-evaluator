import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../services/oirService";
import "../styles/oir.css";

function OIRHome() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState("25");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load OIR statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleStartTest = () => {
    navigate("/oir/test", { state: { difficulty, count } });
  };

  return (
    <div className="layout-container oir-layout">
      <div className="card card-dossier" style={{ width: "100%", marginBottom: "var(--space-lg)" }}>
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title">Officer Intelligence Rating (OIR)</h1>
            <span className="badge badge-info">Verbal & Non-Verbal</span>
          </div>

          <div className="card-body">
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-lg)" }}>
              The OIR is the first phase of your Stage-1 screening testing. It measures verbal reasoning logic, mental mathematics, and visual shape manipulation.
            </p>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Select Difficulty</label>
                <select className="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="all">Mixed (All Difficulties)</option>
                  <option value="easy">Easy</option>
                  <option key="med" value="medium">Medium</option>
                  <option key="hrd" value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Limit</label>
                <select className="form-control" value={count} onChange={(e) => setCount(e.target.value)}>
                  <option value="25">25 Questions</option>
                  <option value="50">50 Questions</option>
                  <option value = "75">75 Questions</option>
                  <option value="100">100 Questions</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "var(--space-lg)" }} onClick={handleStartTest}>
              Start Evaluation Run
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Integration Block */}
      <div className="card card-dossier">
        <div className="card-dossier-inner">
          <div className="card-header card-header-accent">
            <h2 className="card-title">Your OIR Dashboard</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="tech-text">Analyzing diagnostic stats...</div>
            ) : stats && stats.hasStats ? (
              <div>
                <div className="form-grid form-grid-3" style={{ marginBottom: "var(--space-lg)" }}>
                  <div className="card" style={{ backgroundColor: "var(--color-bg-base)", textAlign: "center" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>TOTAL ATTEMPTS</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{stats.totalAttempts}</h3>
                    </div>
                  </div>
                  <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>HIGHEST SCORE</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{stats.highestScore}%</h3>
                    </div>
                  </div>
                  <div className="card" style={{ textAlign: "center", backgroundColor: "var(--color-bg-base)" }}>
                    <div className="card-body">
                      <span className="tech-text" style={{ color: "var(--color-text-secondary)" }}>AVERAGE SCORE</span>
                      <h3 style={{ margin: "var(--space-xxs) 0 0 0" }}>{stats.averageScore}%</h3>
                    </div>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: "var(--font-size-md)", margin: 0 }}>Recent Testing Log</h3></div>
                    <div className="card-body">
                      <ul style={{ padding: 0 }}>
                        {stats.recentAttempts.map((attempt, index) => (
                          <li key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-xxs)" }}>
                            <span className="tech-text" style={{ textTransform: "capitalize" }}>{attempt.difficulty} Run</span>
                            <span className="badge badge-outline badge-info">{Math.round((attempt.score / attempt.maxScore) * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><h3 style={{ fontSize: "var(--font-size-md)", margin: 0 }}>Performance Trend</h3></div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                      {stats.performanceTrend.slice(-5).map((point, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                          <span className="tech-text" style={{ width: "80px", fontSize: "var(--font-size-xs)" }}>Test #{idx + 1}</span>
                          <div style={{ flexGrow: 1, backgroundColor: "var(--color-border)", height: "8px", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                            <div style={{ width: `${point.scorePercent}%`, backgroundColor: "var(--color-primary)", height: "100%" }}></div>
                          </div>
                          <span className="tech-text" style={{ width: "40px", textAlign: "right" }}>{point.scorePercent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="tech-text">No testing history logged yet. Complete your first evaluation run to populate analytics.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OIRHome;