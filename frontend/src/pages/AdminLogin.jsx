import { useState } from "react";
import { Navigate } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { admin, loading, loginAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (admin) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
    } catch (err) {
      setError(err.message || "Failed to authenticate administrator.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card" style={{ maxWidth: "420px", marginTop: "4rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Admin Portal</h1>
        <p className="hint">Authorized Administrators Only</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-email">Admin Email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="admin-password">Admin Password</label>
          <input
            id="admin-password"
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

        <button type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Authenticating..." : "Sign in to Admin Console"}
        </button>
      </form>
    </div>
  );
}

