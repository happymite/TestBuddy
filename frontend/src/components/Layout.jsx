import { Outlet } from "react-router";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}