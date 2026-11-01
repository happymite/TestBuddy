import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ClockIcon, TargetIcon, ArrowRightIcon, BookOpenIcon, TrophyIcon } from "../components/Icons.jsx";
import "./StudentDashboard.css";

function scheduleLabel(exam) {
  const now = Date.now();
  if (exam.starts_at && new Date(exam.starts_at).getTime() > now) {
    return `Opens ${new Date(exam.starts_at).toLocaleDateString()}`;
  }
  if (exam.ends_at && new Date(exam.ends_at).getTime() <= now) {
    return `Closed ${new Date(exam.ends_at).toLocaleDateString()}`;
  }
  return "Available Now";
}

function StudentExamCard({ exam }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    const ok = window.confirm(
      "Starting begins the timer immediately and cannot be paused. Continue?",
    );
    if (!ok) return;

    setError("");
    setStarting(true);
    try {
      const data = await startAttempt(exam.id);
      navigate(`/attempts/${data.attempt.id}/take`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  return (
    <article className="exam-card">
      <div className="exam-card-head">
        <h3>{exam.title}</h3>
        <span className="badge published">{exam.access_mode || "Active"}</span>
      </div>

      {exam.description && <p className="exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li><ClockIcon size={14} /> {exam.duration_minutes} mins</li>
        <li><TargetIcon size={14} /> {exam.total_marks} marks</li>
        <li>{scheduleLabel(exam)}</li>
      </ul>

      {error && <p className="error" role="alert">{error}</p>}

      <button type="button" onClick={handleStart} disabled={starting} className="saga-btn saga-btn-primary">
        <span>{starting ? "Launching Exam..." : "Start Assessment"}</span>
        <ArrowRightIcon size={14} />
      </button>
    </article>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublishedExams(page)
      .then((data) => {
        if (cancelled) return;
        setExams(data.exams || []);
        setPagination(data.pagination);
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
  }, [page]);

  return (
    <div>
      {/* Student Portal Header Banner */}
      <div className="saga-dashboard-banner">
        <div>
          <span className="saga-dashboard-badge">SAGA CITY STUDENT PORTAL</span>
          <h1>Welcome, {user?.name || "Student"}</h1>
          <p>Learn Today. Lead Tomorrow. — Official Academic &amp; Assessment Desk</p>
        </div>
        <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
          <Link to="/study-materials" className="saga-btn saga-btn-outline" style={{ fontSize: "0.85rem", padding: "0.5rem 0.95rem" }}>
            <BookOpenIcon size={15} />
            <span>Study Materials</span>
          </Link>
          <Link to="/results" className="saga-btn saga-btn-outline" style={{ fontSize: "0.85rem", padding: "0.5rem 0.95rem" }}>
            <TrophyIcon size={15} />
            <span>My Results</span>
          </Link>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <h2>Available Examinations</h2>
      </div>

      {loading && <p>Loading your assigned examinations...</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <div className="saga-intro-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            No exams are scheduled right now. Check back shortly or review your study materials.
          </p>
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
        <div className="exams-grid">
          {exams.map((exam) => (
            <StudentExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {!loading && !error && pagination && pagination.totalPages > 1 && (
        <div className="pager" style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
