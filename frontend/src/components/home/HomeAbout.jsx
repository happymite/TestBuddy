import { TargetIcon, BookOpenIcon, CheckIcon } from "../Icons.jsx";

export default function HomeAbout() {
  return (
    <section className="saga-section saga-section-alt" id="about">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Committed to Meaningful Academic Growth</h2>
          <p>
            SAGA CITY is built on the foundations of disciplined learning, transparent assessment,
            and dedicated guidance for every student.
          </p>
        </div>

        {/* Introduction Block */}
        <div className="saga-intro-card" id="about-intro">
          <div className="saga-intro-content">
            <h3>Introduction</h3>
            <p className="saga-intro-text">
              <strong>SAGA CITY</strong> is an educational initiative dedicated to providing quality
              academic guidance, structured learning and systematic examination facilities.
            </p>
            <p className="saga-intro-text">
              Our goal is to create a modern educational platform where students can learn, practise,
              evaluate their performance and continuously improve their academic skills.
            </p>
            <p className="saga-intro-text">
              Through online examinations, chapter-wise tests, model tests, question banks and
              performance analysis, we aim to make education more accessible, effective and
              student-oriented.
            </p>
          </div>
        </div>

        {/* Mission and Vision Grid */}
        <div className="saga-mission-vision-grid">
          <div className="saga-mv-card" id="about-mission">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap">
                <TargetIcon size={20} />
              </div>
              <h3>Our Mission</h3>
            </div>
            <p className="saga-mv-quote">
              &ldquo;To provide quality education, regular assessment and equal learning
              opportunities.&rdquo;
            </p>
            <p className="saga-mv-detail">
              We ensure every enrolled learner has equal access to high-standard instruction,
              comprehensive test series, and timely doubt-clearing sessions.
            </p>
          </div>

          <div className="saga-mv-card" id="about-vision">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap">
                <BookOpenIcon size={20} />
              </div>
              <h3>Our Vision</h3>
            </div>
            <p className="saga-mv-quote">
              &ldquo;To build a platform that empowers students through knowledge, discipline and
              continuous academic development.&rdquo;
            </p>
            <p className="saga-mv-detail">
              We envision cultivating self-motivated, high-achieving scholars capable of excelling in
              school board examinations and premier national entrance competitions.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="saga-why-block" id="about-why">
          <h3 className="saga-why-title">Why Choose SAGA CITY</h3>
          <div className="saga-why-grid">
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap">
                <CheckIcon size={14} />
              </div>
              <div>
                <strong>Systematic Testing Series</strong>
                <p>Weekly, monthly, chapter-wise, and timed live mock tests with instant scoring.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap">
                <CheckIcon size={14} />
              </div>
              <div>
                <strong>Curated Question Banks</strong>
                <p>Categorized by subject with diagrams, model questions, and past year solutions.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap">
                <CheckIcon size={14} />
              </div>
              <div>
                <strong>Tailored Small Batches</strong>
                <p>Dedicated ICSE &amp; CBSE private batches with personal teacher attention.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap">
                <CheckIcon size={14} />
              </div>
              <div>
                <strong>Direct Guidance &amp; Support</strong>
                <p>Personalized performance analysis and active academic counseling desk.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
