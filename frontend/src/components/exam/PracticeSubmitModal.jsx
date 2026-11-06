export default function PracticeSubmitModal({
  isOpen,
  total,
  answeredCount,
  unansweredCount,
  reviewCount,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="cbt-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="cbt-modal-card">
        <h2 id="modal-title" style={{ margin: "0 0 0.5rem", fontSize: "1.35rem" }}>
          Confirm Assessment Submission
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 1.25rem" }}>
          Are you sure you want to finish and submit? Answers cannot be changed after submission.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "0.85rem", background: "var(--bg-surface-elevated)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, display: "block" }}>{total}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>Total Questions</span>
          </div>
          <div style={{ padding: "0.85rem", background: "var(--success-bg)", borderRadius: "var(--radius-sm)", textAlign: "center", color: "var(--success-text)" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, display: "block" }}>{answeredCount}</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Answered</span>
          </div>
          <div style={{ padding: "0.85rem", background: "#fee2e2", borderRadius: "var(--radius-sm)", textAlign: "center", color: "#b91c1c" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, display: "block" }}>{unansweredCount}</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Unanswered</span>
          </div>
          <div style={{ padding: "0.85rem", background: "#fef3c7", borderRadius: "var(--radius-sm)", textAlign: "center", color: "#b45309" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, display: "block" }}>{reviewCount}</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Marked for Review</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button type="button" className="secondary" onClick={onCancel}>
            Return to Exam
          </button>
          <button type="button" onClick={onConfirm} style={{ fontWeight: 700 }}>
            Yes, Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}

