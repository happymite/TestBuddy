import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand-wrap">
        <Link to={user ? "/dashboard" : "/login"} className="brand">
          Test Buddy
        </Link>
        {user?.role && (
          <span className={`badge ${user.role}`}>{user.role}</span>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <span>
              {user.name} ({user.email})
            </span>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="button-link secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
              Student Login
            </Link>
            <Link to="/admin/login" className="button-link" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
              Admin Portal
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
