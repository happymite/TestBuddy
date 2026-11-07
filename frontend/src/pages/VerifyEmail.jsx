import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmail, resendVerification } from "../api/auth.js";

// States: idle | verifying | success | already_verified | expired | invalid | error
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    verifyEmail(token)
      .then((data) => {
        if (data?.alreadyVerified) {
          setStatus("already_verified");
        } else {
          setStatus("success");
        }
      })
      .catch((err) => {
        if (err.code === "TOKEN_EXPIRED") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
      });
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification(resendEmail);
      setResendMsg("Verification email sent! Check your inbox.");
    } catch {
      setResendMsg("Could not send. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === "verifying" && (
          <>
            <div className="auth-header">
              <h1>Verifying…</h1>
              <p className="hint">Please wait while we confirm your email.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="auth-header">
              <h1>Email verified ✓</h1>
              <p className="hint">
                Your account is now active. You can log in.
              </p>
            </div>
            <Link to="/login" className="auth-submit-btn" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
              Go to Login
            </Link>
          </>
        )}

        {status === "already_verified" && (
          <>
            <div className="auth-header">
              <h1>Already verified</h1>
              <p className="hint">Your email is already verified. Log in below.</p>
            </div>
            <Link to="/login" className="auth-submit-btn" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
              Go to Login
            </Link>
          </>
        )}

        {(status === "expired" || status === "invalid") && (
          <>
            <div className="auth-header">
              <h1>
                {status === "expired" ? "Link expired" : "Invalid link"}
              </h1>
              <p className="hint">
                {status === "expired"
                  ? "This verification link has expired (links are valid for 30 minutes). Enter your email to get a new one."
                  : "This link is invalid or has already been used. Request a new one below."}
              </p>
            </div>

            <form onSubmit={handleResend} style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="resend-email">Your email address</label>
                <input
                  id="resend-email"
                  type="email"
                  required
                  placeholder="candidate@student.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={resending}
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
            </form>

            {resendMsg && (
              <p className="hint" role="status" style={{ marginTop: "0.75rem", color: "var(--color-primary)" }}>
                {resendMsg}
              </p>
            )}

            <p className="auth-footer" style={{ marginTop: "1rem" }}>
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="auth-header">
              <h1>Something went wrong</h1>
              <p className="hint">
                We could not verify your email. Please try again or contact support.
              </p>
            </div>
            <p className="auth-footer">
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
