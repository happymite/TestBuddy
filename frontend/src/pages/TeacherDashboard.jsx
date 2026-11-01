import { useEffect, useState } from "react";
import { Link } from "react-router";
import { deleteExam, getMyExams } from "../api/teacher.js";
import { createSubject, deleteSubject, getMySubjects } from "../api/subject.js";
import TeacherExamCard from "../components/teacher/TeacherExamCard.jsx";
import TeacherSubjectsSection from "../components/teacher/TeacherSubjectsSection.jsx";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingExamId, setDeletingExamId] = useState(null);
  const [copiedExamId, setCopiedExamId] = useState(null);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);

  useEffect(() => {
    let cancelled = false;
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
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      setExams((prev) => prev.map((e) => e.subject_id === subject.id ? { ...e, subject_id: null, subject_name: null } : e));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingSubjectId(null);
    }
  }

  async function handleDeleteExam(examId, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError("");
    setDeletingExamId(examId);
    try {
      await deleteExam(examId);
      setExams((prev) => prev.filter((e) => e.id !== examId));
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
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

  const grouped = new Map([[null, []]]);
  for (const s of subjects) grouped.set(s.id, []);
  for (const exam of exams) {
    const key = exam.subject_id ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(exam);
  }

  const cardProps = { copiedExamId, deletingExamId, onCopy: handleCopyLink, onDelete: handleDeleteExam };
  if (loading) return <p>Loading your exams...</p>;

  const uncategorised = grouped.get(null) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>My exams</h1>
        <Link to="/teacher/exams/new" className="button-link">Create exam</Link>
      </div>

      {error && (
        <div>
          <p className="error" role="alert">{error}</p>
          <button onClick={() => { setError(""); setLoading(true); setReloadKey(k => k + 1); }}>Try again</button>
        </div>
      )}

      <TeacherSubjectsSection
        newSubjectName={newSubjectName}
        setNewSubjectName={setNewSubjectName}
        addingSubject={addingSubject}
        subjectError={subjectError}
        onAddSubject={handleAddSubject}
      />

      {subjects.map((subject) => {
        const subjectExams = grouped.get(subject.id) ?? [];
        return (
          <section key={subject.id} className="subject-box">
            <div className="subject-box-header">
              <h2 className="subject-box-title">{subject.name}</h2>
              <span className="subject-exam-count">{subjectExams.length} exam{subjectExams.length !== 1 ? "s" : ""}</span>
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
              <p className="subject-empty">No exams yet. <Link to="/teacher/exams/new">Create one</Link> and pick this subject.</p>
            ) : (
              <div className="exam-list">
                {subjectExams.map((exam) => <TeacherExamCard key={exam.id} exam={exam} {...cardProps} />)}
              </div>
            )}
          </section>
        );
      })}

      {(uncategorised.length > 0 || subjects.length === 0) && (
        <section className="subject-box subject-box--uncategorised">
          <div className="subject-box-header">
            <h2 className="subject-box-title">{subjects.length === 0 ? "All exams" : "Uncategorised"}</h2>
            <span className="subject-exam-count">{uncategorised.length} exam{uncategorised.length !== 1 ? "s" : ""}</span>
          </div>

          {uncategorised.length === 0 ? (
            <p className="subject-empty">You have not created any exams yet.</p>
          ) : (
            <div className="exam-list">
              {uncategorised.map((exam) => <TeacherExamCard key={exam.id} exam={exam} {...cardProps} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
