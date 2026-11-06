import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { homePathFor } from "../../utils/homePath.js";
import PageLoader from "./PageLoader.jsx";

export default function ProtectedRoute({ role, allowedRoles }) {
  const { user, loading } = useAuth();

  // P3 FIX: Use PageLoader instead of plain text — prevents layout flash during auth check.
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const validRoles = allowedRoles || (role === "admin" ? ["admin"] : ["student", "admin"]);
  if (role && !validRoles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}
