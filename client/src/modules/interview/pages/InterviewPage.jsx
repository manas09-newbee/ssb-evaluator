import { useEffect, useState, useRef } from "react";

import {
  startInterview,
  submitAnswer
} from "../services/interviewService";

function InterviewPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    try {
      const data = await startInterview();

      setQuestion(data.question);
      speakQuestion(data.question);
    } catch (error) {
      console.error(error);
    }
  };
  
  const startListening = () => {
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

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    let currentTranscript = "";

    for (
      let i = 0;
      i < event.results.length;
      i++
    ) {
      currentTranscript +=
        event.results[i][0].transcript + " ";
    }

    setTranscript(currentTranscript);
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
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
 };
  

 const handleSubmit = async () => {
  try {
    const data = await submitAnswer(
      transcript
    );

    setQuestion(data.nextQuestion);

    speakQuestion(data.nextQuestion);

    setTranscript("");
  } catch (err) {
    console.error(err);
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

      <h3>Transcript:</h3>
      <p>{transcript}</p>
      
      <p>
     {isListening
      ? "Listening..."
      : "Not Listening"}
      </p>
      <textarea
        rows="6"
        cols="60"
        value={answer}
        onChange={(e) =>
          setAnswer(e.target.value)
        }
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