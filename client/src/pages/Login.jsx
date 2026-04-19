import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiOutlineShieldCheck, HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { FaGoogle } from "react-icons/fa";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle errors returned by Google OAuth callback redirect
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "google_auth_failed") setError("Google sign-in was cancelled or failed. Please try again.");
    if (oauthError === "google_no_email") setError("Could not retrieve your email from Google. Please use email/password login.");
    if (oauthError === "account_deactivated") setError("Your account has been deactivated. Please contact support.");
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-scaleIn">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineShieldCheck />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your VoteSecure account</p>
        </div>

        {/* Google Sign-in Button */}
        <button
          type="button"
          id="google-signin-btn"
          className="btn-google"
          onClick={googleLogin}
        >
          <FaGoogle className="btn-google-icon" />
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <HiOutlineMail className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? <div className="spinner spinner-sm"></div> : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
