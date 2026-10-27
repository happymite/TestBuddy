const OPTIONS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  number,
  total,
  selected,
  saveStatus,
  disabled,
  onSelect,
  onRetry,
}) {
  return (
    <section className="question-card">
      <p className="question-count">
        Question {number} of {total} · {question.marks}{" "}
        {question.marks === 1 ? "mark" : "marks"}
      </p>

      <h2 className="question-text">{question.question_text}</h2>

      {/* Question-level image (optional) */}
      {question.question_image_url && (
        <img
          src={question.question_image_url}
          alt="Question image"
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "220px",
            objectFit: "contain",
            marginBottom: "0.75rem",
            borderRadius: "6px",
          }}
        />
      )}

      <div className="options" role="radiogroup" aria-label="Answer options">
        {OPTIONS.map((letter) => {
          const optionText = question[`option_${letter.toLowerCase()}`];
          const optionImageUrl = question[`option_${letter.toLowerCase()}_image_url`];

          return (
            <label
              key={letter}
              className={`option${selected === letter ? " selected" : ""}`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={letter}
                checked={selected === letter}
                disabled={disabled}
                onChange={() => onSelect(letter)}
              />
              <span className="option-letter">{letter}.</span>
              {/* Wrap text + image together so they stack vertically */}
              <span className="option-body">
                <span>{optionText}</span>
                {optionImageUrl && (
                  <img
                    src={optionImageUrl}
                    alt={`Option ${letter}`}
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: "160px",
                      objectFit: "contain",
                      marginTop: "6px",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </span>
            </label>
          );
        })}
      </div>

      <p className="save-status" aria-live="polite">
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "Saved"}
        {saveStatus === "failed" && (
          <>
            <span className="error">Not saved.</span>{" "}
            <button onClick={onRetry}>Retry</button>
          </>
        )}
      </p>
    </section>
  );
}