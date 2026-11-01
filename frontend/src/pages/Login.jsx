import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { user, loading, login, sessionExpired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Student Login</h1>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Sign in to take assessments and view your scores
      </p>

      {sessionExpired && (
        <p className="error" role="alert">
          Your session expired. Please log in again.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Log in"}
        </button>
      </form>

      <p className="auth-footer">
        Do not have a student account? <Link to="/register">Register here</Link>
      </p>
      <p className="auth-footer" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
        Administrator? <Link to="/admin/login">Admin Console &rarr;</Link>
      </p>
    </div>
  );
}
