import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/interviewService";

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
    <div>
      {/* Dynamic Scoped CSS to Style Dossier Form */}
      <style>{`
        .piq-sheet {
          max-width: 950px;
          margin: 30px auto;
          padding: 40px;
          background-color: #fcfdfa;
          border: 4px double #4a5d4e;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          color: #1e2e22;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .piq-title-block {
          text-align: center;
          border-bottom: 3px double #4a5d4e;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .piq-confidential {
          float: right;
          border: 2px solid #8c3b3b;
          color: #8c3b3b;
          padding: 4px 12px;
          font-weight: bold;
          font-size: 13px;
          text-transform: uppercase;
        }
        .piq-form-no {
          float: left;
          font-size: 11px;
          font-weight: bold;
          color: #4a5d4e;
        }
        .piq-sheet h1 {
          margin: 15px 0 5px 0;
          font-size: 22px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #2e4a36;
          font-weight: 900;
        }
        .piq-sheet h2 {
          margin: 0;
          font-size: 13px;
          color: #5c6f60;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .piq-section {
          margin-bottom: 30px;
          border: 2px solid #4a5d4e;
          background-color: #fdfdfd;
        }
        .piq-section-title {
          background-color: #4a5d4e;
          color: white;
          padding: 8px 15px;
          margin: 0;
          font-size: 13px;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .piq-row {
          display: flex;
          flex-wrap: wrap;
          border-bottom: 1px solid #4a5d4e;
        }
        .piq-row:last-child {
          border-bottom: none;
        }
        .piq-field {
          flex: 1;
          min-width: 200px;
          padding: 10px 15px;
          border-right: 1px solid #c2cdc2;
          box-sizing: border-box;
        }
        .piq-field:last-child {
          border-right: none;
        }
        .piq-field label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: bold;
          color: #3d4f41;
          margin-bottom: 6px;
        }
        .piq-field input, .piq-field select, .piq-field textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #9bb0a0;
          background-color: #fff;
          color: #222;
          box-sizing: border-box;
          font-family: inherit;
          font-size: 13px;
          border-radius: 2px;
        }
        .piq-field input:focus {
          outline: 2px solid #2e4a36;
          border-color: #2e4a36;
        }
        .piq-btn {
          background-color: #2e4a36;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          display: block;
          width: 100%;
          margin-top: 30px;
          border-radius: 4px;
          letter-spacing: 1px;
          font-family: inherit;
        }
        .piq-btn:hover {
          background-color: #1e2f22;
        }
        .piq-instructions {
          background-color: #f5f7f4;
          border-left: 5px solid #4a5d4e;
          padding: 15px;
          margin-bottom: 30px;
          font-size: 12px;
          line-height: 1.6;
        }
        .piq-instructions h3 {
          margin: 0 0 5px 0;
          font-size: 13px;
          color: #2e4a36;
        }
      `}</style>

      <div className="piq-sheet">
        <div className="piq-title-block">
          <div className="piq-form-no">DIPR FORM NO. 107-A (REVISED)</div>
          <div className="piq-confidential">Strictly Confidential</div>
          <div style={{ clear: "both" }}></div>
          <h1>Personal Information Questionnaire</h1>
          <h2>Service Selection Board (SSB) Dossier Sheet</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <h2 style={{ fontSize: "20px", color: "#2e4a36" }}>PREPARING INTERVIEW SESSION...</h2>
            <p style={{ fontSize: "14px", lineHeight: "1.6", maxWidth: "600px", margin: "15px auto" }}>
              Analyzing your PIQ details using AI and compiling your personalized dynamic stage-based question bank.
            </p>
            <p style={{ fontSize: "13px", color: "#666" }}>Please wait, this will take approximately 10 to 15 seconds. Do not refresh.</p>
          </div>
        ) : (
          <div>
            <div className="piq-instructions">
              <h3>General Instructions for Candidates:</h3>
              This questionnaire is used to construct the framework of your Personal Interview. Fill all fields carefully and honestly. 
              The AI Interviewing Officer will use this data to dynamically generate standard stage questions, record responses, 
              and analyze consistency during live speech.
            </div>

            {/* Board Information Section */}
            <div className="piq-section">
              <div className="piq-section-title">SSB Office & Entry Metadata</div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Selection Board No & Place</label>
                  <input
                    type="text"
                    placeholder="e.g. 17 SSB Bangalore"
                    value={piq.selectionBoard || ""}
                    onChange={(e) => setPiq({ ...piq, selectionBoard: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>UPSC Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0822153"
                    value={piq.rollNo || ""}
                    onChange={(e) => setPiq({ ...piq, rollNo: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Type of Entry</label>
                  <input
                    type="text"
                    placeholder="e.g. NDA, CDS, AFCAT, TGC"
                    value={piq.entry || ""}
                    onChange={(e) => setPiq({ ...piq, entry: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-MUM-5421"
                    value={piq.batchNo || ""}
                    onChange={(e) => setPiq({ ...piq, batchNo: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Chest Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24"
                    value={piq.chestNo || ""}
                    onChange={(e) => setPiq({ ...piq, chestNo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 1: Personal details */}
            <div className="piq-section">
              <div className="piq-section-title">Section 1: Personal & Residence Details</div>
              <div className="piq-row">
                <div className="piq-field" style={{ flex: 2 }}>
                  <label>Name (In BLOCK LETTERS as in Application)</label>
                  <input
                    type="text"
                    placeholder="e.g. MOHIT SHARMA"
                    value={piq.name || ""}
                    onChange={(e) => setPiq({ ...piq, name: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Date of Birth / Age</label>
                  <input
                    type="text"
                    placeholder="e.g. 14/11/2003 (23 Years)"
                    value={piq.dob || ""}
                    onChange={(e) => setPiq({ ...piq, dob: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Place of Maximum Residence (District, State & Population)</label>
                  <input
                    type="text"
                    placeholder="Town, Dist, State & Approx Population"
                    value={piq.maxResidence || ""}
                    onChange={(e) => setPiq({ ...piq, maxResidence: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Place of Present Residence (District, State & Population)</label>
                  <input
                    type="text"
                    placeholder="Current Town, Dist, State & Population"
                    value={piq.presentResidence || ""}
                    onChange={(e) => setPiq({ ...piq, presentResidence: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Place of Permanent Residence (District, State & Population)</label>
                  <input
                    type="text"
                    placeholder="Native Town, Dist, State & Population"
                    value={piq.permanentResidence || ""}
                    onChange={(e) => setPiq({ ...piq, permanentResidence: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Family Background */}
            <div className="piq-section">
              <div className="piq-section-title">Section 2: Family Background & Chores</div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Father's Profile (Education, Occupation & Monthly Income)</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Com, Govt Service, Rs. 55,000/pm"
                    value={piq.fatherOccupation || ""}
                    onChange={(e) => setPiq({ ...piq, fatherOccupation: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Mother's Profile (Education, Occupation & Monthly Income)</label>
                  <input
                    type="text"
                    placeholder="e.g. Matric, Homemaker, Nil"
                    value={piq.motherOccupation || ""}
                    onChange={(e) => setPiq({ ...piq, motherOccupation: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Siblings Detail (Brothers/Sisters, Age, Education, Status)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 elder sister (M.Sc, Married), 1 younger brother (10th standard)"
                    value={piq.siblings || ""}
                    onChange={(e) => setPiq({ ...piq, siblings: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Educational Record */}
            <div className="piq-section">
              <div className="piq-section-title">Section 3: Academic History (Class 10th Onwards)</div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Class 10th Details (School, Board, Year, Marks %, Medium)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Army Public School, CBSE, 2019, 92%, English Medium"
                    value={piq.education_10th || ""}
                    onChange={(e) => setPiq({ ...piq, education_10th: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Class 12th / +2 Details (School, Board, Year, Marks %, Medium)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. KV No 2 Delhi, CBSE, 2021, 88%, English Medium, PCM stream"
                    value={piq.education_12th || ""}
                    onChange={(e) => setPiq({ ...piq, education_12th: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Graduation/Post-Graduation (College, Uni, Year, Marks %, Stream)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Bhaskaracharya College (DU), BSc Comp Science, 2024, 83%"
                    value={piq.education_graduation || ""}
                    onChange={(e) => setPiq({ ...piq, education_graduation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Activities, Hobbies & Responsibility */}
            <div className="piq-section">
              <div className="piq-section-title">Section 4: Activities, Sports, Hobbies & Leadership</div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Present Occupation & Personal Income</label>
                  <input
                    type="text"
                    placeholder="e.g. Preparing for CDS exam, No personal income"
                    value={piq.presentOccupation || ""}
                    onChange={(e) => setPiq({ ...piq, presentOccupation: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>NCC / Scouting Training details</label>
                  <input
                    type="text"
                    placeholder="e.g. NCC Air Wing, 2 Years, C-Certificate obtained"
                    value={piq.nccTraining || ""}
                    onChange={(e) => setPiq({ ...piq, nccTraining: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Games & Sports Played (Period, Representation Level, Achievements)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Volleyball, played for 3 years in college team, represented DU in inter-varsity"
                    value={piq.sports || ""}
                    onChange={(e) => setPiq({ ...piq, sports: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Hobbies / Interests</label>
                  <input
                    type="text"
                    placeholder="e.g. Playing acoustic guitar, jogging, cooking"
                    value={piq.hobbies || ""}
                    onChange={(e) => setPiq({ ...piq, hobbies: e.target.value })}
                  />
                </div>
                <div className="piq-field">
                  <label>Extra-curricular Activities</label>
                  <input
                    type="text"
                    placeholder="e.g. Organized cultural college fest, stage drama coordinator"
                    value={piq.extracurricular || ""}
                    onChange={(e) => setPiq({ ...piq, extracurricular: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Positions of Responsibility Held (NCC Senior, Captain, President etc.)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Sports President of College Council, Camp Senior at NCC AIVSC 2025"
                    value={piq.positionsOfResponsibility || ""}
                    onChange={(e) => setPiq({ ...piq, positionsOfResponsibility: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: SSB attempts details */}
            <div className="piq-section">
              <div className="piq-section-title">Section 5: Previous SSB Attendance Details</div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Number of Previous SSB Attempts</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 attempts"
                    value={piq.attempts || ""}
                    onChange={(e) => setPiq({ ...piq, attempts: e.target.value })}
                  />
                </div>
              </div>
              <div className="piq-row">
                <div className="piq-field">
                  <label>Details of Prior Boards (SSB Board, Batch, Date, Chest No & Result)</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. 1. 1 AFSB Gandhinagar, Oct 2024, Chest 43, Screened Out. 2. 4 SSB Varanasi, Feb 2025, Chest 12, Not Recommended."
                    value={piq.previousSsbDetails || ""}
                    onChange={(e) => setPiq({ ...piq, previousSsbDetails: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button className="piq-btn" onClick={handleStartInterview}>
              Lock Dossier & Start Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PIQPage;