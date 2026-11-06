import { CONTACT_PHONE } from "../layout/navData.js";
import { PhoneIcon } from "../common/Icons.jsx";

const NOTICES = [
  {
    date: "Active",
    badge: "Assessments",
    title: "Weekly Practice & Test Series Available",
    body: "Subject-wise mock exams are open on the examinations portal for CBSE, ICSE, and foundation batches.",
  },
  {
    date: "Admissions",
    badge: "Batches",
    title: "New Academic Coaching Batches Open",
    body: `Limited batch sizes for personalized coaching. Contact the guidance desk directly at ${CONTACT_PHONE}.`,
  },
];

export default function HomeNoticesContact() {
  return (
    <section className="saga-section saga-section-alt" id="notices">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Academic Notices &amp; Announcements</h2>
          <p>Current test timetables, batch announcements, and portal updates.</p>
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

        {/* Admissions Helpline strip */}
        <div className="saga-helpline-strip">
          <div className="saga-helpline-info">
            <strong className="saga-helpline-title">Academic &amp; Enrollment Inquiries</strong>
            <span className="saga-helpline-desc">
              Guidance Desk: <strong>{CONTACT_PHONE}</strong>
            </span>
          </div>
          <a href={`tel:${CONTACT_PHONE}`} className="saga-btn saga-btn-primary saga-helpline-btn">
            <PhoneIcon size={14} />
            <span>Call {CONTACT_PHONE}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
