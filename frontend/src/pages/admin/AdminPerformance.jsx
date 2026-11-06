import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  getAdminExams,
  getAdminExamOverview,
  getAdminExamStudents,
  getAdminQuestionStats,
} from "../../api/performance.js";
import SummaryCards from "../../components/performance/SummaryCards.jsx";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import "../../styles/performance.css";

const DONUT_COLORS = ["#22c55e", "#ef4444", "#6b7280"];

const BUCKET_LABELS = ["0–20%", "21–40%", "41–60%", "61–80%", "81–100%"];

const tooltipStyle = {
  backgroundColor: "var(--bg-surface, #1e293b)",
  borderColor: "var(--border-color, rgba(128,128,128,0.2))",
  color: "var(--text-main, #f8fafc)",
  borderRadius: "6px",
  fontSize: "0.85rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

function bucketise(students) {
  const counts = [0, 0, 0, 0, 0];
  for (const s of students) {
    const pct = Number(s.percent);
    if      (pct <= 20)  counts[0]++;
    else if (pct <= 40)  counts[1]++;
    else if (pct <= 60)  counts[2]++;
    else if (pct <= 80)  counts[3]++;
    else                 counts[4]++;
  }
  return BUCKET_LABELS.map((label, i) => ({ label, count: counts[i] }));
}

function ScoreDistChart({ students }) {
  const data = bucketise(students);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, rgba(128,128,128,0.2))" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Students" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ ov }) {
  const data = [
    { name: "Correct",    value: Number(ov.total_correct    || 0) },
    { name: "Incorrect",  value: Number(ov.total_incorrect  || 0) },
    { name: "Unanswered", value: Number(ov.total_unanswered || 0) },
  ].filter((d) => d.value > 0);

  if (!data.length) return <p className="perf-empty">No data yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TopStudentsChart({ students }) {
  const top20 = [...students]
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 20)
    .map((s) => ({
      name: (s.student_name || s.name || "Student").split(" ")[0],
      Score: Number(s.score),
    }));

  if (!top20.length) return <p className="perf-empty">No students yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={top20} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, rgba(128,128,128,0.2))" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={40} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AdminPerformance() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Exam list
  const [exams, setExams]         = useState([]);
  const [examId, setExamId]       = useState(null);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsErr, setExamsErr]   = useState("");

  // Per-exam data
  const [overview, setOverview]   = useState(null);
  const [students, setStudents]   = useState([]);
  const [qStats, setQStats]       = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // UI
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading]     = useState(false);
  const [err, setErr]             = useState("");

  // Students tab state
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [sortKey, setSortKey]     = useState("rank");
  const [sortDir, setSortDir]     = useState("asc");
  const LIMIT = 20;

  // Load exam list
  useEffect(() => {
    setExamsLoading(true);
    getAdminExams()
      .then((res) => {
        const list = res.exams || [];
        setExams(list);
        // Restore from URL or default to first
        const urlExam = Number(searchParams.get("examId"));
        const first = list[0]?.id ?? list[0]?.exam_id;
        setExamId(urlExam || first || null);
        setExamsLoading(false);
      })
      .catch((e) => {
        setExamsErr(e.message);
        setExamsLoading(false);
      });
  }, []); // eslint-disable-line

  useEffect(() => {
    const urlExam = Number(searchParams.get("examId"));
    if (urlExam && urlExam !== examId) {
      setExamId(urlExam);
    }
  }, [searchParams]);

  // Load per-exam data when examId changes
  const loadExamData = useCallback(() => {
    if (!examId) return;
    setLoading(true);
    setErr("");
    setOverview(null);
    setStudents([]);
    setQStats([]);
    setPage(1);

    Promise.all([
      getAdminExamOverview(examId),
      getAdminExamStudents(examId, { page: 1, limit: LIMIT, search: "" }),
      getAdminQuestionStats(examId),
    ])
      .then(([ovRes, stRes, qRes]) => {
        setOverview(ovRes.stats ? { ...ovRes.stats, total_marks: ovRes.exam?.total_marks } : null);
        setStudents(stRes.students || []);
        setTotalStudents(stRes.pagination?.total ?? stRes.total ?? (stRes.students?.length || 0));
        setQStats(qRes.questions || []);
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    if (examId) {
      setSearchParams({ examId });
      loadExamData();
    }
  }, [examId]); // eslint-disable-line

  // Paginate student fetch
  useEffect(() => {
    if (!examId || page === 1) return;
    getAdminExamStudents(examId, { page, limit: LIMIT, search })
      .then((res) => {
        setStudents(res.students || []);
        setTotalStudents(res.pagination?.total ?? res.total ?? (res.students?.length || 0));
      })
      .catch(() => {});
  }, [page]); // eslint-disable-line

  // Search re-fetch (debounced via manual trigger)
  function handleSearch(e) {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    if (!examId) return;
    getAdminExamStudents(examId, { page: 1, limit: LIMIT, search: q })
      .then((res) => {
        setStudents(res.students || []);
        setTotalStudents(res.pagination?.total ?? res.total ?? (res.students?.length || 0));
      })
      .catch(() => {});
  }

  // Client-side sort of current page
  function sorted(list) {
    return [...list].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (["score", "percent", "rank", "correct", "incorrect", "unanswered"].includes(sortKey)) {
        va = Number(va); vb = Number(vb);
      } else {
        va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function sortIcon(key) {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  if (examsLoading) return <div className="perf-page"><p>Loading exams...</p></div>;
  if (examsErr)     return <div className="perf-page"><p className="error" role="alert">{examsErr}</p></div>;

  if (!exams.length) {
    return (
      <div className="perf-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h1 style={{ margin: 0 }}>Performance Analytics</h1>
          <button onClick={() => navigate("/admin")} className="secondary">
            ← Back to Dashboard
          </button>
        </div>
        <div className="perf-empty">
          <p>No exams found to analyze.</p>
          <p>Publish an exam and wait for students to complete it.</p>
          <button onClick={() => navigate("/admin")} className="primary" style={{ marginTop: "1rem" }}>
            Go to Test Management
          </button>
        </div>
      </div>
    );
  }

  const ov = overview;
  const totalPages = Math.ceil(totalStudents / LIMIT);

  const overviewCards = ov ? [
    { label: "Completed",    value: ov.completed,                           variant: "info"      },
    { label: "Avg score",    value: `${Number(ov.avg_score || 0).toFixed(1)} / ${Number(ov.total_marks || 0)}`, variant: "" },
    { label: "Avg %",        value: `${Number(ov.avg_percent || 0).toFixed(1)}%`,                variant: Number(ov.avg_percent) >= 60 ? "correct" : Number(ov.avg_percent) >= 40 ? "warning" : "incorrect" },
    { label: "Highest",      value: `${Number(ov.highest || 0)}`,           variant: "correct"   },
    { label: "Lowest",       value: `${Number(ov.lowest || 0)}`,            variant: "incorrect" },
    { label: "Median",       value: `${Number(ov.median || 0)}`,            variant: ""          },
    { label: "Correct ans",  value: Number(ov.total_correct || 0),          variant: "correct"   },
    { label: "Wrong ans",    value: Number(ov.total_incorrect || 0),        variant: "incorrect" },
    { label: "Skipped",      value: Number(ov.total_unanswered || 0),       variant: ""          },
  ] : [];

  return (
    <div className="perf-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem" }}>Performance Analytics</h1>
          <p style={{ color: "var(--text-muted,#888)", margin: 0 }}>
            Class overview and student breakdown by exam
          </p>
        </div>
        <button
          onClick={() => navigate("/admin")}
          className="secondary"
          style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Exam selector */}
      <div className="perf-exam-selector" style={{ margin: "1.25rem 0 1.5rem" }}>
        <label htmlFor="admin-exam-select" style={{ fontWeight: 600 }}>Select exam:</label>
        <select
          id="admin-exam-select"
          value={examId || ""}
          onChange={(e) => {
            const nextId = Number(e.target.value);
            setExamId(nextId);
            setSearchParams({ examId: nextId });
            setSearch("");
            setPage(1);
            setActiveTab("overview");
          }}
        >
          {exams.map((ex) => {
            const id = ex.id ?? ex.exam_id;
            const title = ex.title ?? ex.exam_title ?? `Exam #${id}`;
            const sub = ex.subject_name ? ` • ${ex.subject_name}` : "";
            const subs = ex.submitted_count !== undefined ? ` (${ex.submitted_count} submitted)` : "";
            return (
              <option key={id} value={id}>
                {title}{sub}{subs}
              </option>
            );
          })}
        </select>
      </div>

      {loading && <p>Loading analytics...</p>}
      {err     && <p className="error" role="alert">{err}</p>}

      {!loading && ov && (
        <>
          {/* Tabs */}
          <div className="perf-tabs">
            {["overview", "students", "questions"].map((t) => (
              <button
                key={t}
                className={`perf-tab ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t === "overview" ? "Overview" : t === "students" ? "Students" : "Question Difficulty"}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === "overview" && (
            <>
              <SummaryCards cards={overviewCards} />
              <div className="perf-charts-row">
                <div className="perf-chart-box">
                  <h3>Score distribution</h3>
                  <ScoreDistChart students={students} />
                </div>
                <div className="perf-chart-box">
                  <h3>Answer breakdown (class total)</h3>
                  <DonutChart ov={ov} />
                </div>
              </div>
              <div className="perf-chart-box" style={{ marginBottom: "2rem" }}>
                <h3>Top 20 students by score</h3>
                <TopStudentsChart students={students} />
              </div>
            </>
          )}

          {/* ── Students tab ── */}
          {activeTab === "students" && (
            <>
              <div className="perf-search-row">
                <input
                  type="search"
                  placeholder="Search by student name…"
                  value={search}
                  onChange={handleSearch}
                />
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", alignSelf: "center" }}>
                  {totalStudents} student{totalStudents !== 1 ? "s" : ""}
                </span>
              </div>

              {students.length === 0 ? (
                <p className="perf-empty">No students match your search.</p>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className="perf-student-table">
                      <thead>
                        <tr>
                          <th onClick={() => toggleSort("rank")}>Rank{sortIcon("rank")}</th>
                          <th onClick={() => toggleSort("student_name")}>Name{sortIcon("student_name")}</th>
                          <th onClick={() => toggleSort("score")}>Score{sortIcon("score")}</th>
                          <th>/ Total</th>
                          <th onClick={() => toggleSort("percent")}>%{sortIcon("percent")}</th>
                          <th onClick={() => toggleSort("correct")}>✓{sortIcon("correct")}</th>
                          <th onClick={() => toggleSort("incorrect")}>✗{sortIcon("incorrect")}</th>
                          <th onClick={() => toggleSort("unanswered")}>–{sortIcon("unanswered")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted(students).map((s) => (
                          <tr
                            key={s.student_id}
                            onClick={() => navigate(`/admin/performance/${examId}/student/${s.student_id}`)}
                            title="Click to view question-by-question breakdown"
                          >
                            <td><strong>#{s.rank}</strong></td>
                            <td>{s.student_name || s.name || "Student"}</td>
                            <td style={{ color: "#60a5fa", fontWeight: 700 }}>{Number(s.score)}</td>
                            <td style={{ color: "var(--text-muted,#888)" }}>{Number(s.total_marks)}</td>
                            <td style={{ color: Number(s.percent) >= 60 ? "#22c55e" : Number(s.percent) >= 40 ? "#eab308" : "#ef4444", fontWeight: 600 }}>
                              {Number(s.percent).toFixed(1)}%
                            </td>
                            <td style={{ color: "#22c55e" }}>{s.correct}</td>
                            <td style={{ color: "#ef4444" }}>{s.incorrect}</td>
                            <td style={{ color: "#6b7280" }}>{s.unanswered}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="perf-pagination">
                      <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                      <span style={{ fontSize: "0.85rem" }}>Page {page} of {totalPages}</span>
                      <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Question Difficulty tab ── */}
          {activeTab === "questions" && (
            <>
              {qStats.length === 0 ? (
                <p className="perf-empty">No question data available.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="perf-diff-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Question</th>
                        <th>Correct</th>
                        <th>Incorrect</th>
                        <th>Skipped</th>
                        <th>Correct %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qStats.map((q, i) => (
                        <tr key={q.question_id}>
                          <td style={{ color: "var(--text-muted,#888)" }}>{i + 1}</td>
                          <td style={{ maxWidth: "340px" }}>
                            <span title={q.question_text}>
                              {q.question_text.length > 80
                                ? q.question_text.slice(0, 78) + "…"
                                : q.question_text}
                            </span>
                          </td>
                          <td style={{ color: "#22c55e" }}>{q.correct_count}</td>
                          <td style={{ color: "#ef4444" }}>{q.incorrect_count}</td>
                          <td style={{ color: "#6b7280" }}>{q.unanswered_count}</td>
                          <td style={{ minWidth: "120px" }}>
                            <span style={{ fontWeight: 600, color: Number(q.correct_pct) >= 60 ? "#22c55e" : Number(q.correct_pct) >= 40 ? "#eab308" : "#ef4444" }}>
                              {Number(q.correct_pct).toFixed(0)}%
                            </span>
                            <div className="perf-diff-bar">
                              <div
                                className="perf-diff-bar-fill"
                                style={{
                                  width: `${Number(q.correct_pct)}%`,
                                  background: Number(q.correct_pct) >= 60 ? "#22c55e" : Number(q.correct_pct) >= 40 ? "#eab308" : "#ef4444",
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

