import { Outlet, useLocation } from "react-router";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="app-shell">
      <Navbar />
      <main className={isHome ? "page-home" : "page"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
