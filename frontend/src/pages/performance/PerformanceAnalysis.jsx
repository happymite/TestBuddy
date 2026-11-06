import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyExams, getStudentExamDetail, getMyOverview } from "../../api/performance.js";
import SummaryCards from "../../components/performance/SummaryCards.jsx";
import QuestionBreakdown from "../../components/performance/QuestionBreakdown.jsx";
import StrengthsWeaknesses from "../../components/performance/StrengthsWeaknesses.jsx";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";
import "../../styles/performance.css";

const COLORS = ["#22c55e", "#ef4444", "#6b7280"];

function DonutChart({ correct, incorrect, unanswered }) {
  const data = [
    { name: "Correct",    value: correct },
    { name: "Incorrect",  value: incorrect },
    { name: "Unanswered", value: unanswered },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <p className="perf-empty">No data.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [v, n]} />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TrendChart({ trend }) {
  if (!trend || trend.length < 2) {
    return <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)" }}>Complete at least 2 exams to see your trend.</p>;
  }
  const data = trend.map((t) => ({
    name: t.exam_title.length > 20 ? t.exam_title.slice(0, 18) + "…" : t.exam_title,
    Score: Number(t.percent),
    Accuracy: t.correct > 0 ? Math.round((Number(t.correct) / (Number(t.correct) + Number(t.incorrect))) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend iconType="circle" iconSize={10} />
        <Line type="monotone" dataKey="Score"    stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="Accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceAnalysis() {
  const { user } = useAuth();

  // ── Data state
  const [exams, setExams]       = useState([]);
  const [trend, setTrend]       = useState([]);
  const [selectedId, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);

  // ── UI state
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError]   = useState("");
  const [detailError, setDetailError] = useState("");
  const [activeTab, setActiveTab]   = useState("summary");

  // Load completed exam list + trend on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    Promise.all([getMyExams(), getMyOverview()])
      .then(([listRes, trendRes]) => {
        if (cancelled) return;
        setExams(listRes.exams || []);
        setTrend(trendRes.trend || []);
        if (listRes.exams?.length) setSelected(listRes.exams[0].exam_id);
        setLoadingList(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(err.message);
        setLoadingList(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Load detail when exam selection changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingDetail(true);
    setDetailError("");
    setDetail(null);
    getStudentExamDetail(selectedId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
        setLoadingDetail(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailError(err.message);
        setLoadingDetail(false);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (loadingList) {
    return <div className="perf-page"><p>Loading your performance data...</p></div>;
  }

  if (listError) {
    return <div className="perf-page"><p className="error" role="alert">{listError}</p></div>;
  }

  if (exams.length === 0) {
    return (
      <div className="perf-page">
        <h1>Performance Analysis</h1>
        <div className="perf-empty">
          <p>No completed examinations found.</p>
          <p>Complete an exam to view your performance report.</p>
          <Link to="/dashboard" className="button-link" style={{ marginTop: "1rem", display: "inline-block" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const att = detail?.attempt;

  const summaryCards = att ? [
    { label: "Exam",       value: att.exam_title, variant: "" },
    { label: "Score",      value: `${Number(att.score)} / ${Number(att.total_marks)}`, variant: "info" },
    { label: "Percentage", value: `${att.percent}%`, variant: att.percent >= 60 ? "correct" : att.percent >= 40 ? "warning" : "incorrect" },
    { label: "Correct",    value: att.correct,    variant: "correct" },
    { label: "Incorrect",  value: att.incorrect,  variant: "incorrect" },
    { label: "Unanswered", value: att.unanswered },
    { label: "Attempted",  value: att.attempted },
    { label: "Accuracy",   value: `${att.accuracy}%`, variant: att.accuracy >= 70 ? "correct" : att.accuracy >= 40 ? "warning" : "incorrect" },
    ...(att.time_taken_minutes !== null
      ? [{ label: "Time taken", value: `${att.time_taken_minutes} min` }]
      : []),
    ...(att.rank && att.total_ranked > 1
      ? [{ label: "Rank", value: `${att.rank} / ${att.total_ranked}`, variant: "info" }]
      : []),
  ] : [];

  return (
    <div className="perf-page">
      <h1 style={{ marginBottom: "0.25rem" }}>Performance Analysis</h1>
      <p style={{ color: "var(--text-muted,#888)", marginBottom: "1.5rem" }}>
        {user?.name} — detailed report for completed exams
      </p>

      {/* Exam selector */}
      <div className="perf-exam-selector">
        <label htmlFor="exam-select">Select exam:</label>
        <select
          id="exam-select"
          value={selectedId || ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {exams.map((ex) => (
            <option key={ex.exam_id} value={ex.exam_id}>
              {ex.exam_title} — {new Date(ex.submitted_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Trend chart (always visible if 2+ exams) */}
      {trend.length >= 2 && (
        <div className="perf-chart-box" style={{ marginBottom: "1.5rem" }}>
          <h3>Performance trend across exams</h3>
          <TrendChart trend={trend} />
        </div>
      )}

      {loadingDetail && <p>Loading exam report...</p>}
      {detailError  && <p className="error" role="alert">{detailError}</p>}

      {detail && att && (
        <>
          {/* Tabs */}
          <div className="perf-tabs">
            {["summary", "questions", "insights"].map((t) => (
              <button
                key={t}
                className={`perf-tab ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t === "summary" ? "Summary" : t === "questions" ? "Question Analysis" : "Insights"}
              </button>
            ))}
          </div>

          {/* Summary tab */}
          {activeTab === "summary" && (
            <>
              <SummaryCards cards={summaryCards} />
              <div className="perf-charts-row">
                <div className="perf-chart-box">
                  <h3>Answer distribution</h3>
                  <DonutChart correct={att.correct} incorrect={att.incorrect} unanswered={att.unanswered} />
                </div>
                <div className="perf-chart-box">
                  <h3>Score vs total marks</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: "Your score", value: Number(att.score) }, { name: "Total marks", value: Number(att.total_marks) }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                        <Cell fill="#60a5fa" />
                        <Cell fill="#374151" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Question analysis tab */}
          {activeTab === "questions" && (
            <>
              <p className="hint" style={{ marginBottom: "1rem" }}>
                {att.correct} correct · {att.incorrect} incorrect · {att.unanswered} not attempted
              </p>
              <QuestionBreakdown questions={detail.questions} />
            </>
          )}

          {/* Insights tab */}
          {activeTab === "insights" && (
            <StrengthsWeaknesses attempt={att} />
          )}
        </>
      )}
    </div>
  );
}

