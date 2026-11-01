import { Link } from "react-router";

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

export default function TeacherExamCard({
  exam,
  copiedExamId,
  deletingExamId,
  onCopy,
  onDelete,
}) {
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
          disabled={deletingExamId === exam.id}
          onClick={() => onDelete(exam.id, exam.title)}
        >
          {deletingExamId === exam.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

