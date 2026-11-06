import { Link } from "react-router";
import {
  AtomIcon,
  FlaskIcon,
  MathIcon,
  LeafIcon,
  TrophyIcon,
  DocumentIcon,
  FolderIcon,
  BookOpenIcon,
  TargetIcon,
} from "../common/Icons.jsx";

const QUESTION_BANKS = [
  { subject: "Physics", icon: AtomIcon, topics: "Mechanics, Electrodynamics, Optics, Thermodynamics, Modern Physics" },
  { subject: "Chemistry", icon: FlaskIcon, topics: "Physical Chemistry, Organic Synthesis, Inorganic Trends & Coordination" },
  { subject: "Mathematics", icon: MathIcon, topics: "Calculus, Vectors, Probability, Algebra, Coordinate Geometry" },
  { subject: "Biology", icon: LeafIcon, topics: "Human Physiology, Genetics & Evolution, Cell Biology, Ecology, Botany" },
  { subject: "Competitive Exams", icon: TrophyIcon, topics: "High-yield mixed problem sets tailored for NEET, JEE & Olympiads" },
];

const STUDY_MATERIALS = [
  {
    type: "Notes",
    icon: DocumentIcon,
    desc: "Concise, concept-driven revision sheets compiled by faculty for swift review before examinations.",
  },
  {
    type: "PDF Resources",
    icon: FolderIcon,
    desc: "Downloadable chapter outlines, formula handbooks, and structured reference documents.",
  },
  {
    type: "Model Questions",
    icon: TargetIcon,
    desc: "Carefully calibrated sample questions demonstrating multi-step problem solving and marking breakdowns.",
  },
  {
    type: "Previous Year Questions",
    icon: BookOpenIcon,
    desc: "Exhaustive archive of board papers and entrance questions categorized chapter-wise with detailed keys.",
  },
];

export default function HomeResources() {
  return (
    <section className="saga-section" id="question-bank">
      <div className="saga-container">
        {/* Question Bank Part */}
        <div className="saga-section-head">
          <h2>Subject-Wise Question Repository</h2>
          <p>
            An extensive bank of curated multiple-choice and conceptual problems designed to
            strengthen speed, accuracy, and confidence.
          </p>
        </div>

        <div className="saga-qb-grid">
          {QUESTION_BANKS.map((qb) => {
            const IconComp = qb.icon;
            return (
              <div key={qb.subject} className="saga-qb-card">
                <div className="saga-qb-icon-wrap">
                  <IconComp size={20} />
                </div>
                <div className="saga-qb-info">
                  <h3>{qb.subject}</h3>
                  <p>{qb.topics}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Study Materials Part */}
        <div className="saga-sm-wrapper" id="study-materials">
          <div className="saga-section-head" style={{ marginTop: "4rem" }}>
            <h2>Comprehensive Learning Resources</h2>
            <p>
              Equip your study routine with faculty-curated reference documents, revision notes, and
              practice papers.
            </p>
          </div>

          <div className="saga-sm-grid">
            {STUDY_MATERIALS.map((sm) => {
              const IconComp = sm.icon;
              return (
                <div key={sm.type} className="saga-sm-card">
                  <div className="saga-sm-icon-wrap">
                    <IconComp size={22} />
                  </div>
                  <h3>{sm.type}</h3>
                  <p>{sm.desc}</p>
                  <Link to="/login" className="saga-sm-link">
                    Access in Portal →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
