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
    // Deep SSB-aligned PIQ fields schema
    return {
      name: "",
      dob: "",
      placeOfResidence: "",
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
      entry: "",
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
      <h1>Personal Information Questionnaire</h1>

      {loading ? (
        <div>
          <h2>Preparing Interview Session...</h2>
          <p>Analyzing PIQ details using AI and compiling your personalized dynamic question bank.</p>
          <p>Please wait, this will take approximately 10 to 15 seconds. Do not refresh.</p>
        </div>
      ) : (
        <div>
          {/* Section 1 */}
          <div>
            <h3>Section 1: Personal & Residence Details</h3>
            
            <label>Name (In Block Letters): </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. MOHIT SHARMA"
              value={piq.name}
              onChange={(e) => setPiq({ ...piq, name: e.target.value })}
            />
            <br /><br />

            <label>Date of Birth / Age: </label>
            <input
              type="text"
              placeholder="e.g. 23 Years, 14/11/2003"
              value={piq.dob}
              onChange={(e) => setPiq({ ...piq, dob: e.target.value })}
            />
            <br /><br />

            <label>Place of Residence Details: </label>
            <input
              type="text"
              placeholder="Town, District, State & Approx Population"
              value={piq.placeOfResidence}
              onChange={(e) => setPiq({ ...piq, placeOfResidence: e.target.value })}
            />
          </div>

          <hr />

          {/* Section 2 */}
          <div>
            <h3>Section 2: Family Background</h3>
            
            <label>Father's Profile: </label>
            <input
              type="text"
              placeholder="Occupation and Monthly Income"
              value={piq.fatherOccupation}
              onChange={(e) => setPiq({ ...piq, fatherOccupation: e.target.value })}
            />
            <br /><br />

            <label>Mother's Profile: </label>
            <input
              type="text"
              placeholder="Occupation and Monthly Income"
              value={piq.motherOccupation}
              onChange={(e) => setPiq({ ...piq, motherOccupation: e.target.value })}
            />
            <br /><br />

            <label>Siblings Detail: </label>
            <input
              type="text"
              placeholder="Number of brothers/sisters, education and occupation"
              value={piq.siblings}
              onChange={(e) => setPiq({ ...piq, siblings: e.target.value })}
            />
          </div>

          <hr />

          {/* Section 3 */}
          <div>
            <h3>Section 3: Educational Record (Class 10th Onwards)</h3>
            
            <label>Class 10th Details: </label>
            <input
              type="text"
              placeholder="School, Board, Year, Marks %, Medium of Instruction"
              value={piq.education_10th}
              onChange={(e) => setPiq({ ...piq, education_10th: e.target.value })}
            />
            <br /><br />

            <label>Class 12th Details: </label>
            <input
              type="text"
              placeholder="School, Board, Year, Marks %, Medium of Instruction"
              value={piq.education_12th}
              onChange={(e) => setPiq({ ...piq, education_12th: e.target.value })}
            />
            <br /><br />

            <label>Graduation/Degree Details: </label>
            <input
              type="text"
              placeholder="College, University, Degree, Year, Marks %"
              value={piq.education_graduation}
              onChange={(e) => setPiq({ ...piq, education_graduation: e.target.value })}
            />
          </div>

          <hr />

          {/* Section 4 */}
          <div>
            <h3>Section 4: Occupation, Training & Extracurriculars</h3>
            
            <label>Present Occupation: </label>
            <input
              type="text"
              placeholder="Current work/status and personal monthly income"
              value={piq.presentOccupation}
              onChange={(e) => setPiq({ ...piq, presentOccupation: e.target.value })}
            />
            <br /><br />

            <label>NCC / Scouting Training: </label>
            <input
              type="text"
              placeholder="Yes/No (If yes, Wing, Division, Cert obtained)"
              value={piq.nccTraining}
              onChange={(e) => setPiq({ ...piq, nccTraining: e.target.value })}
            />
            <br /><br />

            <label>Games & Sports Played: </label>
            <input
              type="text"
              placeholder="Games, duration of participation and level represented"
              value={piq.sports}
              onChange={(e) => setPiq({ ...piq, sports: e.target.value })}
            />
            <br /><br />

            <label>Hobbies / Interests: </label>
            <input
              type="text"
              placeholder="Your specific hobbies and interests"
              value={piq.hobbies}
              onChange={(e) => setPiq({ ...piq, hobbies: e.target.value })}
            />
            <br /><br />

            <label>Extra-curricular Activities: </label>
            <input
              type="text"
              placeholder="Debates, theater, etc. and duration of participation"
              value={piq.extracurricular}
              onChange={(e) => setPiq({ ...piq, extracurricular: e.target.value })}
            />
            <br /><br />

            <label>Positions of Responsibility Held: </label>
            <input
              type="text"
              placeholder="In NCC, Scouting, Sports, School/College, etc."
              value={piq.positionsOfResponsibility}
              onChange={(e) => setPiq({ ...piq, positionsOfResponsibility: e.target.value })}
            />
          </div>

          <hr />

          {/* Section 5 */}
          <div>
            <h3>Section 5: SSB & Entry Details</h3>
            
            <label>Type of Entry: </label>
            <input
              type="text"
              placeholder="e.g. NDA, CDS, AFCAT, TES, TGC, NCC Special"
              value={piq.entry}
              onChange={(e) => setPiq({ ...piq, entry: e.target.value })}
            />
            <br /><br />

            <label>SSB Attempts: </label>
            <input
              type="text"
              placeholder="Number of previous attempts"
              value={piq.attempts}
              onChange={(e) => setPiq({ ...piq, attempts: e.target.value })}
            />
            <br /><br />

            <label>Previous SSB Details: </label>
            <input
              type="text"
              placeholder="SSB Board, batch, date and result"
              value={piq.previousSsbDetails}
              onChange={(e) => setPiq({ ...piq, previousSsbDetails: e.target.value })}
            />
          </div>

          <br /><br />

          <button onClick={handleStartInterview}>
            Start Interview
          </button>
        </div>
      )}
    </div>
  );
}

export default PIQPage;