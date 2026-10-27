import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathFor } from "../utils/homePath.js";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to={homePathFor(user.role)} className="brand">
        Test Buddy
      </Link>
      <div className="navbar-right">
        <span>
          {user.name} ({user.email})
        </span>
        <button onClick={logout}>Log out</button>
      </div>
    </header>
  );
}