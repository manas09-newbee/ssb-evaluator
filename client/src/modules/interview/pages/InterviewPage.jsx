import { useEffect, useState, useRef } from "react";
import {
  startInterview,
  submitAnswer,
  getHistory,
} from "../services/interviewService";

function InterviewPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadQuestion();
  }, []);

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

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async () => {
    try {
      const data = await submitAnswer(
        sessionId,
        answer
      );

      setQuestion(data.nextQuestion);
      const historyData =
  await getHistory(sessionId);

setHistory(historyData);
      speakQuestion(data.nextQuestion);

      setAnswer("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>AI Interview Officer</h1>

      <h3>Question:</h3>
      <p>{question}</p>

      <button onClick={startListening}>
        Start Speaking
      </button>

      <button onClick={stopListening}>
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

      <button onClick={handleSubmit}>
        Submit Answer
      </button>
    </div>
  );
}

export default InterviewPage;