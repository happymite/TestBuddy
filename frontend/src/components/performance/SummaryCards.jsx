// SummaryCards — reusable stat card grid for performance pages
export default function SummaryCards({ cards }) {
  return (
    <div className="perf-cards">
      {cards.map((c) => (
        <div className="perf-card" key={c.label}>
          <span className="perf-card-label">{c.label}</span>
          <span className={`perf-card-value ${c.variant || ""}`}>{c.value}</span>
          {c.sub && <span style={{ fontSize: "0.75rem", color: "var(--text-muted,#888)" }}>{c.sub}</span>}
        </div>
      ))}
    </div>
  );
}

