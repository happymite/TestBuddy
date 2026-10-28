import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getPublishedExams, startAttempt } from "../api/exam.js";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function scheduleLabel(exam) {
  const now = Date.now();
  if (exam.starts_at && new Date(exam.starts_at).getTime() > now) {
    return `Opens ${formatDate(exam.starts_at)}`;
  }
  if (exam.ends_at && new Date(exam.ends_at).getTime() <= now) {
    return `Closed ${formatDate(exam.ends_at)}`;
  }
  if (exam.ends_at) return `Open until ${formatDate(exam.ends_at)}`;
  return "Open anytime";
}

function normalizeSubject(exam) {
  if (exam.subject_name && exam.subject_name.trim()) {
    const raw = exam.subject_name.trim();
    const lower = raw.toLowerCase();
    if (lower.includes("math")) {
      return { id: "maths", name: "Maths", icon: "📐", color: "indigo" };
    }
    if (lower.includes("chem")) {
      return { id: "chemistry", name: "Chemistry", icon: "🧪", color: "purple" };
    }
    if (lower.includes("phys")) {
      return { id: "physics", name: "Physics", icon: "⚡", color: "amber" };
    }
    if (lower.includes("bio")) {
      return { id: "biology", name: "Biology", icon: "🌿", color: "emerald" };
    }
    if (lower.includes("eng")) {
      return { id: "english", name: "English", icon: "📖", color: "rose" };
    }
    if (lower.includes("hist")) {
      return { id: "history", name: "History", icon: "🏛️", color: "amber" };
    }
    if (lower.includes("geo")) {
      return { id: "geography", name: "Geography", icon: "🌍", color: "emerald" };
    }
    if (lower.includes("econ") || lower.includes("comm") || lower.includes("bus")) {
      return { id: "economics", name: "Economics", icon: "📊", color: "blue" };
    }
    if (lower.includes("art") || lower.includes("design")) {
      return { id: "arts", name: "Arts & Design", icon: "🎨", color: "rose" };
    }
    if (lower.includes("psych") || lower.includes("soc") || lower.includes("civ")) {
      return { id: "social-studies", name: raw, icon: "🧠", color: "purple" };
    }
    if (lower.includes("music")) {
      return { id: "music", name: raw, icon: "🎵", color: "purple" };
    }

    // Dynamic color assignment from harmonious palette so ANY custom subject gets distinct branding
    const colors = ["blue", "indigo", "purple", "emerald", "amber", "rose", "teal"];
    let hash = 0;
    for (let i = 0; i < raw.length; i++) hash = (hash << 5) - hash + raw.charCodeAt(i);
    const assignedColor = colors[Math.abs(hash) % colors.length];

    return {
      id: lower.replace(/[^a-z0-9]+/g, "-"),
      name: raw.charAt(0).toUpperCase() + raw.slice(1),
      icon: "📚",
      color: assignedColor,
    };
  }

  const title = (exam.title || "").toLowerCase();
  if (
    title.includes("math") ||
    title.includes("calculus") ||
    title.includes("algebra") ||
    title.includes("trig") ||
    title.includes("geometry")
  ) {
    return { id: "maths", name: "Maths", icon: "📐", color: "indigo" };
  }
  if (title.includes("chem")) {
    return { id: "chemistry", name: "Chemistry", icon: "🧪", color: "purple" };
  }
  if (title.includes("phys")) {
    return { id: "physics", name: "Physics", icon: "⚡", color: "amber" };
  }
  if (title.includes("bio")) {
    return { id: "biology", name: "Biology", icon: "🌿", color: "emerald" };
  }
  if (title.includes("eng")) {
    return { id: "english", name: "English", icon: "📖", color: "rose" };
  }
  if (title.includes("comp") || title.includes("python") || title.includes("code")) {
    return { id: "computer", name: "Computer Science", icon: "💻", color: "teal" };
  }
  if (title.includes("hist")) {
    return { id: "history", name: "History", icon: "🏛️", color: "amber" };
  }
  if (title.includes("geo")) {
    return { id: "geography", name: "Geography", icon: "🌍", color: "emerald" };
  }
  if (title.includes("econ")) {
    return { id: "economics", name: "Economics", icon: "📊", color: "blue" };
  }

  return { id: "other", name: "Other Tests", icon: "📝", color: "slate" };
}

