import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { getAttempt, getResult, submitAttempt } from "../api/attempt.js";

export default function ExamResult() {
  const { attemptId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let data;
        try {
          data = await getResult(attemptId);
        } catch (err) {
          if (err.status !== 409) throw err;

          const info = await getAttempt(attemptId);
          const att = info.attempt;

          if (att.status === "in_progress" && !att.is_expired) {
            if (!cancelled) navigate(`/attempts/${attemptId}/take`, { replace: true });
            return;
          }

          if (att.status === "in_progress") {
            try {
              await submitAttempt(attemptId);
            } catch (e) {
              if (e.code !== "ATTEMPT_ALREADY_ENDED") throw e;
            }
          }

          data = await getResult(attemptId);
        }

        if (!cancelled) setResult(data.result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [attemptId, reloadKey, navigate]);

  if (error) {
    return (
      <div className="result-card">
        <p className="error" role="alert">{error}</p>
        <button onClick={() => { setError(""); setReloadKey((k) => k + 1); }}>
          Try again
        </button>{" "}
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  if (!result) return <div className="result-card"><p>Loading your result...</p></div>;

  const auto = result.auto_submitted ?? state?.result?.auto_submitted;
  const percent =
    result.total_marks > 0
      ? Math.round((result.score / result.total_marks) * 100)
      : 0;

  const scoreColor =
    percent >= 70 ? "var(--color-success, #22c55e)"
    : percent >= 40 ? "var(--color-warn, #eab308)"
    : "var(--color-danger, #ef4444)";

  return (
    <div className="result-card">
      {auto && (
        <p className="banner" role="status">
          Time ran out. This exam was submitted automatically.
        </p>
      )}

      <h1>Exam submitted</h1>

      <div className="result-score-block" style={{ textAlign: "center", margin: "1.5rem 0" }}>
        <p className="score" style={{ color: scoreColor }}>
          {result.score} <span style={{ opacity: 0.5, fontSize: "0.6em" }}>/ {result.total_marks}</span>
        </p>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: scoreColor }}>{percent}%</p>
      </div>

      <ul className="exam-meta" style={{ marginBottom: "1.5rem" }}>
        <li>Submitted: {new Date(result.submitted_at).toLocaleString()}</li>
        {result.auto_submitted && <li>Auto-submitted when timer expired</li>}
      </ul>

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/performance" className="button-link">Performance Analysis</Link>
        <Link to="/dashboard" className="button-link secondary">Back to dashboard</Link>
      </div>
    </div>
  );
}
