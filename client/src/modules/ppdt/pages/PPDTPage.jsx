import { useState, useEffect, useRef } from "react";
import { evaluateHandwrittenStory } from "../services/ppdtservice";

function PPDTPage() {
  const [step, setStep] = useState("init"); // 'init' | 'viewing' | 'writing' | 'upload'
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState("");
  const timerRef = useRef(null);

  // Clean up any timers if component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic controller
  useEffect(() => {
    if (timeLeft <= 0) {
      if (step === "viewing") {
        // Transition immediately to writing phase when 30 seconds are up
        startWritingPhase();
      } else if (step === "writing") {
        // Transition immediately to upload phase when 4 minutes are up
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
    setEvaluation("");
    setStep("viewing");
    setTimeLeft(30); // 30 seconds to observe hazy picture
  };

  const startWritingPhase = () => {
    setStep("writing");
    setTimeLeft(240); // 4 minutes (240 seconds) to write on physical paper
  };

  // Convert uploaded image file to Base64 String
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setLoading(true);
        console.log("Image read complete. Sending to Gemini 3 Flash...");
        
        const data = await evaluateHandwrittenStory(reader.result);
        setEvaluation(data.evaluation);
        
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
    <div>
      <h1>SSB PPDT Evaluator</h1>

      {/* STEP 1: INITIAL STATE */}
      {step === "init" && (
        <div>
          <p>This module evaluates both your handwriting and story quality using AI.</p>
          <h3>Instructions:</h3>
          <ul>
            <li>Keep a physical sheet of paper and a pen ready.</li>
            <li>Observe the hazy picture closely for 30 seconds once you start.</li>
            <li>Write your story on the paper under a strict 4-minute timer.</li>
            <li>Take a clear photo of the paper and upload it for evaluation.</li>
          </ul>
          <button onClick={startViewingPhase}>Start PPDT Test</button>
        </div>
      )}

      {/* STEP 2: OBSERVING PICTURE */}
      {step === "viewing" && (
        <div>
          <h2>Observe the Picture Closely</h2>
          <h3>Time Remaining: {timeLeft} seconds</h3>
          
          {/* Grayscale, hazy/foggy outdoor scene suitable for a PPDT prompt */}
          <img
            src="https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=600&auto=format&fit=crop"
            alt="PPDT Hazy Trigger Scene"
            style={{
              width: "100%",
              maxWidth: "500px",
              filter: "grayscale(100%) blur(1px)",
              border: "1px solid #ccc"
            }}
          />
        </div>
      )}

      {/* STEP 3: WRITING STORY */}
      {step === "writing" && (
        <div>
          <h2>Write Your Story on Paper</h2>
          <h3 style={{ color: "red" }}>
            Time Remaining: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
          </h3>
          <p>
            Mark the characters, mood, and age in the box first, then construct your story narrative.
          </p>
          <div style={{ border: "1px dashed #aaa", padding: "20px", display: "inline-block", background: "#fcfcfc" }}>
            <h4>Guidelines:</h4>
            <p>1. What led to the situation?</p>
            <p>2. What is currently happening?</p>
            <p>3. What is the logical outcome?</p>
          </div>
          <br /><br />
          <button onClick={() => setStep("upload")}>Done Writing (Go to Upload)</button>
        </div>
      )}

      {/* STEP 4: UPLOADING HANDWRITING */}
      {step === "upload" && (
        <div>
          <h2>Submit Your Handwritten Story</h2>
          
          {loading ? (
            <div>
              <h3>Analyzing your handwriting & narrative...</h3>
              <p>Gemini 3 Flash is performing OCR transcription, checking legibility, and conducting an OLQ analysis.</p>
              <p>Please wait. Do not refresh.</p>
            </div>
          ) : (
            <div>
              {!evaluation ? (
                <div>
                  <p>Take a clear photo of your handwritten paper and upload it below:</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <br /><br />
                  <button onClick={() => setStep("init")}>Reset Test</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setStep("init")} style={{ marginBottom: "20px" }}>
                    Take Another Test
                  </button>
                  
                  <h2>PPDT Evaluation Report</h2>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: "15px", border: "1px solid #ddd" }}>
                    {evaluation}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PPDTPage;