// StrengthsWeaknesses — data-driven observations from attempt data
// attempt: { correct, incorrect, unanswered, accuracy, percent, attempted }

export default function StrengthsWeaknesses({ attempt }) {
  if (!attempt) return null;

  const { correct, incorrect, unanswered, accuracy, percent, attempted } = attempt;
  const totalQ = correct + incorrect + unanswered;

  const strengths = [];
  const weaknesses = [];

  if (accuracy >= 80) strengths.push(`High accuracy: ${accuracy}% of attempted questions correct.`);
  if (percent >= 70)  strengths.push(`Strong overall score: ${percent}% of total marks.`);
  if (unanswered === 0 && totalQ > 0) strengths.push("All questions attempted — no marks left on the table.");
  if (correct > Math.floor(totalQ * 0.6)) strengths.push(`Correctly answered ${correct} out of ${totalQ} questions.`);
  if (accuracy < 50 && attempted > 0) weaknesses.push(`Low accuracy: only ${accuracy}% of attempted questions correct.`);
  if (percent < 40)   weaknesses.push(`Overall score is below 40% (${percent}%). Focus on weaker areas.`);
  if (unanswered > Math.floor(totalQ * 0.3)) weaknesses.push(`${unanswered} questions unanswered — consider time management.`);
  if (incorrect > correct && attempted > 0) weaknesses.push(`More incorrect (${incorrect}) than correct (${correct}) answers — review negative marking impact.`);

  if (strengths.length === 0 && weaknesses.length === 0) {
    return null;
  }

  return (
    <div className="perf-insights">
      <div className="perf-insight-box strength">
        <h3 style={{ color: "#22c55e" }}>Strengths</h3>
        {strengths.length > 0 ? (
          <ul>{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: 0 }}>
            Complete more exams to identify strengths.
          </p>
        )}
      </div>
      <div className="perf-insight-box weakness">
        <h3 style={{ color: "#ef4444" }}>Areas to improve</h3>
        {weaknesses.length > 0 ? (
          <ul>{weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: 0 }}>
            No critical weaknesses detected. Keep it up!
          </p>
        )}
      </div>
    </div>
  );
}

