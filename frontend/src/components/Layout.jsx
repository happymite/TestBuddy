import { Outlet } from "react-router";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">
              <span className="footer-dot"></span> TEST BUDDY
            </span>
            <span className="footer-tagline">
              Simple, focused exam preparation
            </span>
          </div>
          <div className="footer-meta">
            <span>© 2026 TestBuddy. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}