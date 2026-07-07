import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PIQPage from "./modules/interview/pages/PIQPage";
import HomePage from "./modules/home/pages/HomePage";
import PPDTPage from "./modules/ppdt/pages/PPDTPage";
import InterviewPage from "./modules/interview/pages/InterviewPage";
import LoginPage from "./modules/home/pages/LoginPage";
import RegisterPage from "./modules/home/pages/RegisterPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

// OIR Module pages
import OIRHome from "./modules/oir/pages/OIRHome";
import OIRTest from "./modules/oir/pages/OIRTest";
import OIRReport from "./modules/oir/pages/OIRReport";

// Interceptor block: automatically detects 401 Unauthorized responses
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
        
        {/* Officer Intelligence Rating (OIR) Endpoints */}
        <Route path="/oir" element={<ProtectedRoute><OIRHome /></ProtectedRoute>} />
        <Route path="/oir/test" element={<ProtectedRoute><OIRTest /></ProtectedRoute>} />
        <Route path="/oir/report/:id" element={<ProtectedRoute><OIRReport /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;