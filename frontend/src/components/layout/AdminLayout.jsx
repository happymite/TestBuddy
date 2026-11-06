import { Link, Outlet, useNavigate } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import SagaCityLogo from "../common/SagaCityLogo.jsx";

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-app-shell">
      <header className="admin-nav-header">
        <div className="admin-nav-container">
          <div className="admin-nav-brand">
            <Link to="/admin" className="admin-brand-link">
              <SagaCityLogo size={28} />
            </Link>
            <span className="badge admin admin-badge-tag">Admin Console</span>
          </div>

          <nav className="admin-nav-links">
            <Link to="/admin" className="button-link secondary admin-nav-btn">
              Dashboard
            </Link>
            <Link to="/admin/performance" className="button-link secondary admin-nav-btn">
              Performance Analysis
            </Link>
            <Link to="/admin/exams/new" className="button-link admin-nav-btn">
              + New Test
            </Link>
          </nav>

          <div className="admin-nav-right">
            {admin && (
              <span className="admin-user-info" title={admin.email}>
                <span className="admin-user-name">{admin.name}</span>
                <span className="admin-user-email">({admin.email})</span>
              </span>
            )}
            <button onClick={handleLogout} className="secondary admin-logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="page admin-main-page">
        <Outlet />
      </main>
    </div>
  );
}
