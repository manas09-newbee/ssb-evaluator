import { Link } from "react-router-dom";
// Module-specific style import
import "../styles/home.css";

function HomePage() {
  return (
    <div className="layout-container home-layout">
      <header className="home-header">
        <span className="tech-text header-badge">DIPR COMPLIANT DIGITAL ASSESSMENT</span>
        <h1 className="home-title">OLQInsight</h1>
        <p className="home-subtitle">
          Comprehensive physical prep toolkit modeled after standard Service Selection Board parameters. Utilize dynamic OCR parsing and dynamic conversational AI engines to analyze Officer Like Qualities (OLQ).
        </p>
      </header>

      <main className="home-grid">
        {/* Card 1: Stage I Screening */}
        <div className="card home-card">
          <div className="home-card-header card-header-stage1">
            <span className="tech-text card-num">STAGE 1 TESTING</span>
            <h2>PPDT Screening Evaluator</h2>
          </div>
          <div className="home-card-body">
            <p>
              Simulate the Picture Perception & Description Test (PPDT). Observe hazy scenario cards under precise timelines, draft your physical narrative on paper, and upload a photograph. Performs instant handwriting transcription, grammar checking, and OLQ rating indicators.
            </p>
            <div className="home-card-actions">
              <Link to="/ppdt" className="btn btn-primary btn-lg home-btn">
                Launch PPDT Module
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Stage II Interview */}
        <div className="card home-card">
          <div className="home-card-header card-header-stage2">
            <span className="tech-text card-num">STAGE 2 TESTING</span>
            <h2>AI Interviewing Officer</h2>
          </div>
          <div className="home-card-body">
            <p>
              Undergo a customized interactive session. Input personal history into a formal PIQ form to generate a targeted questions stack. Use real-time audio transcription with continuous context-aware follow-up queries and contradiction analysis.
            </p>
            <div className="home-card-actions">
              <Link to="/piq" className="btn btn-secondary btn-lg home-btn">
                Begin AI Interview
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="footer-line"></div>
        <p className="tech-text footer-text">
          RESTRICTED CANDIDATE PREPARATION PLATFORM • INTELLECTUAL PROPERTY NOTICE
        </p>
      </footer>
    </div>
  );
}

export default HomePage;