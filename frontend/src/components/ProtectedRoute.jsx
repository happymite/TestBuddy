import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

export default function ProtectedRoute({ role, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  const validRoles = allowedRoles || (role === "admin" ? ["admin"] : ["student", "admin"]);
  if (role && !validRoles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}
