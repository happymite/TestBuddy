import { useAuth } from "../context/AuthContext.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>
      <div className="form-card">
        <p>
          Welcome, <strong>{user?.name}</strong> ({user?.email}).
        </p>
        <p className="hint">
          System administration features and user management tools are currently in development.
        </p>
      </div>
    </div>
  );
}