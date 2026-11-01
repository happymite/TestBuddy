import { CONTACT_PHONE } from "../navData.js";

const COURSES_DATA = [
  {
    id: "c1-8",
    title: "Class I – VIII",
    tag: "Foundation",
    desc: "Comprehensive fundamentals in Mathematics, Science, and English to cultivate strong analytical concepts and study discipline.",
    highlights: ["Concept clarity", "Regular worksheets", "Foundation building"],
  },
  {
    id: "c9-10",
    title: "Class IX – X",
    tag: "Board Preparation",
    desc: "Rigorous preparation tailored for ICSE and CBSE boards, focusing on chapter mastery, numerical problem-solving, and writing skills.",
    highlights: ["Syllabus completion", "Past paper reviews", "Weekly chapter tests"],
  },
  {
    id: "c11-12",
    title: "Class XI – XII",
    tag: "Senior Secondary",
    desc: "In-depth coaching across Physics, Chemistry, Mathematics, and Biology with synchronized board and entrance exam curricula.",
    highlights: ["Theory depth", "Numerical mastery", "Continuous assessment"],
  },
  {
    id: "neet",
    title: "NEET Preparation",
    tag: "Medical Entrance",
    desc: "High-yield NCERT-focused Biology, Physics, and Chemistry test series with speed-accuracy training and full mock simulations.",
    highlights: ["NCERT line-by-line", "Timed OMR mock tests", "Error analysis"],
  },
  {
    id: "jee",
    title: "JEE Preparation",
    tag: "Engineering Entrance",
    desc: "Advanced problem-solving techniques for JEE Main and Advanced with deep conceptual mechanics, calculus, and inorganic chemistry.",
    highlights: ["Multi-concept problems", "CBT simulation", "Rank booster tests"],
  },
  {
    id: "private-batches",
    title: "ICSE & CBSE Private Batches",
    tag: "Special Attention",
    desc: "Personalized small-group coaching designed to address individual student doubts, school syllabus alignment, and score improvement.",
    highlights: ["Small student ratios", "Individual attention", "Direct faculty feedback"],
  },
  {
    id: "competitive",
    title: "Competitive Examination",
    tag: "Aptitude & Olympiads",
    desc: "Specialized training for Science/Math Olympiads, NTSE, and state talent search examinations to sharpen mental aptitude.",
    highlights: ["Logical reasoning", "Competitive temperament", "Advanced mock papers"],
  },
];

export default function HomeCourses() {
  return (
    <section className="saga-section" id="courses">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Structured Academic Programs</h2>
          <p>
            Explore our comprehensive curriculum offerings designed to build solid academic
            foundations and achieve top ranks in competitive examinations.
          </p>
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
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="saga-course-btn"
                  title="Inquire about this batch"
                >
                  Inquire Batch: {CONTACT_PHONE}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
