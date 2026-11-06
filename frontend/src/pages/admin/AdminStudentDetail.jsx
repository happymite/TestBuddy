import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getAdminStudentDetail } from "../../api/performance.js";
import SummaryCards from "../../components/performance/SummaryCards.jsx";
import QuestionBreakdown from "../../components/performance/QuestionBreakdown.jsx";
import "../../styles/performance.css";

export default function AdminStudentDetail() {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminStudentDetail(examId, studentId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [examId, studentId]);

  if (loading) return <div className="perf-page"><p>Loading student report...</p></div>;
  if (err)     return <div className="perf-page"><p className="error" role="alert">{err}</p></div>;
  if (!data || !data.attempt) {
    return (
      <div className="perf-page">
        <button
          className="perf-back"
          onClick={() => navigate(`/admin/performance?examId=${examId}`)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          ← Back to class overview
        </button>
        <div className="perf-empty">
          <p>No submitted attempt details found for this student.</p>
        </div>
      </div>
    );
  }

  const att = data.attempt;

  const cards = [
    { label: "Student",     value: att.student_name,    variant: ""          },
    { label: "Exam",        value: att.exam_title,      variant: ""          },
    { label: "Score",       value: `${Number(att.score)} / ${Number(att.total_marks)}`, variant: "info" },
    { label: "Percentage",  value: `${att.percent}%`,   variant: Number(att.percent) >= 60 ? "correct" : Number(att.percent) >= 40 ? "warning" : "incorrect" },
    { label: "Correct",     value: att.correct,         variant: "correct"   },
    { label: "Incorrect",   value: att.incorrect,       variant: "incorrect" },
    { label: "Unanswered",  value: att.unanswered,      variant: ""          },
    { label: "Accuracy",    value: `${att.accuracy}%`,  variant: Number(att.accuracy) >= 70 ? "correct" : Number(att.accuracy) >= 40 ? "warning" : "incorrect" },
    ...(att.rank && att.total_ranked > 1
      ? [{ label: "Rank", value: `${att.rank} / ${att.total_ranked}`, variant: "info" }]
      : []),
  ];

  const hasQuestions = data.questions && data.questions.length > 0;

  return (
    <div className="perf-page">
      <button
        className="perf-back"
        onClick={() => navigate(`/admin/performance?examId=${examId}`)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ← Back to class overview
      </button>

      <h1 style={{ marginBottom: "0.25rem" }}>{att.student_name}</h1>
      <p style={{ color: "var(--text-muted,#888)", marginBottom: "1.5rem" }}>
        {att.exam_title} — submitted {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : "—"}
      </p>

      <SummaryCards cards={cards} />

      {hasQuestions ? (
        <>
          <p style={{ color: "var(--text-muted,#888)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {att.correct} correct · {att.incorrect} incorrect · {att.unanswered} not attempted
          </p>
          <QuestionBreakdown questions={data.questions} />
        </>
      ) : (
        <div className="perf-empty">
          <p>Question-level breakdown is not available for this attempt.</p>
          <p style={{ fontSize: "0.85rem" }}>
            This can happen when answers were cleared after auto-grading (guest attempts) or when the exam was not fully answered.
          </p>
        </div>
      )}
    </div>
  );
}

