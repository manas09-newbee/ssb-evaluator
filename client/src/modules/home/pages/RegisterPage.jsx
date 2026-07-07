import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Visibility state

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register`, formData);
      localStorage.setItem("olqinsight_token", res.data.token);
      localStorage.setItem("olqinsight_user", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container" style={{ maxWidth: "480px", marginTop: "var(--space-xxl)" }}>
      <div className="card card-dossier">
        <div className="card-dossier-inner">
          <div className="card-header">
            <h1 className="card-title">Register Account</h1>
            <span className="badge badge-info">OLQInsight</span>
          </div>

          <form onSubmit={handleSubmit} className="card-body">
            {error && <div className="form-feedback form-feedback-error" style={{ marginBottom: "var(--space-md)" }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" type="text" name="name" required onChange={handleChange} value={formData.name} placeholder="e.g. MOHIT SHARMA" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" required onChange={handleChange} value={formData.email} placeholder="e.g. candidate@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  className="form-control" 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  onChange={handleChange} 
                  value={formData.password} 
                  placeholder="Min 8 characters" 
                  minLength="8" 
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

            <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "var(--space-md)" }} type="submit" disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </button>

            <div style={{ marginTop: "var(--space-md)", textAlign: "center" }} className="tech-text">
              Already registered? <Link to="/login" style={{ textDecoration: "underline" }}>Log In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;