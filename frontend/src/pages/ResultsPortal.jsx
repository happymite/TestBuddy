import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { TrophyIcon, ChartBarIcon, TargetIcon, UserIcon, ArrowRightIcon } from "../components/common/Icons.jsx";

const PILLARS = [
  { title: "Instant Automated Evaluation", icon: TargetIcon, text: "Exams are scored server-side the moment time expires or the candidate submits." },
  { title: "Question-by-Question Audits", icon: ChartBarIcon, text: "Review correct options, detailed rationales, and diagram solutions immediately." },
  { title: "Cohort Merit Rankings", icon: TrophyIcon, text: "Transparent ranking and percentile computations to monitor competitive growth." },
  { title: "Time & Accuracy Metrics", icon: UserIcon, text: "Analyze speed per question to avoid negative marks and improve time management." },
];

export default function ResultsPortal() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Results &amp; Performance Evaluation</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            Review official examination scores, merit standings, and diagnostic analytics.
          </p>
        </div>
      </div>

      <div className="saga-intro-card" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 750, margin: "0 0 0.5rem" }}>
              {user ? `Candidate Portal: ${user.name}` : "Student Performance Portal"}
            </h2>
            <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: "55ch" }}>
              {user
                ? "Your completed assessment results, accuracy metrics, and merit rankings are recorded in your dashboard."
                : "Log in with your student credentials to view your individual scores, download answer sheets, and view merit positions."}
            </p>
          </div>
          <Link
            to={user ? "/dashboard" : "/login?redirect=/dashboard"}
            className="saga-btn saga-btn-primary"
          >
            <span>{user ? "View My Dashboard Scores" : "Student Login for Results"}</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>

      <div className="saga-results-grid">
        {PILLARS.map((p) => {
          const IconComp = p.icon;
          return (
            <div key={p.title} className="saga-results-card">
              <div className="saga-results-icon-wrap">
                <IconComp size={20} />
              </div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.35rem" }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                {p.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

