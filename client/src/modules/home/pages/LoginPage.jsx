import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Visibility state

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Display user expiry notices if forced to redirect due to 15-day TTL expiry
  useEffect(() => {
    if (searchParams.get("expired")) {
      setError("Your 15-day registration timeline has elapsed. Please register a new account to continue.");
    }
  }, [searchParams]);

  // Robust, React 18-compatible Google Identity Services script loader
  useEffect(() => {
    const renderGoogleButton = () => {
      /* global google */
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-btn-container"),
          // Corrected: Removed the invalid "100%" width to satisfy Google SDK constraints
          { theme: "outline", size: "large", width: "250" } 
        );
      }
    };

    // Check if the script has already been added to the DOM
    const existingScript = document.getElementById("google-gsi-client");

    if (window.google) {
      // If the SDK is already globally loaded, render the button immediately
      renderGoogleButton();
    } else if (existingScript) {
      // If the script element exists but hasn't completed loading yet, append an event listener
      existingScript.addEventListener("load", renderGoogleButton);
    } else {
      // Create and append the script only if it's completely missing
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.body.appendChild(script);
    }

    // Cleanup: Remove event listeners on component unmount
    return () => {
      const scriptEl = document.getElementById("google-gsi-client");
      if (scriptEl) {
        scriptEl.removeEventListener("load", renderGoogleButton);
      }
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/google`, { token: response.credential });
      localStorage.setItem("olqinsight_token", res.data.token);
      localStorage.setItem("olqinsight_user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, formData);
      localStorage.setItem("olqinsight_token", res.data.token);
      localStorage.setItem("olqinsight_user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container" style={{ maxWidth: "480px", marginTop: "var(--space-xxl)" }}>
      <div className="card card-dossier">
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title">Dossier Access Log-In</h1>
            <span className="badge badge-danger">OLQInsight</span>
          </div>

          <div className="card-body">
            {error && <div className="form-feedback form-feedback-error" style={{ marginBottom: "var(--space-md)" }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Dossier Email</label>
                <input className="form-control" type="email" name="email" required onChange={handleChange} value={formData.email} placeholder="candidate@example.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Verification Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    className="form-control" 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    onChange={handleChange} 
                    value={formData.password} 
                    placeholder="••••••••" 
                    style={{ paddingRight: "50px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-family-technical)",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-secondary)",
                      fontWeight: "700"
                    }}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "var(--space-sm)" }} type="submit" disabled={loading}>
                {loading ? "Authenticating..." : "Authorize Access"}
              </button>
            </form>

            <div style={{ margin: "var(--space-md) 0", textAlign: "center" }} className="tech-text">OR</div>

            {/* Google Sign-In Container Button */}
            <div id="google-btn-container" style={{ width: "100%", display: "flex", justifyContent: "center" }}></div>

            <div style={{ marginTop: "var(--space-lg)", textAlign: "center" }} className="tech-text">
              New Candidate? <Link to="/register" style={{ textDecoration: "underline" }}>Register (15-Day Access Limit)</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;