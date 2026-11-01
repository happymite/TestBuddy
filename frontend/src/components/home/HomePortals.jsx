import { Link } from "react-router";
import { ClockIcon, BookOpenIcon, TrophyIcon, ArrowRightIcon } from "../Icons.jsx";

const PORTALS = [
  {
    id: "exams",
    title: "Online Examination Portal",
    badge: "Live Tests",
    icon: ClockIcon,
    desc: "Participate in real-time scheduled examinations, chapter-wise evaluations, and full mock test series with server-clock precision.",
    to: "/examinations",
    btnText: "Open Examination Portal",
  },
  {
    id: "materials",
    title: "Study Materials & Question Bank",
    badge: "Free Resources",
    icon: BookOpenIcon,
    desc: "Access chapter revision notes, downloadable PDF guides, formula handbooks, and previous year board & entrance questions.",
    to: "/study-materials",
    btnText: "Browse Study Materials",
  },
  {
    id: "results",
    title: "Results & Merit Standings",
    badge: "Analytics",
    icon: TrophyIcon,
    desc: "Inspect automated evaluation scores, question-by-question response breakdowns, and cohort merit rankings.",
    to: "/results",
    btnText: "View Performance & Results",
  },
];

export default function HomePortals() {
  return (
    <section className="saga-section" style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
      <div className="saga-container">
        <div className="saga-portal-grid">
          {PORTALS.map((p) => {
            const IconComp = p.icon;
            return (
              <div key={p.id} className="saga-portal-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div className="saga-portal-icon-wrap">
                    <IconComp size={24} />
                  </div>
                  <span className="saga-portal-badge">{p.badge}</span>
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 750, margin: "0 0 0.5rem" }}>{p.title}</h3>
                <p style={{ fontSize: "0.925rem", color: "var(--text-muted)", lineHeight: 1.55, margin: "0 0 1.5rem", flexGrow: 1 }}>
                  {p.desc}
                </p>
                <Link to={p.to} className="saga-btn saga-btn-outline" style={{ width: "100%", justifyContent: "space-between" }}>
                  <span>{p.btnText}</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

