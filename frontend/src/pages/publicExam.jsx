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
  const [starting, setStarting] = useState(false);
  const [guestName, setGuestName] = useState("");

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
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examId]);

  async function handleStart() {
    setError("");
    setStarting(true);

    try {
      const data = await startGuestAttempt(examId, guestName);

      // sessionStorage is wiped when the tab closes, and is never put in a URL.
      sessionStorage.setItem(
        `testbuddy_guest_${data.attempt.id}`,
        data.credential,
      );

      navigate(`/guest/attempts/${data.attempt.id}/take`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  if (loading) return <p>Loading exam...</p>;

  if (!exam) {
    return (
      <div>
        <p className="error" role="alert">{error || "Exam not found."}</p>
        <Link to="/">Go to home page</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>{exam.title}</h1>
      {exam.description && <p>{exam.description}</p>}

      <ul className="exam-meta">
        <li>{exam.duration_minutes} minutes</li>
        <li>{exam.question_count} questions</li>
        <li>{exam.total_marks} marks</li>
      </ul>

      {error && <p className="error" role="alert">{error}</p>}

      {exam.access_mode === "practice" ? (
        <div>
          <label htmlFor="guest-name">Your name (required):</label>{" "}
          <input
            id="guest-name"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter your name"
            maxLength={80}
            disabled={starting}
            style={{ marginBottom: "0.5rem" }}
          />
          <br />
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || !guestName.trim()}
          >
            {starting ? "Starting..." : "Start practice exam as guest"}
          </button>
        </div>
      ) : user?.role === "student" ? (
        <p>
          This is a graded exam. Start it from your{" "}
          <Link to="/dashboard">dashboard</Link>.
        </p>
      ) : (
        <p>
          This is a graded exam. <Link to="/login">Log in</Link> to take it.
        </p>
      )}
    </div>
  );
}