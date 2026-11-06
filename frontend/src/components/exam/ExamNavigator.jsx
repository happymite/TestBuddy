export default function ExamNavigator({
  questions,
  currentIndex,
  answers = {},
  saveStatus = {},
  reviewMarks = {},
  visited = {},
  onSelectIndex,
}) {
  return (
    <div className="navigator">
      {questions.map((q, i) => {
        const classes = ["nav-dot"];
        const isAnswered = Boolean(answers[q.id]);
        const isReview = Boolean(reviewMarks[q.id]);
        const isVisited = Boolean(visited[q.id]);

        if (isReview) {
          classes.push("review");
        } else if (isAnswered) {
          classes.push("answered");
        } else if (isVisited) {
          classes.push("unanswered");
        }

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
