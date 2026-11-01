export default function AdminStats({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: "Total Exams", value: stats.totalExams, color: "var(--primary)" },
    { label: "Published Tests", value: stats.publishedExams, color: "var(--success-text)" },
    { label: "Total Attempts", value: stats.totalAttempts, color: "var(--text-main)" },
    { label: "Enrolled Students", value: stats.totalStudents, color: "var(--primary)" },
    { label: "Administrators", value: stats.totalAdmins, color: "var(--text-main)" },
  ];

  return (
    <div className="admin-stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="admin-stat-card">
          <span className="admin-stat-value" style={{ color: c.color }}>
            {c.value ?? 0}
          </span>
          <span className="admin-stat-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
