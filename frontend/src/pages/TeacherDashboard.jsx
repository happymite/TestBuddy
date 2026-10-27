import { useEffect, useState } from "react";
import { Link } from "react-router";
import { deleteExam, getMyExams } from "../api/teacher.js";
import { createSubject, deleteSubject, getMySubjects } from "../api/subject.js";
import "./TeacherDashboard.css";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function scheduleLabel(exam) {
  if (exam.starts_at && exam.ends_at) {
    return `${formatDate(exam.starts_at)} → ${formatDate(exam.ends_at)}`;
  }
  if (exam.starts_at) return `Opens ${formatDate(exam.starts_at)}`;
  if (exam.ends_at) return `Closes ${formatDate(exam.ends_at)}`;
  return "Open anytime";
}

// ExamCard is a pure presentational component — no state.
function ExamCard({ exam, copiedExamId, deletingExamId, onCopy, onDelete }) {
  return (
    <article className="exam-card">
      <h3>
        {exam.title}
        <span className={`badge${exam.is_published ? " published" : ""}`}>
          {exam.is_published ? "Published" : "Draft"}
        </span>
      </h3>

      {exam.description && <p className="exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li>{exam.duration_minutes} min</li>
        <li>
          {exam.question_count}{" "}
          {exam.question_count === 1 ? "question" : "questions"}
        </li>
        <li>
          {exam.is_published
            ? `${exam.total_marks} marks`
            : "Marks set on publish"}
        </li>
        <li>{scheduleLabel(exam)}</li>
        <li>
          {exam.access_mode === "practice"
            ? "Practice (guests allowed)"
            : "Graded (sign-in required)"}
        </li>
      </ul>

      <div className="card-actions">
        <Link
          to={`/teacher/exams/${exam.id}`}
          className="button-link secondary"
        >
          {exam.is_published ? "View questions" : "Add questions"}
        </Link>
        {exam.is_published && (
          <>
            <button
              type="button"
              className="button-link secondary"
              onClick={() => onCopy(exam)}
            >
              {copiedExamId === exam.id ? "Copied!" : "Copy link"}
            </button>
            <Link
              to={`/teacher/exams/${exam.id}/results`}
              className="button-link secondary"
            >
              View results
            </Link>
          </>
        )}
        <button
          type="button"
          className="button-danger"
          onClick={() => onDelete(exam)}
          disabled={deletingExamId === exam.id}
        >
          {deletingExamId === exam.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingExamId, setDeletingExamId] = useState(null);
  const [copiedExamId, setCopiedExamId] = useState(null);

  // Subject management UI state.
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch exams and subjects in parallel — two independent requests.
    Promise.all([getMyExams(), getMySubjects()])
      .then(([examData, subjectData]) => {
        if (cancelled) return;
        setExams(examData.exams);
        setSubjects(subjectData.subjects);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [reloadKey]);

  function reload() {
    setError("");
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  // ---- Subject actions ----
  async function handleAddSubject(e) {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    setSubjectError("");
    setAddingSubject(true);
    try {
      const data = await createSubject(name);
      setSubjects((prev) => [...prev, data.subject].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubjectName("");
    } catch (err) {
      setSubjectError(err.message);
    } finally {
      setAddingSubject(false);
    }
  }

  async function handleDeleteSubject(subject) {
    if (!window.confirm(`Delete subject "${subject.name}"? Exams inside it will become uncategorised.`)) return;
    setDeletingSubjectId(subject.id);
    try {
      await deleteSubject(subject.id);
      // Remove from list and null out subject_id on affected exams locally.
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      setExams((prev) =>
        prev.map((e) => e.subject_id === subject.id ? { ...e, subject_id: null, subject_name: null } : e),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingSubjectId(null);
    }
  }

  // ---- Exam actions ----
  async function handleDeleteExam(exam) {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    setError("");
    setDeletingExamId(exam.id);
    try {
      await deleteExam(exam.id);
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
    } catch (err) {
      setError(err.message || "Failed to delete the exam.");
    } finally {
      setDeletingExamId(null);
    }
  }

  async function handleCopyLink(exam) {
    const url = `${window.location.origin}/exams/${exam.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedExamId(exam.id);
      setTimeout(() => setCopiedExamId(null), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  // ---- Group exams by subject ----
  // Build a Map: subjectId (or null) → exam[]
  const grouped = new Map();
  grouped.set(null, []); // always have an uncategorised bucket
  for (const s of subjects) grouped.set(s.id, []);
  for (const exam of exams) {
    const key = exam.subject_id ?? null;
    if (!grouped.has(key)) grouped.set(key, []); // safety: unknown subject
    grouped.get(key).push(exam);
  }

  const examCardProps = { copiedExamId, deletingExamId, onCopy: handleCopyLink, onDelete: handleDeleteExam };

  if (loading) return <p>Loading your exams...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>My exams</h1>
        <Link to="/teacher/exams/new" className="button-link">
          Create exam
        </Link>
      </div>

      {error && (
        <div>
          <p className="error" role="alert">{error}</p>
          <button onClick={reload}>Try again</button>
        </div>
      )}

      {/* ---- Subject management ---- */}
      <section className="subjects-section">
        <h2 className="subjects-heading">Subjects</h2>
        <form className="subject-add-form" onSubmit={handleAddSubject}>
          <input
            id="new-subject-name"
            type="text"
            placeholder="New subject name…"
            maxLength={100}
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button type="submit" disabled={addingSubject || !newSubjectName.trim()}>
            {addingSubject ? "Adding…" : "Add subject"}
          </button>
        </form>
        {subjectError && <p className="error" role="alert">{subjectError}</p>}
      </section>

      {/* ---- Subjects with their exams ---- */}
      {subjects.map((subject) => {
        const subjectExams = grouped.get(subject.id) ?? [];
        return (
          <section key={subject.id} className="subject-box">
            <div className="subject-box-header">
              <h2 className="subject-box-title">{subject.name}</h2>
              <span className="subject-exam-count">
                {subjectExams.length} exam{subjectExams.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="subject-delete-btn"
                onClick={() => handleDeleteSubject(subject)}
                disabled={deletingSubjectId === subject.id}
                title="Delete subject"
              >
                {deletingSubjectId === subject.id ? "…" : "✕"}
              </button>
            </div>

            {subjectExams.length === 0 ? (
              <p className="subject-empty">
                No exams yet.{" "}
                <Link to="/teacher/exams/new">Create one</Link> and pick this subject.
              </p>
            ) : (
              <div className="exam-list">
                {subjectExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} {...examCardProps} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* ---- Uncategorised exams ---- */}
      {(() => {
        const uncategorised = grouped.get(null) ?? [];
        if (uncategorised.length === 0 && subjects.length > 0) return null;
        return (
          <section className="subject-box subject-box--uncategorised">
            <div className="subject-box-header">
              <h2 className="subject-box-title">
                {subjects.length === 0 ? "All exams" : "Uncategorised"}
              </h2>
              <span className="subject-exam-count">
                {uncategorised.length} exam{uncategorised.length !== 1 ? "s" : ""}
              </span>
            </div>

            {uncategorised.length === 0 ? (
              <p className="subject-empty">You have not created any exams yet.</p>
            ) : (
              <div className="exam-list">
                {uncategorised.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} {...examCardProps} />
                ))}
              </div>
            )}
          </section>
        );
      })()}
    </div>
  );
}
