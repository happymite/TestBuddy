import { CONTACT_PHONE } from "../navData.js";

const COURSES_DATA = [
  {
    id: "c1-8",
    title: "Class I – VIII",
    tag: "Foundation",
    desc: "Foundations in Mathematics, Science, and English to build analytical study discipline.",
    highlights: ["Concept clarity", "Regular worksheets"],
  },
  {
    id: "c9-10",
    title: "Class IX – X",
    tag: "Board Prep",
    desc: "Comprehensive ICSE & CBSE board prep focusing on chapter tests and numerical solving.",
    highlights: ["Syllabus mastery", "Past board papers"],
  },
  {
    id: "c11-12",
    title: "Class XI – XII",
    tag: "Senior Secondary",
    desc: "In-depth coaching in Physics, Chemistry, Math, and Biology for school boards and entrances.",
    highlights: ["Theory depth", "Regular assessments"],
  },
  {
    id: "neet",
    title: "NEET Preparation",
    tag: "Medical Entrance",
    desc: "High-yield NCERT Biology, Chemistry, and Physics test series with speed-accuracy drills.",
    highlights: ["NCERT focus", "Timed mock exams"],
  },
  {
    id: "jee",
    title: "JEE Preparation",
    tag: "Engineering Entrance",
    desc: "Advanced problem solving for JEE Main & Advanced across mechanics, calculus, and chemistry.",
    highlights: ["Multi-concept tests", "Rank booster series"],
  },
  {
    id: "private-batches",
    title: "ICSE & CBSE Batches",
    tag: "Small Groups",
    desc: "Personalized small-group coaching addressing individual student doubts and board syllabus.",
    highlights: ["Small student ratio", "Direct mentor feedback"],
  },
  {
    id: "competitive",
    title: "Competitive Exams",
    tag: "Olympiads",
    desc: "Specialized training for Science/Math Olympiads and NTSE to develop reasoning skills.",
    highlights: ["Logical aptitude", "Advanced practice"],
  },
];

export default function HomeCourses() {
  return (
    <section className="saga-section" id="courses">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Academic Programs &amp; Batches</h2>
          <p>Structured coaching programs designed for school curriculum and entrance examinations.</p>
        </div>

        <div className="saga-courses-grid">
          {COURSES_DATA.map((course) => (
            <article key={course.id} className="saga-course-card">
              <div className="saga-course-badge">{course.tag}</div>
              <h3 className="saga-course-title">{course.title}</h3>
              <p className="saga-course-desc">{course.desc}</p>

              <ul className="saga-course-perks">
                {course.highlights.map((h, idx) => (
                  <li key={idx}>• {h}</li>
                ))}
              </ul>

              <div className="saga-course-footer">
                <a href={`tel:${CONTACT_PHONE}`} className="saga-course-btn" title="Inquire about this batch">
                  Inquire: {CONTACT_PHONE}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
