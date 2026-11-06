import { Navigate, Outlet } from "react-router";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) return <div className="page"><p>Verifying Admin Session...</p></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}