function ExamCard({ exam, subjectInfo }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    const ok = window.confirm(
      "Starting begins the timer right away and it cannot be paused. " +
        "If you already have a running attempt, this resumes it. Continue?",
    );
    if (!ok) return;

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
      <div className="exam-card-header">
        <div className={`subject-badge subject-badge-${subjectInfo.color}`}>
          <span className="subject-badge-icon" aria-hidden="true">{subjectInfo.icon}</span>
          <span className="subject-badge-name">{subjectInfo.name}</span>
        </div>
        <span className="exam-schedule-tag">🟢 {scheduleLabel(exam)}</span>
      </div>

      <h3 className="exam-card-title">{exam.title}</h3>
      {exam.description && <p className="exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li>⏱️ {exam.duration_minutes} minutes</li>
        <li>🎯 {exam.total_marks} marks</li>
      </ul>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        className="exam-start-btn"
        onClick={handleStart}
        disabled={starting}
      >
        {starting ? "Starting..." : "Start / Resume Exam →"}
      </button>
    </article>
  );
}

export default function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSubjectId = searchParams.get("subject") || null;

  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getPublishedExams(page, 50)
      .then((data) => {
        if (cancelled) return;
        setExams(data.exams);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  function goToPage(next) {
    setLoading(true);
    setError("");
    setPage(next);
  }

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }

  // Attach resolved subject to every exam
  const examsWithSubject = useMemo(() => {
    return exams.map((exam) => ({
      ...exam,
      _subject: normalizeSubject(exam),
    }));
  }, [exams]);

  // Group exams by subject
  const subjectGroups = useMemo(() => {
    const map = new Map();
    for (const exam of examsWithSubject) {
      const s = exam._subject;
      if (!map.has(s.id)) {
        map.set(s.id, {
          id: s.id,
          name: s.name,
          icon: s.icon,
          color: s.color,
          exams: [],
        });
      }
      map.get(s.id).exams.push(exam);
    }
    return Array.from(map.values());
  }, [examsWithSubject]);

  // Active subject if user clicked one
  const activeSubject = useMemo(() => {
    if (!currentSubjectId || currentSubjectId === "all") return null;
    return (
      subjectGroups.find((g) => g.id === currentSubjectId) || {
        id: currentSubjectId,
        name:
          currentSubjectId === "other"
            ? "Other Tests"
            : currentSubjectId.charAt(0).toUpperCase() +
              currentSubjectId.slice(1),
        icon: currentSubjectId === "other" ? "📝" : "📚",
        color: currentSubjectId === "other" ? "slate" : "blue",
        exams: [],
      }
    );
  }, [currentSubjectId, subjectGroups]);

  function selectSubject(id) {
    if (!id || id === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ subject: id });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const latestExam = examsWithSubject[0] || null;

  return (
    <div className="student-home">
      {/* ============================================================
          VIEW 1: DEDICATED SUBJECT PAGE (WHEN A SUBJECT IS OPENED)
          ============================================================ */}
      {activeSubject ? (
        <div className="subject-page-view hero-animate">
          {/* Top Breadcrumb & Navigation */}
          <div className="subject-page-nav">
            <button
              type="button"
              className="btn-back"
              onClick={() => selectSubject(null)}
            >
              ← Back to All Subjects
            </button>
            <div className="subject-quick-pills">
              <button
                type="button"
                className="pill-btn"
                onClick={() => selectSubject(null)}
              >
                All Subjects
              </button>
              {subjectGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`pill-btn ${g.id === activeSubject.id ? "active" : ""}`}
                  onClick={() => selectSubject(g.id)}
                >
                  <span className="pill-icon">{g.icon}</span> {g.name} ({g.exams.length})
                </button>
              ))}
            </div>
          </div>

          {/* Subject Header Banner */}
          <div className={`subject-hero-card subject-card-${activeSubject.color}`}>
            <div className="subject-hero-left">
              <div className={`subject-hero-tile tile-${activeSubject.color}`}>
                <span>{activeSubject.icon}</span>
              </div>
              <div>
                <span className="subject-hero-eyebrow">Subject Section</span>
                <h1 className="subject-hero-title">{activeSubject.name}</h1>
                <p className="subject-hero-desc">
                  {activeSubject.exams.length}{" "}
                  {activeSubject.exams.length === 1 ? "test" : "tests"} available
                  in this subject.
                </p>
              </div>
            </div>
          </div>

          {/* Tests inside this subject */}
          <section className="subject-exams-container">
            <div className="section-head section-head-row">
              <div>
                <span className="section-eyebrow">● Tests inside this subject</span>
                <h2 className="section-title">
                  {activeSubject.name} Tests ({activeSubject.exams.length})
                </h2>
              </div>
            </div>

            {loading && (
              <div className="loading-state">
                <span className="loading-spinner"></span>
                <p>Loading {activeSubject.name} tests...</p>
              </div>
            )}

            {!loading && activeSubject.exams.length === 0 && (
              <div className="empty-exams-card">
                <span className="empty-icon">{activeSubject.icon}</span>
                <h3>No tests available yet for {activeSubject.name}</h3>
                <p>
                  No exams are currently published under this subject. You can check back later or view other subjects.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => selectSubject(null)}
                >
                  Browse all subjects
                </button>
              </div>
            )}

            {!loading && activeSubject.exams.length > 0 && (
              <div className="exams-grid">
                {activeSubject.exams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    subjectInfo={exam._subject}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ============================================================
           VIEW 2: MAIN DASHBOARD (ALL SUBJECTS & SECTIONS)
           ============================================================ */
        <>
          {/* AUTHENTIC HERO SECTION */}
          <section className="hero-banner hero-animate">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="eyebrow-dot"></span>
                TEST BUDDY
              </div>
              <h1 className="hero-heading">
                <span className="hero-heading-line-1">Take tests.</span>
                <span className="hero-heading-line-2">Track scores.</span>
                <span className="hero-heading-line-3">Ace exams.</span>
              </h1>
              <p className="hero-subtitle">
                Choose a subject to practice. All your exams organized in one
                focused portal.
              </p>

              {/* Subject quick jump pills */}
              <div className="hero-tags">
                {subjectGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="tag-pill"
                    onClick={() => selectSubject(g.id)}
                  >
                    <span className="tag-icon">{g.icon}</span> {g.name} ({g.exams.length})
                  </button>
                ))}
              </div>
            </div>

            {/* REAL FEATURED TEST PREVIEW (No fake marketing text!) */}
            <div className="hero-window-wrapper">
              <div className="hero-window-card">
                <div className="window-topbar">
                  <span className="window-dot red"></span>
                  <span className="window-dot yellow"></span>
                  <span className="window-dot green"></span>
                  <span className="window-title">Featured Test</span>
                </div>
                {latestExam ? (
                  <div className="window-body">
                    <div className="window-badge-row">
                      <span className={`subject-badge subject-badge-${latestExam._subject.color}`}>
                        {latestExam._subject.icon} {latestExam._subject.name}
                      </span>
                      <span className="window-status-pill">Ready</span>
                    </div>
                    <h3 className="window-exam-title">{latestExam.title}</h3>
                    {latestExam.description && (
                      <p className="window-exam-desc">{latestExam.description}</p>
                    )}
                    <div className="window-meta-row">
                      <span>⏱️ {latestExam.duration_minutes}m</span>
                      <span>🎯 {latestExam.total_marks} marks</span>
                    </div>
                    <button
                      type="button"
                      className="window-action-btn"
                      onClick={() => selectSubject(latestExam._subject.id)}
                    >
                      Open {latestExam._subject.name} ({subjectGroups.find((g) => g.id === latestExam._subject.id)?.exams.length || 1}) →
                    </button>
                  </div>
                ) : (
                  <div className="window-body">
                    <p className="window-exam-desc">No exams published yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CHOOSE A SUBJECT BENTO GRID (Clicking opens subject page) */}
          <section className="subjects-overview hero-animate hero-animate-delay-1">
            <div className="section-head">
              <span className="section-eyebrow">● Subjects</span>
              <h2 className="section-title">Choose a Subject</h2>
              <p className="section-desc">
                Click on a subject to open all tests created for it.
              </p>
            </div>

            <div className="subject-bento-grid">
              {subjectGroups.map((group) => (
                <div
                  key={group.id}
                  className={`subject-bento-card card-tint-${group.color}`}
                  onClick={() => selectSubject(group.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      selectSubject(group.id);
                    }
                  }}
                >
                  <div className="subject-bento-top">
                    <div className={`subject-icon-tile tile-${group.color}`}>
                      <span>{group.icon}</span>
                    </div>
                    <span className="subject-bento-count">
                      {group.exams.length} {group.exams.length === 1 ? "test" : "tests"}
                    </span>
                  </div>

                  <h3 className="subject-bento-name">{group.name}</h3>

                  <div className="subject-bento-preview">
                    {group.exams.slice(0, 3).map((ex) => (
                      <span key={ex.id} className="preview-pill">
                        {ex.title}
                      </span>
                    ))}
                    {group.exams.length > 3 && (
                      <span className="preview-pill more">
                        +{group.exams.length - 3} more
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="subject-bento-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectSubject(group.id);
                    }}
                  >
                    Open {group.name} Tests ({group.exams.length}) →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ALL TESTS WRAPPED UNDER SUBJECT SECTIONS */}
          <section className="wrapped-subjects-section hero-animate hero-animate-delay-2">
            <div className="section-head">
              <span className="section-eyebrow">● All Tests by Subject</span>
              <h2 className="section-title">Tests Wrapped by Subject</h2>
              <p className="section-desc">
                Tests are neatly grouped inside each subject box below.
              </p>
            </div>

            {loading && (
              <div className="loading-state">
                <span className="loading-spinner"></span>
                <p>Loading available exams...</p>
              </div>
            )}

            {error && (
              <div className="error-banner">
                <p className="error" role="alert">
                  {error}
                </p>
                <button type="button" onClick={retry}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && subjectGroups.length === 0 && (
              <div className="empty-exams-card">
                <span className="empty-icon">📝</span>
                <h3>No exams are published yet</h3>
                <p>When teachers publish exams, they will appear here grouped by subject.</p>
              </div>
            )}

            {!loading &&
              !error &&
              subjectGroups.map((group) => (
                <div key={group.id} className="subject-group-box">
                  <div className="subject-group-header">
                    <div className="subject-group-title-row">
                      <div className={`subject-icon-tile tile-${group.color}`}>
                        <span>{group.icon}</span>
                      </div>
                      <div>
                        <h3 className="subject-group-name">{group.name}</h3>
                        <span className="subject-group-meta">
                          {group.exams.length}{" "}
                          {group.exams.length === 1 ? "test" : "tests"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => selectSubject(group.id)}
                    >
                      Open {group.name} Page →
                    </button>
                  </div>

                  <div className="exams-grid">
                    {group.exams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        subjectInfo={exam._subject}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {!loading && !error && pagination && pagination.totalPages > 1 && (
              <div className="pager">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}