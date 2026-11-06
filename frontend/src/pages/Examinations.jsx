import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ClockIcon, TargetIcon, ArrowRightIcon } from "../components/common/Icons.jsx";
import "./StudentDashboard.css";

export default function Examinations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublishedExams(1)
      .then((data) => {
        if (cancelled) return;
        setExams(data.exams || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStart(examId) {
    if (!user) {
      navigate(`/login?redirect=/attempts/take`);
      return;
    }
    const ok = window.confirm("Starting begins the timer immediately. Continue?");
    if (!ok) return;

    setStartingId(examId);
    try {
      const data = await startAttempt(examId);
      navigate(`/attempts/${data.attempt.id}/take`);
    } catch (err) {
      alert(err.message);
      setStartingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Examinations &amp; Test Series</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            Participate in scheduled live examinations, chapter-wise tests, and mock papers.
          </p>
        </div>
        {!user && (
          <Link to="/login" className="saga-btn saga-btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Student Login to Start
          </Link>
        )}
      </div>

      {loading && <p>Loading published examinations...</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <div className="saga-intro-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <TargetIcon size={36} className="saga-primary-icon" />
          <h3 style={{ marginTop: "1rem" }}>No Scheduled Exams Right Now</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "50ch", margin: "0.5rem auto 1.5rem" }}>
            Admins have not published any open exams at this moment. Please check back shortly or review study materials.
          </p>
          <Link to="/study-materials" className="saga-btn saga-btn-outline">
            Browse Study Materials
          </Link>
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
        <div className="exams-grid">
          {exams.map((exam) => (
            <article key={exam.id} className="exam-card">
              <div className="exam-card-head">
                <h3>{exam.title}</h3>
                <span className="badge published">{exam.access_mode || "Active"}</span>
              </div>

              {exam.description && <p className="exam-desc">{exam.description}</p>}

              <ul className="exam-meta">
                <li><ClockIcon size={14} /> {exam.duration_minutes} mins</li>
                <li><TargetIcon size={14} /> {exam.total_marks} marks</li>
              </ul>

              <button
                type="button"
                className="saga-btn saga-btn-primary"
                style={{ width: "100%", marginTop: "1rem" }}
                onClick={() => handleStart(exam.id)}
                disabled={startingId === exam.id}
              >
                {startingId === exam.id ? "Launching..." : user ? "Start Assessment" : "Login to Start"}
                <ArrowRightIcon size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

