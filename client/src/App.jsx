import { BrowserRouter, Routes, Route } from "react-router-dom";
import PIQPage from "./modules/interview/pages/PIQPage";
import HomePage from "./modules/home/pages/HomePage";
import PPDTPage from "./modules/ppdt/pages/PPDTPage";
import InterviewPage from "./modules/interview/pages/InterviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/ppdt" element={<PPDTPage />} />
        <Route path="/piq" element={<PIQPage />}/>
        <Route path="/interview" element={<InterviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;