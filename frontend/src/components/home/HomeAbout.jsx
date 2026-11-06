import { TargetIcon, BookOpenIcon, CheckIcon } from "../common/Icons.jsx";

export default function HomeAbout() {
  return (
    <section className="saga-section saga-section-alt" id="about">
      <div className="saga-container">
        <div className="saga-section-head">
          <h2>Academic Standards &amp; Approach</h2>
          <p>Structured curriculum, regular testing, and personalized student guidance.</p>
        </div>

        {/* Introduction */}
        <div className="saga-intro-card" id="about-intro">
          <div className="saga-intro-content">
            <h3>About SAGA CITY</h3>
            <p className="saga-intro-text">
              <strong>SAGA CITY</strong> is an academic coaching and online testing platform.
              We support students across CBSE, ICSE, and competitive exam tracks with disciplined
              classroom guidance, chapter-wise worksheets, and server-graded online examination facilities.
            </p>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="saga-mission-vision-grid">
          <div className="saga-mv-card" id="about-mission">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap"><TargetIcon size={18} /></div>
              <h3>Structured Curriculum</h3>
            </div>
            <p className="saga-mv-detail">
              Comprehensive chapter coverage tailored to school boards and competitive entrance exams, with regular homework evaluation and problem-solving drills.
            </p>
          </div>

          <div className="saga-mv-card" id="about-vision">
            <div className="saga-mv-header">
              <div className="saga-mv-icon-wrap"><BookOpenIcon size={18} /></div>
              <h3>Continuous Assessment</h3>
            </div>
            <p className="saga-mv-detail">
              Weekly chapter tests, full mock exam series, and immediate scorecard reviews to help students identify weak areas and track growth over time.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="saga-why-block" id="about-why">
          <h3 className="saga-why-title">Why Choose SAGA CITY</h3>
          <div className="saga-why-grid">
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Systematic Testing</strong>
                <p>Timed exams with question navigation palette, mark-for-review, and auto-submission.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Curated Question Banks</strong>
                <p>Subject-wise question banks, formula sheets, and past year examination papers.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Small Batch Sizes</strong>
                <p>Focused group teaching with direct teacher interaction and personal doubt resolution.</p>
              </div>
            </div>
            <div className="saga-why-item">
              <div className="saga-check-icon-wrap"><CheckIcon size={14} /></div>
              <div>
                <strong>Performance Analytics</strong>
                <p>Detailed scorecards with correct answers, time management, and topic-level accuracy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
