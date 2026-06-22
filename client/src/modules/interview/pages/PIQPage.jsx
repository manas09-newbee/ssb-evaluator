import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PIQPage() {
  const navigate = useNavigate();

  const [piq, setPiq] = useState({
    name: "",
    age: "",
    entry: "",
    qualification: "",
    attempts: "",
    hobbies: "",
    sports: ""
  });

  const handleStartInterview = () => {
    console.log(piq);

    navigate(
  "/interview",
  {
    state: {
      piq
    }
  }
);
  };

  return (
    <div>
      <h1>Personal Information Questionnaire</h1>

      <input
        type="text"
        placeholder="Name"
        value={piq.name}
        onChange={(e) =>
          setPiq({
            ...piq,
            name: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Age"
        value={piq.age}
        onChange={(e) =>
          setPiq({
            ...piq,
            age: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Entry"
        value={piq.entry}
        onChange={(e) =>
          setPiq({
            ...piq,
            entry: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Qualification"
        value={piq.qualification}
        onChange={(e) =>
          setPiq({
            ...piq,
            qualification: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="SSB Attempts"
        value={piq.attempts}
        onChange={(e) =>
          setPiq({
            ...piq,
            attempts: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Hobbies"
        value={piq.hobbies}
        onChange={(e) =>
          setPiq({
            ...piq,
            hobbies: e.target.value
          })
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Sports"
        value={piq.sports}
        onChange={(e) =>
          setPiq({
            ...piq,
            sports: e.target.value
          })
        }
      />

      <br />
      <br />

      <button onClick={handleStartInterview}>
        Start Interview
      </button>
    </div>
  );
}

export default PIQPage;

