import { Link, Outlet, useNavigate } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <>
      <header className="navbar" style={{ borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
        <div className="navbar-brand-wrap">
          <Link to="/admin" className="brand" style={{ fontWeight: 700 }}>
            TestBuddy Admin
          </Link>
          <span className="badge admin" style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
            Admin
          </span>
        </div>

        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link to="/admin" className="button-link secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
            Dashboard
          </Link>
          <Link to="/admin/exams/new" className="button-link" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
            + Create Exam
          </Link>
        </nav>

        <div className="navbar-right">
          {admin && (
            <span>
              {admin.name} ({admin.email})
            </span>
          )}
          <button onClick={handleLogout} className="secondary" style={{ fontSize: "0.85rem" }}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

