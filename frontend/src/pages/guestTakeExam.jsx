import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getGuestAttempt, getGuestQuestions, saveGuestAnswer, submitGuestAttempt } from "../api/guest.js";
import { readCredential, storeResult, secondsRemaining } from "../utils/guestSessionStorage.js";
import QuestionCard from "../components/exam/QuestionCard.jsx";
import ExamTimerBar from "../components/exam/ExamTimerBar.jsx";
import ExamNavigator from "../components/exam/ExamNavigator.jsx";
import PracticeSubmitModal from "../components/exam/PracticeSubmitModal.jsx";
import GuestResultView from "../components/exam/GuestResultView.jsx";

export default function GuestTakeExam() {
  const { attemptId } = useParams();
  const [phase, setPhase] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [reviewMarks, setReviewMarks] = useState({});
  const [visited, setVisited] = useState({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);
  const submittingRef = useRef(false);
  const credential = readCredential(attemptId);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase("submitting");
    setConfirmOpen(false);
    try {
      const data = await submitGuestAttempt(attemptId, credential);
      storeResult(attemptId, data.result);
      setResult(data.result);
      setPhase("done");
    } catch (err) {
      setLoadError(err.message || "Submission failed. Please try again.");
      setPhase("error");
      submittingRef.current = false;
    }
  }, [attemptId, credential]);

  useEffect(() => {
    if (!credential) {
      setLoadError("Session not found. Please start the exam from the exam page.");
      setPhase("error");
      return;
    }
    let cancelled = false;
    Promise.all([getGuestAttempt(attemptId, credential), getGuestQuestions(attemptId, credential)])
      .then(([attData, qData]) => {
        if (cancelled) return;
        const att = attData.attempt;
        const qs = qData.questions || [];
        setAttempt(att);
        setQuestions(qs);
        const expiresMs = att.expires_at ? new Date(att.expires_at).getTime() : null;
        setSecondsLeft(expiresMs ? secondsRemaining(expiresMs, 0) : (att.duration_minutes || 60) * 60);
        if (qs[0]) setVisited({ [qs[0].id]: true });
        setPhase("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Failed to load the exam. Please refresh.");
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [attemptId, credential]);

  useEffect(() => {
    if (phase !== "ready" || secondsLeft === null) return;
    if (secondsLeft === 0) { doSubmit(); return; }
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [phase, secondsLeft, doSubmit]);

  function handleSelectIndex(i) {
    const nextQ = questions[i];
    if (nextQ) setVisited((v) => ({ ...v, [nextQ.id]: true }));
    setIndex(i);
  }
  async function handleAnswer(opt) {
    const q = questions[index];
    setAnswers((a) => ({ ...a, [q.id]: opt }));
    try { await saveGuestAnswer(attemptId, credential, q.id, opt); } catch {}
  }
  function handleClear() {
    const q = questions[index];
    setAnswers((a) => { const c = { ...a }; delete c[q.id]; return c; });
  }
  function handleToggleReview() {
    const q = questions[index];
    setReviewMarks((r) => ({ ...r, [q.id]: !r[q.id] }));
  }

  if (phase === "loading") return <div className="page"><p>Loading examination…</p></div>;
  if (phase === "submitting") return <div className="page"><p>Submitting your answers…</p></div>;
  if (phase === "error") return (
    <div className="page">
      <p className="error" role="alert">{loadError}</p>
      <Link to="/examinations" className="button-link secondary">← Back to Examinations</Link>
    </div>
  );
  if (phase === "done" && result) {
    return <GuestResultView result={result} examId={attempt?.exam_id} />;
  }

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(reviewMarks).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="page" style={{ maxWidth: "1100px" }}>
      <ExamTimerBar title={attempt?.exam_title || "Practice Exam"} secondsLeft={secondsLeft} />
      <div className="cbt-legend">
        <span className="cbt-legend-item"><span className="cbt-legend-dot" style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }} /> Answered</span>
        <span className="cbt-legend-item"><span className="cbt-legend-dot" style={{ background: "#fee2e2", borderColor: "#fca5a5" }} /> Not Answered</span>
        <span className="cbt-legend-item"><span className="cbt-legend-dot" style={{ background: "#fef3c7", borderColor: "#fcd34d" }} /> Review</span>
        <span className="cbt-legend-item"><span className="cbt-legend-dot" style={{ background: "var(--bg-surface)", borderColor: "var(--border-color)" }} /> Not Visited</span>
      </div>
      <ExamNavigator questions={questions} currentIndex={index} answers={answers} reviewMarks={reviewMarks} visited={visited} onSelectIndex={handleSelectIndex} />
      {q && <QuestionCard question={q} number={index + 1} total={questions.length} selected={answers[q.id]} disabled={false} onSelect={handleAnswer} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="secondary" disabled={index === 0} onClick={() => handleSelectIndex(index - 1)}>← Previous</button>
          <button type="button" className="secondary" disabled={index === questions.length - 1} onClick={() => handleSelectIndex(index + 1)}>Next →</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {answers[q?.id] && <button type="button" className="secondary" onClick={handleClear}>Clear Selection</button>}
          <button type="button" className="secondary" onClick={handleToggleReview} style={{ borderColor: reviewMarks[q?.id] ? "#f59e0b" : undefined }}>
            {reviewMarks[q?.id] ? "★ Marked for Review" : "☆ Mark for Review"}
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} style={{ fontWeight: 700 }}>Submit Test</button>
        </div>
      </div>
      <PracticeSubmitModal isOpen={confirmOpen} total={questions.length} answeredCount={answeredCount} unansweredCount={unansweredCount} reviewCount={reviewCount} onConfirm={doSubmit} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
