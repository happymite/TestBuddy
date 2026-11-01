const LETTERS = ["A", "B", "C", "D"];

function ImagePreview({ src, alt }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{
        display: "block",
        maxWidth: "100%",
        maxHeight: "200px",
        objectFit: "contain",
        marginTop: "8px",
        borderRadius: "var(--radius-sm, 6px)",
      }}
    />
  );
}

export default function QuestionItem({ question, onDelete, isPublished }) {
  return (
    <li className="q-item">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ fontWeight: 600, fontSize: "1rem" }}>{question.question_text}</p>
        <span className="badge secondary">{question.marks} {question.marks === 1 ? "mark" : "marks"}</span>
      </div>

      <ImagePreview src={question.question_image_url} alt="Question figure" />

      <ul className="q-opts" style={{ marginTop: "0.75rem" }}>
        {LETTERS.map((letter) => {
          const optionKey = letter.toLowerCase();
          const isCorrect = question.correct_option === letter;
          return (
            <li key={letter} className={isCorrect ? "correct" : ""}>
              <strong>{letter}.</strong> {question[`option_${optionKey}`]}
              {isCorrect && " ✓"}
              <ImagePreview
                src={question[`option_${optionKey}_image_url`]}
                alt={`Option ${letter} visual`}
              />
            </li>
          );
        })}
      </ul>

      {!isPublished && (
        <button
          type="button"
          className="button-danger"
          style={{ marginTop: "12px", fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
          onClick={() => onDelete(question)}
        >
          Delete Question
        </button>
      )}
    </li>
  );
}
