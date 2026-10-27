import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createExam } from "../api/teacher.js";
import { getMySubjects } from "../api/subject.js";

export default function CreateExam() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessMode, setAccessMode] = useState("graded");
  const [subjectId, setSubjectId] = useState("");   // "" means no subject
  const [subjects, setSubjects] = useState([]);

  // Load the teacher's subjects once on mount so they can assign one on creation.
  useEffect(() => {
    getMySubjects()
      .then((data) => setSubjects(data.subjects))
      .catch(() => {}); // non-fatal — field just shows empty dropdown
  }, []);

  function validate() {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 200) {
      return "Title is required and must be 200 characters or fewer.";
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
        subject_id: subjectId ? Number(subjectId) : null,
      });
      navigate(`/teacher/exams/${data.exam.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p>
        <Link to="/teacher">Back to my exams</Link>
      </p>
      <h1>Create exam</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Subject picker — only shown if the teacher has at least one subject */}
        <div className="field">
          <label htmlFor="subjectId">Subject (optional)</label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">— No subject / Uncategorised —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {subjects.length === 0 && (
            <span className="hint">
              Create a subject on the dashboard first to organise your exams.
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="accessMode">Exam access</label>
          <select
            id="accessMode"
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
          >
            <option value="graded">Graded — students must sign in</option>
            <option value="practice">Practice — guests can participate</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="duration">Duration (minutes)</label>
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

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create exam and add questions"}
        </button>
      </form>
    </div>
  );
}