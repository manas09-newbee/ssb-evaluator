import { useEffect, useState, useRef } from "react";
import {
  startInterview,
  submitAnswer,
  getHistory,
  endInterview,
} from "../services/interviewService";

function InterviewPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] =
  useState("");
  const recognitionRef = useRef(null);
  const hasStartedRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
  if (hasStartedRef.current) {
    return;
  }

  hasStartedRef.current = true;

  loadQuestion();
}, []);
  const [isEnding, setIsEnding] = useState(false);

  const loadQuestion = async () => {
    try {
      const data = await startInterview();

      setSessionId(data.sessionId);
      setQuestion(data.question);

      console.log("Session:", data.sessionId);

      speakQuestion(data.question);
    } catch (error) {
      console.error(error);
    }
  };

  const startListening = () => {
    if (isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let currentTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        currentTranscript +=
          event.results[i][0].transcript + " ";
      }

      setAnswer(currentTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakQuestion = (text) => {
  window.speechSynthesis.cancel();

  setTimeout(() => {
    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(
      utterance
    );
  }, 300);
};

  const handleSubmit = async () => {
  if (!answer.trim()) {
    alert("Please answer first");
    return;
  }

  try {
    setLoading(true);

    const data = await submitAnswer(
      sessionId,
      answer
    );

    setQuestion(data.nextQuestion);

    const historyData =
      await getHistory(sessionId);

    setHistory(historyData);
    console.log(
  "Speaking:",
  data.nextQuestion
);
    speakQuestion(data.nextQuestion);

    setAnswer("");
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

const handleEndInterview =
  async () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to end the interview?"
      );

    if (!confirmed) return;

    try {
      setLoading(true);
setIsEnding(true);

      const data =
        await endInterview(
          sessionId
        );

      setReport(data.report);
      console.log("Generating report...");
      alert(
        "Interview Completed"
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Interview Officer</h1>

      <h3>Question:</h3>
      <p>{question}</p>

      <button
  onClick={startListening}
  disabled={isEnding}
>
        Start Speaking
      </button>

      <button
  onClick={stopListening}
  disabled={isEnding}
>
        Stop Speaking
      </button>

      <p>
        {isListening
          ? "Listening..."
          : "Not Listening"}
      </p>
      <h3>Interview History</h3>

{history.map((item, index) => (
  <div key={index}>
    <p>
      <strong>IO:</strong>
      {" "}
      {item.question}
    </p>

    <p>
      <strong>You:</strong>
      {" "}
      {item.answer}
    </p>

    <hr />
  </div>
))}
      <textarea
        rows="8"
        cols="70"
        value={answer}
        onChange={(e) =>
          setAnswer(e.target.value)
        }
        placeholder="Your answer will appear here while speaking..."
      />

      <br />
      <br />

      <button
  onClick={handleSubmit}
  disabled={
  loading ||
  isSpeaking ||
  isEnding
}
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
>
  {
    isEnding
      ? "Generating Report..."
      : "End Interview"
  }
</button>
{report && (
  <div>
    <h2>
      Interview Report
    </h2>

    <pre>{report}</pre>
  </div>
)}
    </div>
  );
}




export default InterviewPage;