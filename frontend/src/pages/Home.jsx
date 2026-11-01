import HomeHero from "../components/home/HomeHero.jsx";
import HomePortals from "../components/home/HomePortals.jsx";
import HomeAbout from "../components/home/HomeAbout.jsx";
import HomeCourses from "../components/home/HomeCourses.jsx";
import HomeNoticesContact from "../components/home/HomeNoticesContact.jsx";
import "../styles/home.css";

export default function Home() {
  return (
    <div className="saga-home-root">
      <HomeHero />
      <HomePortals />
      <HomeAbout />
      <HomeCourses />
      <HomeNoticesContact />
    </div>
  );
}
