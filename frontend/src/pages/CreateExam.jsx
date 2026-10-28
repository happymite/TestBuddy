import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { createExam } from "../api/teacher.js";
import { getMySubjects, createSubject } from "../api/subject.js";

export default function CreateExam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubjectId = searchParams.get("subjectId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessMode, setAccessMode] = useState("graded");
  const [subjectId, setSubjectId] = useState(preselectedSubjectId);
  const [subjects, setSubjects] = useState([]);

  // Inline quick-add subject state
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectAddError, setSubjectAddError] = useState("");

  // Load the teacher's subjects on mount
  useEffect(() => {
    getMySubjects()
      .then((data) => {
        setSubjects(data.subjects);
        if (preselectedSubjectId) {
          setSubjectId(preselectedSubjectId);
        }
      })
      .catch(() => {});
  }, [preselectedSubjectId]);

  async function handleQuickAddSubject(e) {
    e.preventDefault();
    const name = newSubjectInput.trim();
    if (!name) return;
    setSubjectAddError("");
    setAddingSubject(true);
    try {
      const data = await createSubject(name);
      const created = data.subject;
      setSubjects((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSubjectId(String(created.id)); // Auto-select the newly created subject!
      setNewSubjectInput("");
      setShowAddSubject(false);
    } catch (err) {
      setSubjectAddError(err.message || "Failed to create subject.");
    } finally {
      setAddingSubject(false);
    }
  }

  function validate() {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 200) {
      return "Title is required and must be 200 characters or fewer.";
    }

    if (!subjectId) {
      return "Subject is mandatory. Please select or add a subject for this exam.";
    }

    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      return "Duration must be a whole number between 1 and 180 minutes.";
    }

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return "End time must be after the start time.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await createExam({
        title: title.trim(),
        description: description.trim() || null,
        duration_minutes: Number(duration),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        access_mode: accessMode,
        subject_id: Number(subjectId),
      });
      navigate(`/teacher/exams/${data.exam.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="create-exam-page hero-animate">
      <div className="back-link-wrapper">
        <Link to="/teacher" className="btn-back">
          ← Back to my exams
        </Link>
      </div>

      <div className="form-page-header">
        <span className="section-eyebrow">● Exam Builder</span>
        <h1 className="page-main-title">Create New Exam</h1>
        <p className="page-main-desc">
          Set up exam parameters, pick a subject, and add question items.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">
            Exam Title <span className="required-mark">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. Physics Mid-Term Examination"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Mandatory Subject Selection + Inline Add Option */}
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="subjectId">
              Subject <span className="required-mark">* (Mandatory)</span>
            </label>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => {
                setShowAddSubject((prev) => !prev);
                setSubjectAddError("");
              }}
            >
              {showAddSubject ? "✕ Cancel" : "+ Add New Subject"}
            </button>
          </div>

          {showAddSubject && (
            <div className="inline-add-subject-box">
              <input
                type="text"
                placeholder="New subject name (e.g. Physics, Biology, Economics)…"
                maxLength={100}
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary-sm"
                disabled={addingSubject || !newSubjectInput.trim()}
                onClick={handleQuickAddSubject}
              >
                {addingSubject ? "Adding…" : "Add & Select"}
              </button>
              {subjectAddError && (
                <p className="error error-inline" role="alert">
                  {subjectAddError}
                </p>
              )}
            </div>
          )}

          <select
            id="subjectId"
            required
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">— Select a Subject (Required) —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {subjects.length === 0 && !showAddSubject && (
            <p className="hint-warning">
              ⚠️ No subjects created yet. Click "+ Add New Subject" above to create one.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            rows={3}
            placeholder="Instructions or chapters covered in this exam…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="accessMode">Exam Access</label>
          <select
            id="accessMode"
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
          >
            <option value="graded">Graded — Students must sign in</option>
            <option value="practice">Practice — Guests can participate</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="duration">
            Duration (minutes) <span className="required-mark">*</span>
          </label>
          <input
            id="duration"
            type="number"
            min="1"
            max="180"
            step="1"
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="startsAt">Opens at (optional)</label>
            <input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="endsAt">Closes at (optional)</label>
            <input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <p className="hint">
          Times use your computer's timezone. A student who starts close to the
          closing time gets less than the full duration.
        </p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-submit-main" disabled={submitting}>
          {submitting ? "Creating Exam…" : "Create Exam & Add Questions →"}
        </button>
      </form>
    </div>
  );
}