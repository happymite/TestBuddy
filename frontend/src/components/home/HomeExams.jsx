import { Link } from "react-router";
import {
  ClockIcon,
  DocumentIcon,
  BookOpenIcon,
  CalendarIcon,
  TrophyIcon,
  TargetIcon,
  ArrowRightIcon,
} from "../Icons.jsx";

const EXAM_TYPES = [
  {
    id: "live",
    title: "Live Examination",
    badge: "Synchronized",
    icon: ClockIcon,
    desc: "Strictly scheduled real-time assessments featuring tamper-proof database clocks and instant score computation upon submission.",
  },
  {
    id: "practice",
    title: "Practice Test",
    badge: "Self-Paced",
    icon: DocumentIcon,
    desc: "Casual, untimed or flexible practice rounds enabling candidates to test comprehension immediately after studying a topic.",
  },
  {
    id: "chapter",
    title: "Chapter-wise Test",
    badge: "Topic Mastery",
    icon: BookOpenIcon,
    desc: "Laser-focused tests evaluating individual syllabus units to ensure no conceptual gaps remain before moving forward.",
  },
  {
    id: "weekly",
    title: "Weekly Test",
    badge: "Routine Check",
    icon: CalendarIcon,
    desc: "Mandatory weekend review tests ensuring continuous revision, disciplined consistency, and syllabus retention.",
  },
  {
    id: "monthly",
    title: "Monthly Test",
    badge: "Cumulative",
    icon: TrophyIcon,
    desc: "Comprehensive monthly milestones combining multiple chapters to prepare students for multi-topic exam pressure.",
  },
  {
    id: "mock",
    title: "Full Mock Test",
    badge: "Board & Entrance",
    icon: TargetIcon,
    desc: "Authentic full-syllabus test papers matching board and competitive exam timing, marking schemes, and question weightage.",
  },
];

export default function HomeExams() {
  return (
    <section className="saga-section saga-section-alt" id="examination">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Systematic Assessment &amp; Testing Facilities</h2>
          <p>
            Evaluation is the backbone of academic improvement. Our multifaceted testing engine
            ensures students are tested rigorously across every stage of learning.
          </p>
        </div>

        <div className="saga-exam-grid">
          {EXAM_TYPES.map((exam) => {
            const IconComponent = exam.icon;
            return (
              <div key={exam.id} className="saga-exam-card">
                <div className="saga-exam-card-top">
                  <div className="saga-exam-icon-wrap">
                    <IconComponent size={20} />
                  </div>
                  <span className="saga-exam-badge">{exam.badge}</span>
                </div>
                <h3 className="saga-exam-title">{exam.title}</h3>
                <p className="saga-exam-desc">{exam.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="saga-exam-cta-banner">
          <div>
            <h3>Ready to Test Your Knowledge?</h3>
            <p>Log in with your student credentials to participate in scheduled and practice tests.</p>
          </div>
          <Link to="/login" className="saga-btn saga-btn-primary">
            <span>Enter Student Portal</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
