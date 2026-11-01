import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

export default function NotFound() {
  const { user } = useAuth();
  const target = user ? homePathFor(user.role) : "/login";

  return (
    <div className="form-card" style={{ maxWidth: "480px", margin: "4rem auto", textAlign: "center" }}>
      <h1>404 - Page Not Found</h1>
      <p className="hint" style={{ margin: "1rem 0 1.5rem" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={target} className="button-link">
        Return to {user ? "Dashboard" : "Login"}
      </Link>
    </div>
  );
}

