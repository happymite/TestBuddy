export default function PageLoader({ text = "Loading..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "220px",
        gap: "0.75rem",
        color: "var(--text-muted, #475569)",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "3px solid var(--border-color, #e2e8f0)",
          borderTopColor: "var(--primary, #2563eb)",
          borderRadius: "50%",
          animation: "tb-spin 0.75s linear infinite",
        }}
      />
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{text}</span>
      <style>{`@keyframes tb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

