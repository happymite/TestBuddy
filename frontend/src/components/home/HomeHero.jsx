import { Link } from "react-router";
import { CONTACT_PHONE } from "../navData.js";
import { GraduationCapLogoIcon } from "../SagaCityLogo.jsx";
import { PhoneIcon, ArrowRightIcon, CheckIcon } from "../Icons.jsx";

const EXAM_TAGS = [
  "NEET",
  "JEE Main",
  "JEE Advanced",
  "CBSE Class IX–XII",
  "ICSE Private Batches",
  "Foundation Class I–VIII",
  "Chapter-wise Tests",
  "Weekly Test Series",
  "Monthly Review Mocks",
  "Full Mock Tests",
  "State Boards",
  "Olympiads & NTSE",
];

export default function HomeHero() {
  return (
    <section className="saga-hero-section" id="home">
      <div className="saga-container">
        <div className="saga-hero-split">
          {/* Left Column: Headlines & Actions */}
          <div className="saga-hero-left">
            <div className="saga-hero-badge">
              <GraduationCapLogoIcon size={18} />
              <span>SAGA CITY • ACADEMIC &amp; EXAM PORTAL</span>
            </div>

            <h1 className="saga-hero-title">
              Learn Today. <br />
              <span className="saga-hero-color-lead">Lead Tomorrow.</span>
            </h1>

            <p className="saga-hero-motto">
              LEARN • PRACTISE • EVALUATE • EXCEL
            </p>

            <p className="saga-hero-lead">
              A comprehensive educational initiative dedicated to providing quality academic
              guidance, structured learning, and systematic online examination facilities.
            </p>

            <div className="saga-hero-cta-group">
              <Link to="/login" className="saga-btn saga-btn-primary">
                <span>Enter Student Portal</span>
                <ArrowRightIcon size={16} />
              </Link>

              <a href={`tel:${CONTACT_PHONE}`} className="saga-btn saga-btn-outline">
                <PhoneIcon size={16} />
                <span>Call {CONTACT_PHONE}</span>
              </a>
            </div>

            <p className="saga-hero-micro">
              Official Helpline: <strong>{CONTACT_PHONE}</strong> • Admissions &amp; Enquiries
            </p>
          </div>

          {/* Right Column: High-fidelity Live Evaluation Card */}
          <div className="saga-hero-right">
            <div className="saga-preview-window">
              <div className="saga-preview-header">
                <div className="saga-window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="saga-preview-title">Online Examination • Q14 • Physics</span>
                <span className="saga-preview-time">04:32</span>
              </div>

              <div className="saga-preview-body">
                <p className="saga-preview-q">
                  <strong>Q14.</strong> A convex lens of focal length 20 cm forms a real, inverted image at 60 cm. Calculate object distance and magnification.
                </p>

                <div className="saga-rubric-list">
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">Lens formula: 1/f = 1/v - 1/u</span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> 1/1</span>
                  </div>
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">Object distance: u = -30 cm</span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> 1/1</span>
                  </div>
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">Magnification: m = v/u = -2</span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> 1/1</span>
                  </div>
                  <div className="saga-rubric-item">
                    <span className="saga-rubric-text">Real &amp; inverted verified</span>
                    <span className="saga-rubric-score"><CheckIcon size={12} /> 1/1</span>
                  </div>
                </div>

                <div className="saga-preview-footer">
                  <div>
                    <span className="saga-feedback-badge">Instant Server Evaluation</span>
                    <div className="saga-feedback-score">
                      Score: 4 / 4 Marks
                    </div>
                  </div>
                  <Link to="/examinations" className="saga-btn saga-btn-primary saga-preview-btn">
                    Try Real Test
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
