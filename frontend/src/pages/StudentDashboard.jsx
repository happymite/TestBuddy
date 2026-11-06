import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ClockIcon, TargetIcon, ArrowRightIcon, BookOpenIcon, TrophyIcon } from "../components/common/Icons.jsx";
import "./StudentDashboard.css";

function scheduleLabel(exam) {
  const now = Date.now();
  if (exam.starts_at && new Date(exam.starts_at).getTime() > now) {
    return `Opens ${new Date(exam.starts_at).toLocaleDateString()}`;
  }
  if (exam.ends_at && new Date(exam.ends_at).getTime() <= now) {
    return `Closed ${new Date(exam.ends_at).toLocaleDateString()}`;
  }
  return "Available Now";
}

function StudentExamCard({ exam }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!window.confirm("Starting begins the timer immediately. Continue?")) return;
    setError("");
    setStarting(true);
    try {
      const data = await startAttempt(exam.id);
      navigate(`/attempts/${data.attempt.id}/take`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  return (
    <article className="exam-card">
      <div className="exam-card-head">
        <span className="exam-subject-pill">{exam.subject_name || "General"}</span>
        <span className={`badge ${exam.access_mode === "practice" ? "practice" : "published"}`}>
          {exam.access_mode === "practice" ? "Practice" : "Graded"}
        </span>
      </div>
      <h3 className="exam-card-title">{exam.title}</h3>
      {exam.description && <p className="exam-desc">{exam.description}</p>}
      <ul className="exam-meta">
        <li><ClockIcon size={14} /> {exam.duration_minutes} mins</li>
        <li><TargetIcon size={14} /> {exam.total_marks} marks</li>
        <li>{scheduleLabel(exam)}</li>
      </ul>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" onClick={handleStart} disabled={starting} className="saga-btn saga-btn-primary exam-start-btn">
        <span>{starting ? "Launching..." : "Start Assessment"}</span>
        <ArrowRightIcon size={14} />
      </button>
    </article>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getPublishedExams(1, 50)
      .then((data) => { if (!cancelled) { setExams(data.exams || []); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const subjects = useMemo(() => {
    const map = {};
    for (const e of exams) {
      const name = e.subject_name || "General";
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const subj = e.subject_name || "General";
      const matchSubj = selectedSubject === "all" || subj === selectedSubject;
      const matchMode = selectedMode === "all" || e.access_mode === selectedMode;
      return matchSubj && matchMode;
    });
  }, [exams, selectedSubject, selectedMode]);

  return (
    <div className="student-dashboard-wrap">
      {/* Header Banner */}
      <div className="saga-dashboard-banner">
        <div>
          <span className="saga-dashboard-badge">SAGA CITY STUDENT PORTAL</span>
          <h1>Welcome, {user?.name || "Student"}</h1>
          <p>Scheduled examinations, practice tests, and performance results.</p>
        </div>
        <div className="dashboard-quick-actions">
          <Link to="/study-materials" className="saga-btn saga-btn-outline quick-link-btn">
            <BookOpenIcon size={15} /> <span>Study Materials</span>
          </Link>
          <Link to="/results" className="saga-btn saga-btn-outline quick-link-btn">
            <TrophyIcon size={15} /> <span>My Results</span>
          </Link>
          <Link to="/performance" className="saga-btn saga-btn-outline quick-link-btn">
            <TargetIcon size={15} /> <span>Performance Analysis</span>
          </Link>
        </div>
      </div>

      {/* Subject & Category Toolbar */}
      <div className="dashboard-filter-section">
        <div className="filter-header-row">
          <div>
            <h2>Assigned Tests &amp; Exams</h2>
            <p className="hint">Organized by academic categories and formats.</p>
          </div>
          <div className="mode-toggle-group">
            <button type="button" className={`mode-btn ${selectedMode === "all" ? "active" : ""}`} onClick={() => setSelectedMode("all")}>
              All ({exams.length})
            </button>
            <button type="button" className={`mode-btn ${selectedMode === "graded" ? "active" : ""}`} onClick={() => setSelectedMode("graded")}>
              Graded
            </button>
            <button type="button" className={`mode-btn ${selectedMode === "practice" ? "active" : ""}`} onClick={() => setSelectedMode("practice")}>
              Practice
            </button>
          </div>
        </div>

        {/* Subject Chips */}
        {subjects.length > 0 && (
          <div className="subject-chips-bar">
            <button type="button" className={`subject-chip ${selectedSubject === "all" ? "active" : ""}`} onClick={() => setSelectedSubject("all")}>
              All Subjects ({exams.length})
            </button>
            {subjects.map((s) => (
              <button key={s.name} type="button" className={`subject-chip ${selectedSubject === s.name ? "active" : ""}`} onClick={() => setSelectedSubject(s.name)}>
                {s.name} ({s.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p>Loading your assigned examinations...</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && filteredExams.length === 0 && (
        <div className="saga-intro-card empty-dashboard-card">
          <p>
            {selectedSubject !== "all" || selectedMode !== "all"
              ? "No exams found in this category. Select another subject."
              : "No exams are scheduled right now. Check back shortly."}
          </p>
        </div>
      )}

      {!loading && !error && filteredExams.length > 0 && (
        <div className="exams-grid">
          {filteredExams.map((exam) => (
            <StudentExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}
