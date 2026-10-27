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

          // 409 = "not submitted yet". Find out why before doing anything.
          const info = await getAttempt(attemptId);
          const att = info.attempt;

          if (att.status === "in_progress" && !att.is_expired) {
            // Still running: this is NOT a result page yet. Go back.
            if (!cancelled) {
              navigate(`/attempts/${attemptId}/take`, { replace: true });
            }
            return;
          }

          if (att.status === "in_progress") {
            // Time ran out and nobody submitted: finalize it now.
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
    return () => {
      cancelled = true;
    };
  }, [attemptId, reloadKey, navigate]);

  if (error) {
    return (
      <div>
        <p className="error" role="alert">
          {error}
        </p>
        <button
          onClick={() => {
            setError("");
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </button>{" "}
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  if (!result) return <p>Loading your result...</p>;

  const auto = result.auto_submitted ?? state?.result?.auto_submitted;
  const percent =
    result.total_marks > 0
      ? Math.round((result.score / result.total_marks) * 100)
      : 0;

  return (
    <div className="result-card">
      <h1>Exam submitted</h1>
      <p className="score">
        {result.score} / {result.total_marks}
      </p>
      <p>{percent}%</p>
      <p>Submitted: {new Date(result.submitted_at).toLocaleString()}</p>
      {auto && (
        <p className="banner">
          This exam was submitted automatically because time ran out.
        </p>
      )}
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  );
}