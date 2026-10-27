import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}