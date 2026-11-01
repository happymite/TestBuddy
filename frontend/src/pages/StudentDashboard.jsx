import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";
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
        <span className="badge">{exam.access_mode || "graded"}</span>
      </div>

      {exam.description && (
        <p className="exam-desc">{exam.description}</p>
      )}

      <ul className="exam-meta">
        <li>{exam.duration_minutes} mins</li>
        <li>{exam.total_marks} marks</li>
        <li>{scheduleLabel(exam)}</li>
      </ul>

      {error && <p className="error" role="alert">{error}</p>}

      <button onClick={handleStart} disabled={starting}>
        {starting ? "Starting..." : "Start Assessment"}
      </button>
    </article>
  );
}

export default function StudentDashboard() {
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
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <h1>Available Exams</h1>
      </div>

      {loading && <p>Loading exams...</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <p className="hint">No exams are published right now. Please check back later.</p>
      )}

      {!loading && !error && exams.length > 0 && (
        <div className="exams-grid">
          {exams.map((exam) => (
            <StudentExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {!loading && !error && pagination && pagination.totalPages > 1 && (
        <div className="pager" style={{ marginTop: '1.5rem' }}>
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
