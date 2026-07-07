import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PIQPage from "./modules/interview/pages/PIQPage";
import HomePage from "./modules/home/pages/HomePage";
import PPDTPage from "./modules/ppdt/pages/PPDTPage";
import InterviewPage from "./modules/interview/pages/InterviewPage";
import LoginPage from "./modules/home/pages/LoginPage";
import RegisterPage from "./modules/home/pages/RegisterPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Interceptor block: automatically detects 401 Unauthorized responses (triggered when the 15-day TTL index
// purges the user's MongoDB record), wipes sessions, and redirects to registration.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("olqinsight_token");
      localStorage.removeItem("olqinsight_user");
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Endpoints */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Secured Assessment Flow Endpoints */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/ppdt" element={<ProtectedRoute><PPDTPage /></ProtectedRoute>} />
        <Route path="/piq" element={<ProtectedRoute><PIQPage /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;