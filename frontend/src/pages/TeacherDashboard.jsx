import { useEffect, useState } from "react";
import { Link } from "react-router";
import { deleteExam, getMyExams } from "../api/teacher.js";
import { createSubject, deleteSubject, getMySubjects } from "../api/subject.js";
import "./TeacherDashboard.css";

const PRESET_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "History",
  "Geography",
  "Economics",
];

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

function getSubjectMeta(name) {
  if (!name) return { icon: "📝", color: "slate" };
  const lower = name.toLowerCase();
  if (lower.includes("math")) return { icon: "📐", color: "indigo" };
  if (lower.includes("chem")) return { icon: "🧪", color: "purple" };
  if (lower.includes("phys")) return { icon: "⚡", color: "amber" };
  if (lower.includes("bio")) return { icon: "🌿", color: "emerald" };
  if (lower.includes("eng")) return { icon: "📖", color: "rose" };
  if (lower.includes("comp") || lower.includes("cs") || lower.includes("it")) {
    return { icon: "💻", color: "teal" };
  }
  if (lower.includes("hist")) return { icon: "🏛️", color: "amber" };
  if (lower.includes("geo")) return { icon: "🌍", color: "emerald" };
  if (lower.includes("econ") || lower.includes("comm") || lower.includes("bus")) {
    return { icon: "📊", color: "blue" };
  }
  if (lower.includes("art") || lower.includes("design")) return { icon: "🎨", color: "rose" };
  if (lower.includes("psych") || lower.includes("soc")) return { icon: "🧠", color: "purple" };
  if (lower.includes("music")) return { icon: "🎵", color: "purple" };

  const colors = ["blue", "indigo", "purple", "emerald", "amber", "rose", "teal"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return {
    icon: "📚",
    color: colors[Math.abs(hash) % colors.length],
  };
}

// Teacher Exam Card
function ExamCard({ exam, copiedExamId, deletingExamId, onCopy, onDelete }) {
  return (
    <article className="teacher-exam-card">
      <div className="teacher-card-topbar">
        <span className={`exam-status-pill ${exam.is_published ? "published" : "draft"}`}>
          {exam.is_published ? "🟢 Published" : "🟡 Draft"}
        </span>
        <span className="exam-mode-pill">
          {exam.access_mode === "practice" ? "🌐 Practice" : "🔒 Graded"}
        </span>
      </div>

      <h4 className="teacher-exam-title">{exam.title}</h4>
      {exam.description && <p className="teacher-exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li>⏱️ {exam.duration_minutes} min</li>
        <li>
          ❓ {exam.question_count} {exam.question_count === 1 ? "question" : "questions"}
        </li>
        <li>
          🎯 {exam.is_published ? `${exam.total_marks} marks` : "Draft marks"}
        </li>
        <li>📅 {scheduleLabel(exam)}</li>
      </ul>

      <div className="teacher-card-actions">
        <Link
          to={`/teacher/exams/${exam.id}`}
          className="btn-card-action primary"
        >
          {exam.is_published ? "View questions" : "Add questions →"}
        </Link>
        {exam.is_published && (
          <>
            <button
              type="button"
              className={`btn-card-action secondary ${copiedExamId === exam.id ? "copied" : ""}`}
              onClick={() => onCopy(exam)}
            >
              {copiedExamId === exam.id ? "✓ Copied!" : "📋 Copy link"}
            </button>
            <Link
              to={`/teacher/exams/${exam.id}/results`}
              className="btn-card-action secondary"
            >
              📊 Results
            </Link>
          </>
        )}
        <button
          type="button"
          className="btn-card-action danger"
          onClick={() => onDelete(exam)}
          disabled={deletingExamId === exam.id}
          title="Delete exam"
        >
          {deletingExamId === exam.id ? "Deleting…" : "🗑️ Delete"}
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

  // Subject management state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");

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

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setError("");
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  function triggerNotice(msg) {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(""), 3000);
  }

  // ---- Subject Actions ----
  async function handleAddSubject(e) {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    setSubjectError("");
    setAddingSubject(true);
    try {
      const data = await createSubject(name);
      setSubjects((prev) =>
        [...prev, data.subject].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewSubjectName("");
      triggerNotice(`Subject "${name}" added successfully!`);
    } catch (err) {
      setSubjectError(err.message || "Failed to add subject.");
    } finally {
      setAddingSubject(false);
    }
  }

  async function handleQuickAddPreset(name) {
    setSubjectError("");
    setAddingSubject(true);
    try {
      const data = await createSubject(name);
      setSubjects((prev) =>
        [...prev, data.subject].sort((a, b) => a.name.localeCompare(b.name))
      );
      triggerNotice(`Subject "${name}" added! It now appears on student dashboard.`);
    } catch (err) {
      setSubjectError(err.message || `Failed to add ${name}.`);
    } finally {
      setAddingSubject(false);
    }
  }

  async function handleDeleteSubject(subject) {
    if (
      !window.confirm(
        `Delete subject "${subject.name}"? Any exams inside it will become uncategorised.`
      )
    ) {
      return;
    }
    setDeletingSubjectId(subject.id);
    try {
      await deleteSubject(subject.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      setExams((prev) =>
        prev.map((e) =>
          e.subject_id === subject.id
            ? { ...e, subject_id: null, subject_name: null }
            : e
        )
      );
      triggerNotice(`Subject "${subject.name}" removed.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingSubjectId(null);
    }
  }

  // ---- Exam Actions ----
  async function handleDeleteExam(exam) {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    setError("");
    setDeletingExamId(exam.id);
    try {
      await deleteExam(exam.id);
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      triggerNotice(`Exam "${exam.title}" deleted.`);
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

  // ---- Group Exams by Subject ----
  const grouped = new Map();
  grouped.set(null, []); // uncategorised bucket
  for (const s of subjects) grouped.set(s.id, []);
  for (const exam of exams) {
    const key = exam.subject_id ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(exam);
  }

  const examCardProps = {
    copiedExamId,
    deletingExamId,
    onCopy: handleCopyLink,
    onDelete: handleDeleteExam,
  };

  const publishedCount = exams.filter((e) => e.is_published).length;
  const draftCount = exams.length - publishedCount;

  if (loading) {
    return (
      <div className="teacher-loading-container">
        <span className="loading-spinner"></span>
        <p>Loading your teacher workspace…</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* ============================================================
          1. AUTHENTIC DOODLE HERO BANNER (MATCHING STUDENT DASHBOARD)
          ============================================================ */}
      <section className="hero-banner hero-animate">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            TEACHER PORTAL
          </div>
          <h1 className="hero-heading">
            <span className="hero-heading-line-1">Create exams.</span>
            <span className="hero-heading-line-2">Manage subjects.</span>
            <span className="hero-heading-line-3">Empower students.</span>
          </h1>
          <p className="hero-subtitle">
            Design focused assessments, organize them under dedicated subjects,
            and monitor real-time exam performance.
          </p>

          <div className="hero-actions-row">
            <Link to="/teacher/exams/new" className="hero-primary-cta">
              + Create New Exam →
            </Link>
          </div>
        </div>

        {/* Real Live Metrics Card (No Fake Data) */}
        <div className="hero-window-wrapper">
          <div className="hero-window-card teacher-stats-window">
            <div className="window-topbar">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
              <span className="window-title">Workspace Live Stats</span>
            </div>
            <div className="teacher-stats-grid">
              <div className="teacher-stat-cell">
                <span className="stat-label">Total Exams</span>
                <span className="stat-value">{exams.length}</span>
              </div>
              <div className="teacher-stat-cell">
                <span className="stat-label">Published</span>
                <span className="stat-value text-success">{publishedCount}</span>
              </div>
              <div className="teacher-stat-cell">
                <span className="stat-label">Drafts</span>
                <span className="stat-value text-amber">{draftCount}</span>
              </div>
              <div className="teacher-stat-cell">
                <span className="stat-label">Subjects</span>
                <span className="stat-value text-primary">{subjects.length}</span>
              </div>
            </div>
            <div className="window-stats-footer">
              <Link to="/teacher/exams/new" className="window-action-btn">
                + New Assessment →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Notice Toast */}
      {noticeMessage && (
        <div className="toast-notification hero-animate" role="status">
          <span className="toast-icon">✓</span> {noticeMessage}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {/* ============================================================
          2. SUBJECT MANAGEMENT HUB & 1-CLICK PRESETS
          ============================================================ */}
      <section className="subjects-hub-card hero-animate hero-animate-delay-1">
        <div className="subjects-hub-header">
          <div>
            <span className="section-eyebrow">● Subject Control</span>
            <h2 className="subjects-hub-title">Manage Subjects</h2>
            <p className="subjects-hub-desc">
              All exams belong to a subject. Adding subjects here organizes your
              tests and automatically gives students their own dedicated Bento card
              and subject page.
            </p>
          </div>
        </div>

        {/* Custom Subject Input Form */}
        <form className="subject-quick-add-bar" onSubmit={handleAddSubject}>
          <input
            id="new-subject-name"
            type="text"
            placeholder="Type custom subject name (e.g. Physics, History, Robotics)…"
            maxLength={100}
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button
            type="submit"
            className="btn-add-subject"
            disabled={addingSubject || !newSubjectName.trim()}
          >
            {addingSubject ? "Adding…" : "+ Add Subject"}
          </button>
        </form>
        {subjectError && (
          <p className="error error-inline" role="alert">
            {subjectError}
          </p>
        )}

        {/* Fast 1-Click Preset Chips */}
        <div className="subject-presets-wrapper">
          <span className="preset-label">Quick Standard Presets:</span>
          <div className="preset-chips-list">
            {PRESET_SUBJECTS.map((preset) => {
              const existing = subjects.find(
                (s) => s.name.toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  type="button"
                  className={`preset-chip ${existing ? "preset-chip--exists" : ""}`}
                  disabled={addingSubject}
                  onClick={() => {
                    if (existing) {
                      const el = document.getElementById(
                        `subject-box-${existing.id}`
                      );
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    } else {
                      handleQuickAddPreset(preset);
                    }
                  }}
                  title={
                    existing
                      ? `Already added (${preset}). Click to jump down to it.`
                      : `Click to add ${preset}`
                  }
                >
                  {existing ? `✓ ${preset}` : `+ ${preset}`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. SUBJECTS WITH THEIR EXAMS (WRAPPED SECTIONS)
          ============================================================ */}
      <section className="teacher-subjects-list hero-animate hero-animate-delay-2">
        <div className="section-head section-head-row">
          <div>
            <span className="section-eyebrow">● Your Exams by Subject</span>
            <h2 className="section-title">
              Subject Exam Sections ({subjects.length})
            </h2>
            <p className="section-desc">
              Exams are neatly grouped inside their respective subject boxes.
            </p>
          </div>
          <Link to="/teacher/exams/new" className="btn-ghost">
            + Create New Exam →
          </Link>
        </div>

        {subjects.length === 0 && (
          <div className="empty-exams-card">
            <span className="empty-icon">📚</span>
            <h3>No subjects created yet</h3>
            <p>
              Use the quick presets above or type a subject name to get started.
              Once created, you can add exams to it.
            </p>
          </div>
        )}

        {subjects.map((subject) => {
          const subjectExams = grouped.get(subject.id) ?? [];
          const meta = getSubjectMeta(subject.name);

          return (
            <section
              key={subject.id}
              id={`subject-box-${subject.id}`}
              className="teacher-subject-box"
            >
              <div className="teacher-subject-header">
                <div className="teacher-subject-info">
                  <div className={`subject-icon-tile tile-${meta.color}`}>
                    <span>{meta.icon}</span>
                  </div>
                  <div>
                    <div className="subject-title-row">
                      <h3 className="teacher-subject-name">{subject.name}</h3>
                      <span className="subject-exam-count">
                        {subjectExams.length}{" "}
                        {subjectExams.length === 1 ? "exam" : "exams"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="teacher-subject-actions">
                  <Link
                    to={`/teacher/exams/new?subjectId=${subject.id}`}
                    className="btn-create-in-subject"
                  >
                    + Add Exam to {subject.name}
                  </Link>
                  <button
                    type="button"
                    className="btn-delete-subject"
                    onClick={() => handleDeleteSubject(subject)}
                    disabled={deletingSubjectId === subject.id}
                    title="Delete subject"
                  >
                    {deletingSubjectId === subject.id ? "…" : "✕"}
                  </button>
                </div>
              </div>

              {subjectExams.length === 0 ? (
                <div className="subject-empty-state">
                  <span className="empty-sub-icon">{meta.icon}</span>
                  <p className="empty-sub-text">
                    No exams created in <strong>{subject.name}</strong> yet.
                  </p>
                  <Link
                    to={`/teacher/exams/new?subjectId=${subject.id}`}
                    className="btn-empty-create"
                  >
                    + Create First Exam for {subject.name}
                  </Link>
                </div>
              ) : (
                <div className="teacher-exams-grid">
                  {subjectExams.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} {...examCardProps} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* ---- Uncategorised Exams (for legacy exams or unassigned) ---- */}
        {(() => {
          const uncategorised = grouped.get(null) ?? [];
          if (uncategorised.length === 0) return null;

          return (
            <section className="teacher-subject-box teacher-subject-box--uncategorised">
              <div className="teacher-subject-header">
                <div className="teacher-subject-info">
                  <div className="subject-icon-tile tile-slate">
                    <span>📝</span>
                  </div>
                  <div>
                    <div className="subject-title-row">
                      <h3 className="teacher-subject-name">
                        {subjects.length === 0
                          ? "All Exams (Uncategorised)"
                          : "Uncategorised Exams"}
                      </h3>
                      <span className="subject-exam-count">
                        {uncategorised.length}{" "}
                        {uncategorised.length === 1 ? "exam" : "exams"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-exams-grid">
                {uncategorised.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} {...examCardProps} />
                ))}
              </div>
            </section>
          );
        })()}
      </section>
    </div>
  );
}
