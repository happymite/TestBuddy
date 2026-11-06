import { Link } from "react-router";
import { CONTACT_PHONE } from "../layout/navData.js";
import { GraduationCapLogoIcon } from "../common/SagaCityLogo.jsx";
import { PhoneIcon, ArrowRightIcon, CheckIcon, ClockIcon, BookOpenIcon } from "../common/Icons.jsx";

const EXAM_TAGS = [
  "CBSE Class IX–XII",
  "ICSE Batches",
  "NEET Foundation",
  "JEE Main",
  "Class I–VIII Foundation",
  "Weekly Test Series",
];

export default function HomeHero() {
  return (
    <section className="saga-hero-section" id="home">
      <div className="saga-container">
        <div className="saga-hero-split">
          {/* Left Column: Headlines & Actions */}
          <div className="saga-hero-left">
            <div className="saga-hero-badge">
              <GraduationCapLogoIcon size={16} />
              <span>ACADEMIC &amp; EXAMINATION PORTAL</span>
            </div>

            <h1 className="saga-hero-title">
              Academic Coaching &amp; <br />
              <span className="saga-hero-color-lead">Online Examination</span> Portal
            </h1>

            <p className="saga-hero-lead">
              Structured preparation for school boards and entrance tests. Practice timed mock exams, access study materials, and track academic progress.
            </p>

            <div className="saga-hero-cta-group">
              <Link to="/examinations" className="saga-btn saga-btn-primary">
                <span>Browse Examinations</span>
                <ArrowRightIcon size={16} />
              </Link>

              <Link to="/login" className="saga-btn saga-btn-outline">
                <span>Student Portal</span>
              </Link>

              <a href={`tel:${CONTACT_PHONE}`} className="saga-btn saga-btn-outline">
                <PhoneIcon size={16} />
                <span>Call {CONTACT_PHONE}</span>
              </a>
            </div>

            <p className="saga-hero-micro">
              Admissions &amp; Academic Inquiries: <strong>{CONTACT_PHONE}</strong>
            </p>
          </div>

          {/* Right Column: Portal Overview Card */}
          <div className="saga-hero-right">
            <div className="saga-preview-window">
              <div className="saga-preview-header">
                <div className="saga-window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="saga-preview-title">Assessment Engine</span>
                <span className="saga-preview-time">LIVE</span>
              </div>

              <div className="saga-preview-body">
                <div className="saga-rubric-list">
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">
                      <ClockIcon size={14} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                      Timed CBT Exam Interface with Palette
                    </span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> Active</span>
                  </div>
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">
                      <CheckIcon size={14} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                      Instant Server-side Grading &amp; Review
                    </span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> Active</span>
                  </div>
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">
                      <BookOpenIcon size={14} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                      Curated Formula Sheets &amp; Question Banks
                    </span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> Ready</span>
                  </div>
                </div>

                <div className="saga-preview-footer">
                  <div>
                    <span className="saga-feedback-badge">Free Practice Access</span>
                    <div className="saga-feedback-score">No Account Required</div>
                  </div>
                  <Link to="/examinations" className="saga-btn saga-btn-primary saga-preview-btn">
                    Start a Test &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker / Ribbon Chips */}
        <div className="saga-hero-ribbon">
          {EXAM_TAGS.map((tag) => (
            <span key={tag} className="saga-ribbon-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
