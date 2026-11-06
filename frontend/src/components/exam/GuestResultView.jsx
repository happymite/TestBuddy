import { Link } from "react-router";
import "../../styles/guest-result.css";

// result = { score, total_marks, auto_submitted, exam_id, breakdown: [...] }
// breakdown = [{ question_text, selected_option, correct_option, is_correct, marks_awarded, marks }]
export default function GuestResultView({ result, examId }) {
  const pct = result.total_marks > 0 ? Math.round((result.score / result.total_marks) * 100) : 0;
  const correct = result.breakdown?.filter((r) => r.is_correct).length ?? 0;
  const wrong = result.breakdown?.filter((r) => !r.is_correct && r.selected_option).length ?? 0;
  const skipped = result.breakdown?.filter((r) => !r.selected_option).length ?? 0;
  const total = result.breakdown?.length ?? 0;

  const grade =
    pct >= 80 ? { label: "Excellent", color: "var(--success-text)" }
    : pct >= 60 ? { label: "Good", color: "var(--primary)" }
    : pct >= 40 ? { label: "Average", color: "#d97706" }
    : { label: "Needs work", color: "var(--danger)" };

  const optionLabel = { A: "A", B: "B", C: "C", D: "D" };

  return (
    <div className="page grv-page">
      <div className="grv-hero">
        <p className="grv-eyebrow">{result.auto_submitted ? "Time expired — auto submitted" : "Test submitted"}</p>
        <h1 className="grv-score">{result.score}<span className="grv-score-denom"> / {result.total_marks}</span></h1>
        <p className="grv-pct" style={{ color: grade.color }}>{pct}% — {grade.label}</p>

        <div className="grv-stats">
          <div className="grv-stat grv-stat--correct">
            <span className="grv-stat-num">{correct}</span>
            <span className="grv-stat-label">Correct</span>
          </div>
          <div className="grv-stat grv-stat--wrong">
            <span className="grv-stat-num">{wrong}</span>
            <span className="grv-stat-label">Wrong</span>
          </div>
          <div className="grv-stat grv-stat--skip">
            <span className="grv-stat-num">{skipped}</span>
            <span className="grv-stat-label">Skipped</span>
          </div>
          <div className="grv-stat">
            <span className="grv-stat-num">{total}</span>
            <span className="grv-stat-label">Total</span>
          </div>
        </div>

        <div className="grv-actions">
          {examId && (
            <Link to={`/exams/${examId}`} className="grv-btn-primary">Retake exam</Link>
          )}
          <Link to="/examinations" className="grv-btn-outline">Browse exams</Link>
        </div>
      </div>

      {result.breakdown?.length > 0 && (
        <section className="grv-breakdown">
          <h2 className="grv-breakdown-title">Question review</h2>
          <ol className="grv-qlist">
            {result.breakdown.map((row, i) => (
              <li key={row.question_id ?? i} className={`grv-qitem ${row.is_correct ? "grv-qitem--correct" : row.selected_option ? "grv-qitem--wrong" : "grv-qitem--skip"}`}>
                <div className="grv-qheader">
                  <span className="grv-qnum">Q{i + 1}</span>
                  <span className="grv-qstatus">
                    {row.is_correct ? `+${row.marks_awarded} mark${row.marks_awarded !== 1 ? "s" : ""}` : row.selected_option ? "Wrong" : "Skipped"}
                  </span>
                </div>
                <p className="grv-qtext">{row.question_text}</p>
                <div className="grv-opts">
                  {["A", "B", "C", "D"].map((opt) => {
                    const isCorrect = opt === row.correct_option;
                    const isChosen = opt === row.selected_option;
                    let cls = "grv-opt";
                    if (isCorrect) cls += " grv-opt--correct";
                    else if (isChosen && !isCorrect) cls += " grv-opt--wrong";
                    return (
                      <span key={opt} className={cls}>
                        <span className="grv-opt-letter">{optionLabel[opt]}</span>
                        {isCorrect && !isChosen && <span className="grv-opt-tag">Correct answer</span>}
                        {isChosen && isCorrect && <span className="grv-opt-tag">Your answer ✓</span>}
                        {isChosen && !isCorrect && <span className="grv-opt-tag">Your answer ✗</span>}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

