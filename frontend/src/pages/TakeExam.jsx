import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getAttempt, saveAnswer, submitAttempt } from "../api/attempt.js";
import { getQuestions } from "../api/exam.js";
import QuestionCard from "../components/QuestionCard.jsx";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Seconds left, measured against the SERVER's clock.
// offsetMs = (server time) - (this computer's time), measured once at load.
function secondsRemaining(expiresAtMs, offsetMs) {
  return Math.max(0, Math.ceil((expiresAtMs - (Date.now() + offsetMs)) / 1000));
}

export default function TakeExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | error | ready
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> "A".."D"
  const [saveStatus, setSaveStatus] = useState({}); // questionId -> saving|saved|failed
  const [index, setIndex] = useState(0);

  const [timing, setTiming] = useState(null); // { expiresAtMs, offsetMs }
  const [secondsLeft, setSecondsLeft] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false); // guards against double submit

  // ---- Load everything from the server (works after refresh too) -----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAttempt(attemptId);
        if (cancelled) return;

        const att = data.attempt;

        // Finished, or time ran out while the student was away:
        // the result page knows how to finalize and display both cases.
        if (att.status !== "in_progress" || att.is_expired) {
          navigate(`/attempts/${attemptId}/result`, { replace: true });
          return;
        }

        const qData = await getQuestions(att.exam_id);
        if (cancelled) return;

        const saved = {};
        for (const a of data.answers) {
          saved[String(a.question_id)] = a.selected_option;
        }

        const offsetMs = new Date(data.server_time).getTime() - Date.now();
        const expiresAtMs = new Date(att.expires_at).getTime();

        setAttempt(att);
        setQuestions(qData.questions);
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
    return () => {
      cancelled = true;
    };
  }, [attemptId, reloadKey, navigate]);

  function retryLoad() {
    setLoadError("");
    setPhase("loading");
    setReloadKey((key) => key + 1);
  }

  // ---- Countdown ------------------------------------------------------
  useEffect(() => {
    if (!timing) return;
    const id = setInterval(() => {
      setSecondsLeft(secondsRemaining(timing.expiresAtMs, timing.offsetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [timing]);

  // ---- Submit (manual button OR automatic at 00:00) -------------------
  const finish = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const data = await submitAttempt(attemptId);
      navigate(`/attempts/${attemptId}/result`, {
        replace: true,
        state: { result: data.result },
      });
    } catch (err) {
      if (err.code === "ATTEMPT_ALREADY_ENDED") {
        navigate(`/attempts/${attemptId}/result`, { replace: true });
        return;
      }
      setSubmitError(err.message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    if (secondsLeft === 0) finish();
  }, [secondsLeft, finish]);

  // ---- Saving answers -------------------------------------------------
  async function persist(questionId, option) {
    setSaveStatus((s) => ({ ...s, [questionId]: "saving" }));
    try {
      await saveAnswer(attemptId, questionId, option);
      setSaveStatus((s) => ({ ...s, [questionId]: "saved" }));
    } catch (err) {
      if (
        err.code === "ATTEMPT_EXPIRED" ||
        err.code === "ATTEMPT_ALREADY_ENDED"
      ) {
        navigate(`/attempts/${attemptId}/result`, { replace: true });
        return;
      }
      setSaveStatus((s) => ({ ...s, [questionId]: "failed" }));
    }
  }

  function handleSelect(option) {
    const q = questions[index];
    // One save at a time per question, so two quick clicks cannot
    // reach the server out of order.
    if (saveStatus[q.id] === "saving") return;
    setAnswers((a) => ({ ...a, [q.id]: option }));
    persist(q.id, option);
  }

  function handleRetry() {
    const q = questions[index];
    persist(q.id, answers[q.id]);
  }

  function handleSubmitClick() {
    const unanswered = questions.filter((x) => !answers[x.id]).length;
    const failed = Object.values(saveStatus).filter((s) => s === "failed").length;

    let message = "Submit your exam? You cannot change answers afterwards.";
    if (failed > 0) {
      message =
        `WARNING: ${failed} answer(s) failed to save and will NOT be counted.\n\n` +
        message;
    }
    if (unanswered > 0) {
      message = `${unanswered} question(s) are unanswered.\n\n` + message;
    }
    if (window.confirm(message)) finish();
  }

  // ---- Screens --------------------------------------------------------
  if (phase === "loading") return <p>Loading your exam...</p>;

  if (phase === "error") {
    return (
      <div>
        <p className="error" role="alert">
          {loadError}
        </p>
        <button onClick={retryLoad}>Try again</button>{" "}
        <button className="secondary" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </button>
      </div>
    );
  }

  if (questions.length === 0) return <p>This exam has no questions.</p>;

  const q = questions[index];
  const answeredCount = questions.filter((x) => answers[x.id]).length;
  const anySaving = Object.values(saveStatus).includes("saving");
  const timeUp = secondsLeft === 0;
  const locked = submitting || timeUp;

  return (
    <div>
      <div className={`timer-bar${secondsLeft <= 60 ? " low" : ""}`}>
        <strong>{attempt.exam_title}</strong>
        <span role="timer" aria-label="Time remaining">
          {formatTime(secondsLeft)}
        </span>
      </div>

      {timeUp && (
        <div className="banner" role="alert">
          Time is up. Submitting your saved answers...
          {submitError && (
            <>
              {" "}
              <span className="error">{submitError}</span>{" "}
              <button onClick={finish}>Try again</button>
            </>
          )}
        </div>
      )}

      {!timeUp && submitError && (
        <p className="error" role="alert">
          {submitError}
        </p>
      )}

      <p>
        Answered {answeredCount} of {questions.length}
      </p>

      <div className="navigator">
        {questions.map((x, i) => {
          const classes = ["nav-dot"];
          if (answers[x.id]) classes.push("answered");
          if (saveStatus[x.id] === "failed") classes.push("failed");
          if (i === index) classes.push("current");
          return (
            <button
              key={x.id}
              className={classes.join(" ")}
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === index}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        question={q}
        number={index + 1}
        total={questions.length}
        selected={answers[q.id]}
        saveStatus={saveStatus[q.id]}
        disabled={locked}
        onSelect={handleSelect}
        onRetry={handleRetry}
      />

      <div className="exam-nav">
        <button
          className="secondary"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Previous
        </button>
        {index < questions.length - 1 ? (
          <button className="secondary" onClick={() => setIndex(index + 1)}>
            Next
          </button>
        ) : (
          <span />
        )}
      </div>

      <button onClick={handleSubmitClick} disabled={locked || anySaving}>
        {submitting ? "Submitting..." : "Submit exam"}
      </button>
    </div>
  );
}
