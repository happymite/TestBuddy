import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { addQuestion, deleteQuestion, getExamForOwner, publishExam } from "../api/teacher.js";
import QuestionItem from "../components/admin/QuestionItem.jsx";
import QuestionForm from "../components/admin/QuestionForm.jsx";

export default function ManageQuestions() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getExamForOwner(examId)
      .then((data) => {
        if (cancelled) return;
        setExam(data.exam);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [examId, reloadKey]);

  async function handleAdd(form, images) {
    setAdding(true);
    try {
      const nextOrder = questions.length + 1;
      await addQuestion(examId, {
        question_text: form.question_text.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim(),
        option_d: form.option_d.trim(),
        correct_option: form.correct_option,
        marks: Number(form.marks),
        question_order: nextOrder,
        ...images,
      });
      setReloadKey((k) => k + 1);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(question) {
    if (!window.confirm(`Delete question "${question.question_text}"?`)) return;
    try {
      await deleteQuestion(examId, question.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      window.alert(err.message || "Failed to delete question.");
    }
  }

  async function handlePublish() {
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const ok = window.confirm(
      `Publish "${exam.title}" with ${questions.length} question(s) and ${totalMarks} total marks?`
    );
    if (!ok) return;
    setPublishing(true);
    try {
      await publishExam(examId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      window.alert(err.message || "Publish failed.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <div className="page"><p>Loading assessment...</p></div>;
  if (error || !exam) {
    return (
      <div className="page">
        <p className="error" role="alert">{error || "Assessment not found."}</p>
        <Link to="/admin" className="button-link secondary">&larr; Back to Admin Dashboard</Link>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link to="/admin">&larr; Back to Admin Dashboard</Link>
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>
          {exam.title}{" "}
          <span className={`badge ${exam.is_published ? "published" : "secondary"}`}>
            {exam.is_published ? "Published" : "Draft"}
          </span>
        </h1>
        {exam.is_published && (
          <Link to={`/admin/exams/${exam.id}/results`} className="button-link secondary">
            View Candidate Results &rarr;
          </Link>
        )}
      </div>

      {exam.description && <p className="exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li>Duration: {exam.duration_minutes} mins</li>
        <li>{questions.length} questions</li>
        <li>{totalMarks} total marks</li>
        <li>Mode: <strong>{exam.access_mode}</strong></li>
      </ul>

      <h2 style={{ marginTop: "1.5rem" }}>Questions in Assessment</h2>
      {questions.length === 0 ? (
        <p className="empty-state">No questions added yet. Use the form below to add questions.</p>
      ) : (
        <ol className="q-list">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              onDelete={handleDelete}
              isPublished={exam.is_published}
            />
          ))}
        </ol>
      )}

      {!exam.is_published && (
        <>
          <QuestionForm onAddQuestion={handleAdd} isAdding={adding} />
          <div className="form-card" style={{ marginTop: "1.5rem" }}>
            <h2>Publish Assessment</h2>
            <p className="hint">
              {questions.length === 0
                ? "Add at least one question to publish this test."
                : "Publishing makes the test immediately accessible to students."}
            </p>
            <button onClick={handlePublish} disabled={publishing || questions.length === 0}>
              {publishing ? "Publishing..." : "Publish Exam"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
