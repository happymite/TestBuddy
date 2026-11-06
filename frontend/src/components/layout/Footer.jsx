import { Link } from "react-router";
import SagaCityLogo from "../common/SagaCityLogo.jsx";
import { CONTACT_PHONE } from "./navData.js";
import { PhoneIcon, ClockIcon } from "../common/Icons.jsx";
import { MapPinIcon, MailIcon } from "../common/FooterIcons.jsx";
import "../../styles/footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Institution Identity */}
          <div className="footer-col">
            <SagaCityLogo size={32} />
            <p className="footer-brand-desc">
              An educational initiative dedicated to providing quality academic guidance,
              structured learning, and systematic examination facilities for board and competitive
              aspirants.
            </p>
            <span className="footer-motto-tag">Learn Today. Lead Tomorrow.</span>
          </div>

          {/* Column 2: Official Contact & Helpline */}
          <div className="footer-col">
            <h4>Contact &amp; Helpline</h4>
            <ul className="footer-list">
              <li className="footer-list-item">
                <PhoneIcon size={16} />
                <div>
                  <span className="footer-label">Helpline &amp; Admissions</span>
                  <a href={`tel:${CONTACT_PHONE}`} className="footer-hotline-highlight">
                    {CONTACT_PHONE}
                  </a>
                </div>
              </li>
              <li className="footer-list-item">
                <MailIcon size={16} />
                <div>
                  <span className="footer-label">Academic Inquiries</span>
                  <a href="mailto:admissions@sagacity.edu">admissions@sagacity.edu</a>
                </div>
              </li>
              <li className="footer-list-item">
                <ClockIcon size={16} />
                <div>
                  <span className="footer-label">Guidance Desk Hours</span>
                  <span>Mon – Sat: 9:00 AM – 7:00 PM IST</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Campus & Center Location */}
          <div className="footer-col">
            <h4>Campus Center</h4>
            <ul className="footer-list">
              <li className="footer-list-item">
                <MapPinIcon size={16} />
                <div>
                  <strong className="footer-center-name">SAGA CITY Educational Center</strong>
                  <span>Main Academic Coaching &amp; Guidance Desk</span>
                  <span className="footer-center-state">West Bengal, India</span>
                </div>
              </li>
              <li className="footer-list-item">
                <span className="footer-note">
                  • Offline batch admissions, student counseling, and library desk available at the
                  campus center.
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Portal Quick Access */}
          <div className="footer-col">
            <h4>Portal Access</h4>
            <ul className="footer-list">
              <li className="footer-list-item">
                <Link to="/login">• Candidate Login</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/examinations">• Examination Portal</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/results">• Candidate Results</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/admin/login">• Faculty &amp; Admin Desk</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span>© 2026 SAGA CITY. All rights reserved.</span>
          <span className="footer-motto-bar">LEARN • PRACTICE • EVALUATE • EXCEL</span>
          <div className="footer-legal-links">
            <span className="footer-legal-item">Academic Guidelines</span>
            <span className="footer-legal-item">Honor Code</span>
            <span className="footer-legal-item">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
