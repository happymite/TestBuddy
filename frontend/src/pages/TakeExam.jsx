import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getAttempt, saveAnswer, submitAttempt } from "../api/attempt.js";
import { getQuestions } from "../api/exam.js";
import QuestionCard from "../components/exam/QuestionCard.jsx";
import ExamTimerBar from "../components/exam/ExamTimerBar.jsx";
import ExamNavigator from "../components/exam/ExamNavigator.jsx";
import { secondsRemaining } from "../utils/guestSessionStorage.js";

export default function TakeExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [index, setIndex] = useState(0);
  const [timing, setTiming] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAttempt(attemptId);
        if (cancelled) return;
        const att = data.attempt;
        if (att.status !== "in_progress" || att.is_expired) {
          navigate(`/attempts/${attemptId}/result`, { replace: true });
          return;
        }
        const qData = await getQuestions(att.exam_id);
        if (cancelled) return;

        const saved = {};
        for (const a of data.answers) saved[String(a.question_id)] = a.selected_option;
        const offsetMs = new Date(data.server_time).getTime() - Date.now();
        const expiresAtMs = new Date(att.expires_at).getTime();

        setAttempt(att);
        setQuestions(qData.questions || []);
        setAnswers(saved);
        setTiming({ expiresAtMs, offsetMs });
        setSecondsLeft(secondsRemaining(expiresAtMs, offsetMs));
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message);
        setPhase("error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [attemptId, reloadKey, navigate]);

  useEffect(() => {
    if (!timing) return;
    const id = setInterval(() => {
      setSecondsLeft(secondsRemaining(timing.expiresAtMs, timing.offsetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [timing]);

  const finish = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await submitAttempt(attemptId);
      navigate(`/attempts/${attemptId}/result`, { replace: true, state: { result: data.result } });
    } catch (err) {
      if (err.code === "ATTEMPT_ALREADY_ENDED") {
        navigate(`/attempts/${attemptId}/result`, { replace: true });
        return;
      }
      setSubmitError(err.message);
      setSubmitting(false);
      submittingRef.current = false;
      setTimeout(() => setRetryTick((t) => t + 1), 3000); // try again in 3 seconds
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    if (secondsLeft === 0) finish();
  }, [secondsLeft, finish, retryTick]);

  async function persist(questionId, option) {
    setSaveStatus((s) => ({ ...s, [questionId]: "saving" }));
    try {
      await saveAnswer(attemptId, questionId, option);
      setSaveStatus((s) => ({ ...s, [questionId]: "saved" }));
    } catch (err) {
      if (err.code === "ATTEMPT_EXPIRED" || err.code === "ATTEMPT_ALREADY_ENDED") {
        navigate(`/attempts/${attemptId}/result`, { replace: true });
        return;
      }
      setSaveStatus((s) => ({ ...s, [questionId]: "failed" }));
    }
  }

  function handleSelect(option) {
    const q = questions[index];
    if (saveStatus[q.id] === "saving") return;
    setAnswers((a) => ({ ...a, [q.id]: option }));
    persist(q.id, option);
  }

  function handleSubmitClick() {
    const failed = questions.filter((x) => saveStatus[x.id] === "failed").length;
    if (failed > 0) {
      window.alert(`${failed} answer(s) did not save. Press Retry on those questions first.`);
      return;
    }

    const unanswered = questions.filter((x) => !answers[x.id]).length;
    let msg = "Submit your exam? You cannot change answers afterwards.";
    if (unanswered > 0) msg = `${unanswered} question(s) are unanswered.\n\n` + msg;
    if (window.confirm(msg)) finish();
  }

  if (phase === "loading") return <div className="page"><p>Loading your exam...</p></div>;
  if (phase === "error") {
    return (
      <div className="page">
        <p className="error" role="alert">{loadError}</p>
        <button onClick={() => { setLoadError(""); setPhase("loading"); setReloadKey((k) => k + 1); }}>Try again</button>
      </div>
    );
  }
  if (questions.length === 0) return <div className="page"><p>This exam has no questions.</p></div>;

  const q = questions[index];
  const anySaving = Object.values(saveStatus).includes("saving");
  const timeUp = secondsLeft === 0;

  return (
    <div className="exam-container">
      <ExamTimerBar title={attempt?.exam_title} secondsLeft={secondsLeft} />
      {timeUp && <div className="banner" role="alert">Time is up. Submitting exam...</div>}
      {submitError && <p className="error" role="alert">{submitError}</p>}
      <p className="hint">Answered {questions.filter((x) => answers[x.id]).length} of {questions.length}</p>

      <ExamNavigator questions={questions} currentIndex={index} answers={answers} saveStatus={saveStatus} onSelectIndex={(i) => setIndex(i)} />

      <QuestionCard
        question={q}
        number={index + 1}
        total={questions.length}
        selected={answers[q.id]}
        saveStatus={saveStatus[q.id]}
        disabled={submitting || timeUp}
        onSelect={handleSelect}
        onRetry={() => persist(q.id, answers[q.id])}
      />

      <div className="exam-nav" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <button className="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
        {index < questions.length - 1 ? <button className="secondary" onClick={() => setIndex(index + 1)}>Next</button> : <span />}
      </div>

      <button onClick={handleSubmitClick} disabled={submitting || timeUp || anySaving} style={{ marginTop: "1.5rem" }}>
        {submitting ? "Submitting..." : "Submit Exam"}
      </button>
    </div>
  );
}
