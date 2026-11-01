export default function ExamNavigator({
  questions,
  currentIndex,
  answers,
  saveStatus = {},
  onSelectIndex,
}) {
  return (
    <div className="navigator">
      {questions.map((q, i) => {
        const classes = ["nav-dot"];
        if (answers[q.id]) classes.push("answered");
        if (saveStatus[q.id] === "failed") classes.push("failed");
        if (i === currentIndex) classes.push("current");

        return (
          <button
            key={q.id}
            type="button"
            className={classes.join(" ")}
            onClick={() => onSelectIndex(i)}
            aria-label={`Jump to question ${i + 1}`}
            aria-current={i === currentIndex}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

