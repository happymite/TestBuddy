import { useState } from "react";
import { Link } from "react-router";
import { DocumentIcon, FolderIcon, BookOpenIcon, TargetIcon, AtomIcon, FlaskIcon, MathIcon, LeafIcon } from "../components/common/Icons.jsx";

const MATERIALS = [
  { id: 1, title: "Class XII Physics: Electrodynamics & Optics Formula Sheet", subject: "Physics", type: "PDF", icon: AtomIcon },
  { id: 2, title: "Class XI Chemistry: Thermodynamics & Chemical Equilibrium Summary", subject: "Chemistry", type: "Notes", icon: FlaskIcon },
  { id: 3, title: "Calculus & Coordinate Geometry Problem Set with Solutions", subject: "Mathematics", type: "Model Questions", icon: MathIcon },
  { id: 4, title: "NEET High-Yield Human Physiology & Genetics Quick Revision", subject: "Biology", type: "Notes", icon: LeafIcon },
  { id: 5, title: "ICSE Class X Mathematics Model Test Paper 2026", subject: "Mathematics", type: "PDF", icon: MathIcon },
  { id: 6, title: "CBSE Class XII Chemistry Past 5 Years Board Questions (PYQs)", subject: "Chemistry", type: "PYQ", icon: FlaskIcon },
  { id: 7, title: "Mechanics & Laws of Motion Handcrafted Revision Notes", subject: "Physics", type: "Notes", icon: AtomIcon },
  { id: 8, title: "Cell Biology & Ecology Detailed Diagrammatic Guide", subject: "Biology", type: "PDF", icon: LeafIcon },
];

export default function StudyMaterials() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? MATERIALS : MATERIALS.filter((m) => m.subject === filter);

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Study Materials &amp; Question Bank</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            Download faculty-compiled revision notes, formula sheets, model papers, and previous year solutions.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {["All", "Physics", "Chemistry", "Mathematics", "Biology"].map((subj) => (
          <button
            key={subj}
            onClick={() => setFilter(subj)}
            className={filter === subj ? "saga-btn-primary" : "secondary"}
            style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", borderRadius: "9999px" }}
          >
            {subj}
          </button>
        ))}
      </div>

      <div className="saga-sm-grid">
        {filtered.map((item) => {
          const IconComp = item.icon;
          return (
            <article key={item.id} className="saga-sm-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <div className="saga-sm-icon-wrap" style={{ margin: 0 }}>
                  <IconComp size={20} />
                </div>
                <span className="badge" style={{ margin: 0 }}>{item.type}</span>
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>{item.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Subject: {item.subject} • Verified Academic Resource
              </p>
              <Link to="/login" className="saga-sm-link" style={{ marginTop: "auto" }}>
                Access Document in Student Portal →
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

