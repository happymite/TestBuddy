import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getExamResults } from "../api/teacher.js";

export default function ExamResults() {
  const { examId } = useParams();

  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getExamResults(examId)
      .then((data) => {
        if (cancelled) return;
        setExam(data.exam);
        // Sort by score descending for rank display.
        // Unsubmitted attempts go to the bottom.
        const sorted = [...data.results].sort((a, b) => {
          if (b.score === null && a.score === null) return 0;
          if (b.score === null) return -1;
          if (a.score === null) return 1;
          return b.score - a.score;
        });
        setResults(sorted);
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

  if (loading) return <p>Loading results...</p>;

  if (error) {
    return (
      <div>
        <p className="error" role="alert">
          {error}
        </p>
        <Link to="/teacher">Back to my exams</Link>
      </div>
    );
  }

  return (
    <div>
      <p>
        <Link to="/teacher">← Back to my exams</Link>
      </p>

      <div className="page-header">
        <h1>Results — {exam.title}</h1>
      </div>

      <ul className="exam-meta">
        <li>Total marks: {exam.total_marks}</li>
        <li>{results.length} attempt{results.length !== 1 ? "s" : ""}</li>
      </ul>

      {results.length === 0 ? (
        <p>No attempts yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Score</th>
                <th>%</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pct =
                  r.total_marks > 0 && r.score !== null
                    ? Math.round((r.score / r.total_marks) * 100)
                    : "—";

                return (
                  <tr key={r.attempt_id}>
                    <td>{i + 1}</td>
                    <td>{r.name ?? r.email ?? "Guest"}</td>
                    <td>{r.candidate_type}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.score !== null
                        ? `${r.score} / ${r.total_marks}`
                        : "—"}
                    </td>
                    <td>{pct !== "—" ? `${pct}%` : "—"}</td>
                    <td>
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
