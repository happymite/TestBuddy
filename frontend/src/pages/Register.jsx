import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";
import GoogleAuthButton from "../components/common/GoogleAuthButton.jsx";
import { resendVerification } from "../api/auth.js";

export default function Register() {
  const { user, loading, register, googleLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // After registration, switch to "check inbox" state.
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  function validate() {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (cleanName.length < 2 || cleanName.length > 50) {
      return "Name must be between 2 and 50 characters.";
    }
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      return "Please enter a valid email address (e.g. name@student.com).";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (new TextEncoder().encode(password).length > 72) {
      return "Password is too long (maximum 72 bytes).";
    }
    if (password !== confirm) {
      return "Passwords do not match.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      setRegisteredEmail(email.trim().toLowerCase());
      setRegistered(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification(registeredEmail);
      setResendMsg("Verification email sent! Check your inbox.");
    } catch {
      setResendMsg("Could not resend. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setError("");
    await googleLogin(credential);
  }

  if (registered) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Check your inbox</h1>
            <p className="hint">
              We sent a verification link to <strong>{registeredEmail}</strong>.
              Click it to activate your account — the link expires in 30&nbsp;minutes.
            </p>
          </div>

          {resendMsg && (
            <p className="hint" role="status" style={{ color: "var(--color-primary)" }}>
              {resendMsg}
            </p>
          )}

          <button
            className="auth-submit-btn"
            onClick={handleResend}
            disabled={resending}
            style={{ marginTop: "1rem" }}
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>

          <p className="auth-footer" style={{ marginTop: "1.2rem" }}>
            Already verified? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p className="hint">
            Join SAGA CITY to access study materials and assessments
          </p>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Candidate Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
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
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Register"}
          </button>
        </form>

        <GoogleAuthButton
          onCredential={handleGoogleCredential}
          onError={(msg) => setError(msg)}
          text="signup_with"
        />

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
