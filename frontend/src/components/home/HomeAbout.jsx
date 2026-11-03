import { TargetIcon, BookOpenIcon, CheckIcon } from "../Icons.jsx";

export default function HomeAbout() {
  return (
    <section className="saga-section saga-section-alt" id="about">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>About SAGA CITY</h2>
          <p>Quality academic guidance, disciplined learning, and systematic examination facilities.</p>
        </div>

        {/* Introduction */}
        <div className="saga-intro-card" id="about-intro">
          <div className="saga-intro-content">
            <h3>Our Focus</h3>
            <p className="saga-intro-text">
              <strong>SAGA CITY</strong> is an educational initiative dedicated to providing quality
              academic guidance, structured learning, and systematic examination facilities.
              We help students learn, practise, and evaluate their performance through timed online examinations,
              chapter-wise tests, and model question banks.
            </p>
          </div>
        </div>

        {/* Mission and Vision Grid */}
        <div className="saga-mission-vision-grid">
          <div className="saga-mv-card" id="about-mission">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap"><TargetIcon size={18} /></div>
              <h3>Our Mission</h3>
            </div>
            <p className="saga-mv-quote">
              &ldquo;To provide quality education, regular assessment and equal learning opportunities.&rdquo;
            </p>
          </div>

          <div className="saga-mv-card" id="about-vision">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap"><BookOpenIcon size={18} /></div>
              <h3>Our Vision</h3>
            </div>
            <p className="saga-mv-quote">
              &ldquo;To build a platform that empowers students through knowledge, discipline and continuous academic development.&rdquo;
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="saga-why-block" id="about-why">
          <h3 className="saga-why-title">Why Choose SAGA CITY</h3>
          <div className="saga-why-grid">
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Systematic Testing</strong>
                <p>Weekly, monthly, and full mock test series with instant score review.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Curated Question Banks</strong>
                <p>Subject-wise questions, formulas, and past year board papers.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Private Batches</strong>
                <p>Focused ICSE and CBSE batches with individual mentor attention.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Direct Guidance</strong>
                <p>Personalized performance tracking and dedicated doubt-clearing desk.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
