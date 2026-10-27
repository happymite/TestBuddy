import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

export default function Register() {
  const { user, loading, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  function validate() {
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return "Name must be between 2 and 50 characters.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    // bcrypt only uses the first 72 BYTES. Emoji/accents take more than 1 byte.
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
    } catch (err) {
      setError(err.message); // e.g. "An account with this email already exists."
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Create your account</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
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
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}