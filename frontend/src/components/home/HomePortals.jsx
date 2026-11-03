import { Link } from "react-router";
import { ClockIcon, BookOpenIcon, TrophyIcon, ArrowRightIcon } from "../Icons.jsx";

const PORTALS = [
  {
    id: "exams",
    title: "Online Examination Portal",
    badge: "Live Tests",
    icon: ClockIcon,
    desc: "Timed scheduled exams, chapter-wise tests, and mock series with server accuracy.",
    to: "/examinations",
    btnText: "Open Exam Portal",
  },
  {
    id: "materials",
    title: "Study Materials & Notes",
    badge: "Free Access",
    icon: BookOpenIcon,
    desc: "Chapter revision notes, formula handbooks, and past year question papers.",
    to: "/study-materials",
    btnText: "Browse Materials",
  },
  {
    id: "results",
    title: "Results & Scorecards",
    badge: "Analytics",
    icon: TrophyIcon,
    desc: "Instant score evaluations, question breakdowns, and performance analytics.",
    to: "/results",
    btnText: "View Results",
  },
];

export default function HomePortals() {
  return (
    <section className="saga-section" style={{ paddingTop: "2rem", paddingBottom: "2.5rem" }}>
      <div className="saga-container">
        <div className="saga-portal-grid">
          {PORTALS.map((p) => {
            const IconComp = p.icon;
            return (
              <div key={p.id} className="saga-portal-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <div className="saga-portal-icon-wrap">
                    <IconComp size={22} />
                  </div>
                  <span className="saga-portal-badge">{p.badge}</span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 750, margin: "0 0 0.4rem" }}>{p.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 1.25rem", flexGrow: 1 }}>
                  {p.desc}
                </p>
                <Link to={p.to} className="saga-btn saga-btn-outline" style={{ width: "100%", justifyContent: "space-between" }}>
                  <span>{p.btnText}</span>
                  <ArrowRightIcon size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
