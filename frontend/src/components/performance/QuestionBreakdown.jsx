// QuestionBreakdown — per-question analysis list
// questions: array of { question_id, question_order, question_text,
//   option_a/b/c/d, correct_option, max_marks, marks_awarded,
//   selected_option, status ('correct'|'incorrect'|'unanswered') }

import { useState } from "react";

const OPTION_LABELS = { A: "A", B: "B", C: "C", D: "D" };

function optionLabel(key, q) {
  if (!key) return null;
  return `${OPTION_LABELS[key]}: ${q[`option_${key.toLowerCase()}`] || key}`;
}

export default function QuestionBreakdown({ questions }) {
  const [filter, setFilter] = useState("all");

  if (!questions || questions.length === 0) {
    return <p className="perf-empty">No question data available.</p>;
  }

  const counts = {
    all: questions.length,
    correct: questions.filter((q) => q.status === "correct").length,
    incorrect: questions.filter((q) => q.status === "incorrect").length,
    unanswered: questions.filter((q) => q.status === "unanswered").length,
  };

  const filtered = questions.filter((q) => filter === "all" || q.status === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "correct", label: `Correct (${counts.correct})` },
          { key: "incorrect", label: `Incorrect (${counts.incorrect})` },
          { key: "unanswered", label: `Skipped (${counts.unanswered})` },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`perf-tab ${filter === f.key ? "active" : ""}`}
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="perf-empty">No questions match this filter.</p>
      ) : (
        <div className="perf-q-list">
          {filtered.map((q, i) => (
            <div key={q.question_id} className={`perf-q-item ${q.status}`}>
              <div className="perf-q-header">
                <span className="perf-q-num">Question {q.question_order ?? i + 1}</span>
                <span className={`perf-q-status-pill ${q.status}`}>
                  {q.status === "correct" ? "Correct" : q.status === "incorrect" ? "Incorrect" : "Not Attempted"}
                </span>
              </div>

              <p className="perf-q-text">{q.question_text}</p>

              <div className="perf-q-meta">
                <span>
                  Your answer:{" "}
                  <strong>
                    {q.selected_option ? optionLabel(q.selected_option, q) : "Not attempted"}
                  </strong>
                </span>
                <span>
                  Correct answer:{" "}
                  <strong>{optionLabel(q.correct_option, q)}</strong>
                </span>
                <span>
                  Marks:{" "}
                  <strong>
                    {Number(q.marks_awarded)} / {q.max_marks}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

