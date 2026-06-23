import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 1. Global Baseline Styles
import "./styles/global/variables.css";
import "./styles/global/reset.css";
import "./styles/global/app.css";

// 2. Shared Element Styles
import "./styles/shared/buttons.css";
import "./styles/shared/cards.css";
import "./styles/shared/forms.css";
import "./styles/shared/badges.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);