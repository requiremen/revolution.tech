import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/signin" : "/register";
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", form.username);
        navigate("/dashboard");
      } else {
        setError(data.msg || "Something went wrong");
      }
    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      {/* Left side — dark branding */}
      <div className="auth-left">
        <div className="auth-left-content animate-fade-in">
          <div className="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#fff" />
              <path d="M12 28V12h6.5c1.8 0 3.2.5 4.2 1.4 1 1 1.5 2.2 1.5 3.8 0 1.1-.3 2-.8 2.8-.5.8-1.3 1.3-2.2 1.6l3.5 6.4h-3.2l-3.1-5.8H15V28h-3zm3-8.4h3.3c1 0 1.8-.3 2.3-.8.5-.5.8-1.2.8-2s-.3-1.5-.8-2c-.5-.5-1.3-.8-2.3-.8H15v5.6z" fill="#111" />
            </svg>
            <span className="brand-name">Revoult</span>
          </div>

          <h1 className="brand-tagline">
            Build apps with AI,<br />
            no code needed.
          </h1>

          <p className="brand-description">
            Describe your idea, and watch it come to life.
            Revoult turns your prompts into fully working web applications.
          </p>

          {/* Floating animated shapes */}
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
      </div>

      {/* Right side — white form */}
      <div className="auth-right">
        <div className={`auth-card ${isLogin ? "animate-card" : "animate-card-register"}`} key={isLogin ? "login" : "register"}>
          <h2 className="auth-title">{isLogin ? "Sign In" : "Create Account"}</h2>
          <p className="auth-subtitle">
            {isLogin ? "Welcome back" : "Get started for free"}
          </p>

          {error && <div className="auth-error animate-shake">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              className={`primary-btn ${loading ? "btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <p className="switch-mode">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={toggleMode} className="link-btn">
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
