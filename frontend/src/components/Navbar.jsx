import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

function getInitialTheme() {
  try {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("tb-theme", next); } catch {}
    setTheme(next);
  }

  return (
    <header className="navbar">
      <Link to={homePathFor(user.role)} className="brand">
        Test Buddy
      </Link>
      <div className="navbar-right">
        <span className="user-label">
          {user.name}
        </span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button className="btn-ghost" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}