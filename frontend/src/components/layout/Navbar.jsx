import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import SagaCityLogo from "../common/SagaCityLogo.jsx";
import { NAV_FLOW, CONTACT_PHONE } from "./navData.js";
import { PhoneIcon } from "../common/Icons.jsx";
import "../../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setIsDark(currentTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("tb-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("tb-theme", "light");
    }
  }

  function handleAnchorClick() {
    setMobileOpen(false);
  }

  return (
    <header className="saga-nav-header">
      <div className="saga-nav-container">
        <Link to="/" className="saga-nav-brand-link">
          <SagaCityLogo size={36} />
        </Link>

        {/* Desktop Navigation Links with Dropdowns */}
        <nav className="saga-nav-links" aria-label="Main Navigation">
          {NAV_FLOW.map((item) => (
            <div key={item.label} className="saga-nav-item">
              <a href={item.href} className="saga-nav-link">
                {item.label}
                {item.items && <span className="saga-chevron" aria-hidden="true">▾</span>}
              </a>
              {item.items && (
                <ul className="saga-dropdown">
                  {item.items.map((sub) => (
                    <li key={sub.label}>
                      <a href={sub.href} className="saga-dropdown-link">
                        {sub.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="saga-nav-actions">
          <a href={`tel:${CONTACT_PHONE}`} className="saga-contact-pill" title="Call SAGA CITY Helpline">
            <PhoneIcon size={14} />
            <span>{CONTACT_PHONE}</span>
          </a>

          <button
            type="button"
            className="saga-theme-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Link to="/dashboard" className="button-link" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                Dashboard
              </Link>
              <button onClick={logout} className="secondary" style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="saga-nav-login-btn">
              Student Login
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="saga-mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Accordion Drawer */}
      {mobileOpen && (
        <div className="saga-mobile-drawer">
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="saga-contact-pill"
            style={{ display: "inline-flex", alignSelf: "flex-start", marginBottom: "0.5rem" }}
          >
            <PhoneIcon size={14} />
            <span>Call: {CONTACT_PHONE}</span>
          </a>

          {NAV_FLOW.map((item) => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a href={item.href} className="saga-nav-link" onClick={handleAnchorClick}>
                  {item.label}
                </a>
                {item.items && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMobileSection(activeMobileSection === item.label ? null : item.label)
                    }
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.4rem" }}
                  >
                    {activeMobileSection === item.label ? "▲" : "▼"}
                  </button>
                )}
              </div>
              {item.items && activeMobileSection === item.label && (
                <div className="saga-mobile-dropdown">
                  {item.items.map((sub) => (
                    <a key={sub.label} href={sub.href} className="saga-dropdown-link" onClick={handleAnchorClick}>
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem" }}>
            <Link to="/login" className="button-link" style={{ flex: 1 }} onClick={handleAnchorClick}>
              Student Login
            </Link>
            <Link to="/admin/login" className="button-link secondary" style={{ flex: 1 }} onClick={handleAnchorClick}>
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
