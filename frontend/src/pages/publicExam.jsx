import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getPublicExam, startGuestAttempt } from "../api/guest.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function PublicExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getPublicExam(examId)
      .then((data) => {
        if (cancelled) return;
        setExam(data.exam);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load examination details.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examId]);

  async function handleStart(e) {
    e.preventDefault();
    setStartError("");
    setStarting(true);
    try {
      const data = await startGuestAttempt(examId, guestName.trim() || "Guest");
      // Store the plain-text credential so guestTakeExam can read it
      sessionStorage.setItem(`testbuddy_guest_${data.attempt.id}`, data.credential);
      navigate(`/guest/attempts/${data.attempt.id}/take`);
    } catch (err) {
      setStartError(err.message || "Failed to start the exam. Please try again.");
      setStarting(false);
    }
  }

  if (loading) return <div className="page"><p>Loading examination details...</p></div>;

  if (!exam) {
    return (
      <div className="page">
        <p className="error" role="alert">{error || "Exam not found."}</p>
        <Link to="/" className="button-link secondary">&larr; Back to Home</Link>
      </div>
    );
  }

  const isPractice = exam.access_mode === "practice";

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <p style={{ marginBottom: "1rem" }}>
        <Link to="/examinations">&larr; Back to Examinations</Link>
      </p>

      <div className="form-card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className={`badge ${isPractice ? "student" : "admin"}`}>
            {isPractice ? "Practice Test · Free Access" : "Graded Examination · Login Required"}
          </span>
          {exam.subject_name && <span className="badge">{exam.subject_name}</span>}
        </div>

        <h1 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.75rem" }}>{exam.title}</h1>
        {exam.description && (
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {exam.description}
          </p>
        )}

        <ul className="exam-meta" style={{ marginBottom: "1.5rem" }}>
          <li>⏱ <strong>{exam.duration_minutes} minutes</strong></li>
          <li>📝 <strong>{exam.question_count ?? 0} questions</strong></li>
          <li>🎯 <strong>{exam.total_marks ?? 0} total marks</strong></li>
        </ul>

        <div style={{ background: "var(--bg-surface-elevated)", padding: "1.25rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", border: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Examination Instructions</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            <li>This is a timed practice assessment evaluated instantly in your browser.</li>
            <li>You can move between questions, clear selections, and mark questions for review using the palette.</li>
            <li>Once submitted, you will receive a full breakdown of your score, correct answers, and performance.</li>
          </ul>
        </div>

        {isPractice ? (
          <form onSubmit={handleStart}>
            <div className="field">
              <label htmlFor="guest-name">Candidate / Display Name (optional)</label>
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name for the result summary"
                maxLength={80}
                disabled={starting}
              />
            </div>
            {startError && <p className="error" role="alert" style={{ marginBottom: "0.75rem" }}>{startError}</p>}
            <button type="submit" disabled={starting} style={{ width: "100%", padding: "0.85rem", fontSize: "1.05rem", fontWeight: 700 }}>
              {starting ? "Starting…" : "Start Practice Examination →"}
            </button>
          </form>
        ) : user?.role === "student" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>This is a scheduled graded exam for enrolled students.</p>
            <Link to="/dashboard" className="button-link" style={{ width: "100%", padding: "0.8rem" }}>
              Go to Student Dashboard &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>This is a graded examination. Please sign in with your student credentials to proceed.</p>
            <Link to="/login" className="button-link" style={{ width: "100%", padding: "0.8rem" }}>
              Student Sign In &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
