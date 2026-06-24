import { Link } from "react-router-dom";
// Module-specific style import
import "../styles/home.css";

function HomePage() {
  return (
    <div className="layout-container">
      <div>
      <h1>SSB Evaluator</h1>

      <br />

      <Link to="/ppdt">
        <button>PPDT Evaluator</button>
      </Link>

      <br />
      <br />

      <Link to="/piq">
        <button>AI Interview Officer</button>
      </Link>
    </div>
    </div>
  );
}

export default HomePage;