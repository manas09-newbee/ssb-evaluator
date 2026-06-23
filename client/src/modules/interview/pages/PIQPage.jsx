import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/interviewService";

// Module-specific style import
import "../styles/interview.css";

function PIQPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Initialize form state from localStorage to persistent values
  const [piq, setPiq] = useState(() => {
    const saved = localStorage.getItem("ssb_piq_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved PIQ from localStorage:", e);
      }
    }
    // Deep SSB-aligned PIQ fields schema representing actual DIPR form fields
    return {
      selectionBoard: "",
      rollNo: "",
      entry: "",
      batchNo: "",
      chestNo: "",
      name: "",
      dob: "",
      maxResidence: "",
      presentResidence: "",
      permanentResidence: "",
      fatherOccupation: "",
      fatherIncome: "",
      motherOccupation: "",
      motherIncome: "",
      siblings: "",
      education_10th: "",
      education_12th: "",
      education_graduation: "",
      presentOccupation: "",
      nccTraining: "",
      sports: "",
      hobbies: "",
      extracurricular: "",
      positionsOfResponsibility: "",
      attempts: "",
      previousSsbDetails: ""
    };
  });

  // Track any change in the PIQ inputs and store it directly to localStorage
  useEffect(() => {
    localStorage.setItem("ssb_piq_data", JSON.stringify(piq));
  }, [piq]);

  const handleStartInterview = async () => {
    if (!piq.name.trim()) {
      alert("Please enter your name to start.");
      return;
    }

    try {
      setLoading(true);
      console.log("Submitting expanded PIQ and starting session creation:", piq);
      const data = await startInterview(piq);
      
      if (data && data.sessionId) {
        navigate(
          "/interview",
          {
            state: {
              sessionId: data.sessionId,
              question: data.question,
              piq
            }
          }
        );
      } else {
        throw new Error("Invalid response from server during session initialization.");
      }
    } catch (error) {
      console.error("Error initiating interview session:", error);
      alert("Could not start interview session. Check if your backend server is running and the Gemini API key is valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <div className="card card-dossier">
        <div className="card-dossier-inner">
          
          {/* Header block with institutional markings */}
          <div className="card-header" style={{ borderBottom: "3px double var(--color-border-dark)" }}>
            <div>
              <span className="tech-text" style={{ fontSize: "var(--font-size-xs)", fontWeight: "bold" }}>DIPR FORM NO. 107-A (REVISED)</span>
              <h1 className="card-title" style={{ marginTop: "var(--space-xs)" }}>Personal Information Questionnaire</h1>
              <h2 className="card-subtitle">Service Selection Board (SSB) Dossier Sheet</h2>
            </div>
            <span className="badge badge-danger">Strictly Confidential</span>
          </div>

          {loading ? (
            <div className="card-body" style={{ textAlign: "center", padding: "var(--space-xxl) 0" }}>
              <h2>Preparing Interview Session...</h2>
              <p className="form-feedback" style={{ maxWidth: "600px", margin: "var(--space-md) auto", fontSize: "var(--font-size-md)" }}>
                Analyzing your PIQ details using AI and compiling your personalized dynamic stage-based question bank.
              </p>
              <div className="tech-text" style={{ color: "var(--color-text-muted)" }}>Please wait. Do not refresh this page.</div>
            </div>
          ) : (
            <div className="card-body">
              <div className="form-feedback" style={{ backgroundColor: "var(--color-bg-base)", borderLeft: "4px solid var(--color-primary)", padding: "var(--space-md)", marginBottom: "var(--space-xl)", lineHeight: "1.6" }}>
                <strong>Candidate Instruction:</strong> This questionnaire constitutes the foundation of your upcoming dynamic interview. Fill in every parameter with precision. Stored fields are synchronized across dynamic assessment stages in real-time.
              </div>

              {/* SSB metadata segment */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>SSB Office & Entry Metadata</h3>
                <div className="card-body">
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Selection Board No & Place</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. 17 SSB Bangalore"
                        value={piq.selectionBoard || ""}
                        onChange={(e) => setPiq({ ...piq, selectionBoard: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">UPSC Roll Number</label>
                      <input
                        className="form-control form-control-tech"
                        type="text"
                        placeholder="e.g. 0822153"
                        value={piq.rollNo || ""}
                        onChange={(e) => setPiq({ ...piq, rollNo: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type of Entry</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. NDA, CDS, AFCAT"
                        value={piq.entry || ""}
                        onChange={(e) => setPiq({ ...piq, entry: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-grid form-grid-2" style={{ marginTop: "var(--space-md)" }}>
                    <div className="form-group">
                      <label className="form-label">Batch Number</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. B-MUM-5421"
                        value={piq.batchNo || ""}
                        onChange={(e) => setPiq({ ...piq, batchNo: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Chest Number</label>
                      <input
                        className="form-control form-control-tech"
                        type="text"
                        placeholder="e.g. 24"
                        value={piq.chestNo || ""}
                        onChange={(e) => setPiq({ ...piq, chestNo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Personal profile */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>Section 1: Personal & Residence Details</h3>
                <div className="card-body">
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label form-label-required">Candidate Name (BLOCK LETTERS)</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. MOHIT SHARMA"
                        value={piq.name || ""}
                        onChange={(e) => setPiq({ ...piq, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth / Age</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. 14/11/2003 (23 Years)"
                        value={piq.dob || ""}
                        onChange={(e) => setPiq({ ...piq, dob: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Place of Maximum Residence (District, State & Population)</label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Town, Dist, State & Approx Population"
                      value={piq.maxResidence || ""}
                      onChange={(e) => setPiq({ ...piq, maxResidence: e.target.value })}
                    />
                  </div>
                  <div className="form-grid form-grid-2" style={{ marginTop: "var(--space-md)" }}>
                    <div className="form-group">
                      <label className="form-label">Place of Present Residence</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Current Town, Dist, State & Population"
                        value={piq.presentResidence || ""}
                        onChange={(e) => setPiq({ ...piq, presentResidence: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Place of Permanent Residence</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Native Town, Dist, State & Population"
                        value={piq.permanentResidence || ""}
                        onChange={(e) => setPiq({ ...piq, permanentResidence: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Family dynamics */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>Section 2: Family Background & Chores</h3>
                <div className="card-body">
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Father's Profile (Education, Occupation & Income)</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. B.Com, Govt Service, Rs. 55,000/pm"
                        value={piq.fatherOccupation || ""}
                        onChange={(e) => setPiq({ ...piq, fatherOccupation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mother's Profile (Education, Occupation & Income)</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. Matric, Homemaker, Nil"
                        value={piq.motherOccupation || ""}
                        onChange={(e) => setPiq({ ...piq, motherOccupation: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Siblings Detail (Brothers/Sisters, Age, Status)</label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="e.g. 1 sister (M.Sc, Married), 1 younger brother (10th standard)"
                      value={piq.siblings || ""}
                      onChange={(e) => setPiq({ ...piq, siblings: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Educational Records */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>Section 3: Academic History (Class 10th Onwards)</h3>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Class 10th Details (School, Board, Year, Marks %, Medium)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Army Public School, CBSE, 2019, 92%, English Medium"
                      value={piq.education_10th || ""}
                      onChange={(e) => setPiq({ ...piq, education_10th: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Class 12th / +2 Details (School, Board, Year, Marks %, Medium)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. KV No 2 Delhi, CBSE, 2021, 88%, English Medium, PCM stream"
                      value={piq.education_12th || ""}
                      onChange={(e) => setPiq({ ...piq, education_12th: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Graduation/Post-Graduation Details (College, University, Year, % Marks)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Bhaskaracharya College (DU), BSc Comp Science, 2024, 83%"
                      value={piq.education_graduation || ""}
                      onChange={(e) => setPiq({ ...piq, education_graduation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Activities & GTO elements */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>Section 4: Activities, Sports, Hobbies & Leadership</h3>
                <div className="card-body">
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Present Occupation & Monthly Income</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. Preparing for CDS exam, No personal income"
                        value={piq.presentOccupation || ""}
                        onChange={(e) => setPiq({ ...piq, presentOccupation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">NCC / Scouting Training details</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. NCC Air Wing, 2 Years, C-Certificate obtained"
                        value={piq.nccTraining || ""}
                        onChange={(e) => setPiq({ ...piq, nccTraining: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Games & Sports Played (Representation levels & achievements)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Volleyball, played for 3 years in college team, represented DU in inter-varsity"
                      value={piq.sports || ""}
                      onChange={(e) => setPiq({ ...piq, sports: e.target.value })}
                    />
                  </div>
                  <div className="form-grid form-grid-2" style={{ marginTop: "var(--space-md)" }}>
                    <div className="form-group">
                      <label className="form-label">Hobbies / Interests</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. Playing acoustic guitar, jogging, cooking"
                        value={piq.hobbies || ""}
                        onChange={(e) => setPiq({ ...piq, hobbies: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Extra-curricular Activities</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g. Organized cultural college fest, stage drama coordinator"
                        value={piq.extracurricular || ""}
                        onChange={(e) => setPiq({ ...piq, extracurricular: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Positions of Responsibility Held</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Sports President of College Council, Camp Senior at NCC AIVSC 2025"
                      value={piq.positionsOfResponsibility || ""}
                      onChange={(e) => setPiq({ ...piq, positionsOfResponsibility: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Prior SSB attempts */}
              <div className="card card-interactive" style={{ marginBottom: "var(--space-lg)" }}>
                <h3 className="card-header card-header-accent card-title" style={{ fontSize: "var(--font-size-md)" }}>Section 5: Previous SSB Attendance Details</h3>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Number of Previous SSB Attempts</label>
                    <input
                      className="form-control form-control-tech"
                      type="text"
                      placeholder="e.g. 2 attempts"
                      value={piq.attempts || ""}
                      onChange={(e) => setPiq({ ...piq, attempts: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
                    <label className="form-label">Details of Prior Selection Boards (SSB Board, Batch, date & result)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. 1. 1 AFSB Gandhinagar, Oct 2024, Chest 43, Screened Out. 2. 4 SSB Varanasi, Feb 2025, Chest 12, Not Recommended."
                      value={piq.previousSsbDetails || ""}
                      onChange={(e) => setPiq({ ...piq, previousSsbDetails: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "var(--space-xl)" }} onClick={handleStartInterview}>
                Lock Dossier & Start Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PIQPage;