import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/common/GoogleAuthButton.jsx";
import { resendVerification } from "../api/auth.js";

export default function Login() {
  const { user, loading, login, googleLogin, sessionExpired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setResendMsg("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email.trim().toLowerCase());
      }
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification(unverifiedEmail);
      setResendMsg("Verification email sent! Check your inbox.");
    } catch {
      setResendMsg("Could not resend. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setError("");
    setUnverifiedEmail("");
    await googleLogin(credential);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Student Login</h1>
          <p className="hint">
            Sign in to take assessments and track your performance
          </p>
        </div>

        {sessionExpired && (
          <p className="error" role="alert">
            Your session expired. Please log in again.
          </p>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {unverifiedEmail && (
          <div style={{ marginBottom: "1rem" }}>
            {resendMsg ? (
              <p className="hint" role="status" style={{ color: "var(--color-primary)" }}>
                {resendMsg}
              </p>
            ) : (
              <button
                className="auth-submit-btn"
                onClick={handleResend}
                disabled={resending}
                style={{ width: "100%" }}
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="candidate@student.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        <GoogleAuthButton
          onCredential={handleGoogleCredential}
          onError={(msg) => setError(msg)}
          text="signin_with"
        />

        <p className="auth-footer">
          Do not have a student account? <Link to="/register">Register here</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
          Administrator? <Link to="/admin/login">Admin Console &rarr;</Link>
        </p>
      </div>
    </div>
  );
}
