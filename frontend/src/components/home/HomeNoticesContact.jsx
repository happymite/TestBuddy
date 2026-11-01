import { CONTACT_PHONE } from "../navData.js";
import { PhoneIcon } from "../Icons.jsx";

const NOTICES = [
  {
    date: "02 NOV 2026",
    badge: "Important",
    title: "Upcoming Weekly Test Series Scheduled for Class IX, X, XI & XII",
    body: "Please check your student dashboard or examination portal for subject timings and chapter allocations.",
  },
  {
    date: "01 NOV 2026",
    badge: "Admissions",
    title: "New ICSE & CBSE Private Batches Enrollment Open",
    body: `Limited batch sizes for personalized guidance. Call the guidance desk directly at ${CONTACT_PHONE}.`,
  },
  {
    date: "28 OCT 2026",
    badge: "Exam Alert",
    title: "NEET & JEE Foundation Mock Papers Uploaded to Question Bank",
    body: "Students can access model questions and previous year papers inside the study materials portal.",
  },
];

export default function HomeNoticesContact() {
  return (
    <section className="saga-section saga-section-alt" id="notices">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Official Notice Board</h2>
          <p>Stay informed with the latest timetables, exam alerts, and academic notices.</p>
        </div>

        <div className="saga-notices-list">
          {NOTICES.map((n, idx) => (
            <div key={idx} className="saga-notice-card">
              <div className="saga-notice-meta">
                <span className="saga-notice-date">{n.date}</span>
                <span className="saga-notice-badge">{n.badge}</span>
              </div>
              <h3 className="saga-notice-title">{n.title}</h3>
              <p className="saga-notice-body">{n.body}</p>
            </div>
          ))}
        </div>

        {/* Clean Admissions Hotline strip */}
        <div className="saga-helpline-strip">
          <div className="saga-helpline-info">
            <strong className="saga-helpline-title">Need Academic or Enrollment Assistance?</strong>
            <span className="saga-helpline-desc">
              Official Guidance Desk: <strong>{CONTACT_PHONE}</strong>
            </span>
          </div>
          <a href={`tel:${CONTACT_PHONE}`} className="saga-btn saga-btn-primary saga-helpline-btn">
            <PhoneIcon size={14} />
            <span>Call Helpline</span>
          </a>
        </div>
      </div>
    </section>
  );
}
