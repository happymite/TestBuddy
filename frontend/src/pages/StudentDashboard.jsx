import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

// Display only. The browser clock can be wrong, so the server decides
// whether you may actually start (it answers 403 if not).
function scheduleLabel(exam) {
  const now = Date.now();
  if (exam.starts_at && new Date(exam.starts_at).getTime() > now) {
    return `Opens ${formatDate(exam.starts_at)}`;
  }
  if (exam.ends_at && new Date(exam.ends_at).getTime() <= now) {
    return `Closed ${formatDate(exam.ends_at)}`;
  }
  if (exam.ends_at) return `Open until ${formatDate(exam.ends_at)}`;
  return "Open anytime";
}

function ExamCard({ exam }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    const ok = window.confirm(
      "Starting begins the timer right away and it cannot be paused. " +
        "If you already have a running attempt, this resumes it. Continue?",
    );
    if (!ok) return;

    setError("");
    setStarting(true);
    try {
      const data = await startAttempt(exam.id);
   navigate(`/attempts/${data.attempt.id}/take`);
    } catch (err) {
      // Includes the server's "not started yet" / "has ended" messages.
      setError(err.message);
      setStarting(false);
    }
  }

  return (
    <article className="exam-card">
      <h2>{exam.title}</h2>
      {exam.description && <p className="exam-desc">{exam.description}</p>}
      <ul className="exam-meta">
        <li>{exam.duration_minutes} minutes</li>
        <li>{exam.total_marks} marks</li>
        <li>{scheduleLabel(exam)}</li>
      </ul>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button onClick={handleStart} disabled={starting}>
        {starting ? "Starting..." : "Start / Resume"}
      </button>
    </article>
  );
}

export default function StudentDashboard() {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getPublishedExams(page)
      .then((data) => {
        if (cancelled) return;
        setExams(data.exams);
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
  }, [page, reloadKey]);

  function goToPage(next) {
    setLoading(true);
    setError("");
    setPage(next);
  }

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  return (
    <div>
      <h1>Available exams</h1>

      {loading && <p>Loading exams...</p>}

      {error && (
        <div>
          <p className="error" role="alert">
            {error}
          </p>
          <button onClick={retry}>Try again</button>
        </div>
      )}

      {!loading && !error && exams.length === 0 && (
        <p>No exams are published yet.</p>
      )}

      {!loading &&
        !error &&
        exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}

      {!loading && !error && pagination && pagination.totalPages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}