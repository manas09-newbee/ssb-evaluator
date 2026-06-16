import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      <h1>SSB Evaluator</h1>

      <br />

      <Link to="/ppdt">
        <button>PPDT Evaluator</button>
      </Link>

      <br />
      <br />

      <Link to="/interview">
        <button>AI Interview Officer</button>
      </Link>
    </div>
  );
}

export default HomePage;