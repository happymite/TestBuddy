import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  getGuestAttempt,
  getGuestQuestions,
  saveGuestAnswer,
  submitGuestAttempt,
} from "../api/guest.js";
import QuestionCard from "../components/QuestionCard.jsx";

const credKey = (id) => `testbuddy_guest_${id}`;
const resultKey = (id) => `testbuddy_guest_result_${id}`;

function readCredential(id) {
  try {
    return sessionStorage.getItem(credKey(id));
  } catch {
    return null;
  }
}

function readResult(id) {
  try {
    const raw = sessionStorage.getItem(resultKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeResult(id, result) {
  try {
    sessionStorage.setItem(resultKey(id), JSON.stringify(result));
  } catch {
    // Storage blocked: the score is still shown once, just not after refresh.
  }
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function secondsRemaining(expiresAtMs, offsetMs) {
  return Math.max(0, Math.ceil((expiresAtMs - (Date.now() + offsetMs)) / 1000));
}

export default function GuestTakeExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // loading | error | nocredential | ready | done
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
  const [result, setResult] = useState(null);
  const submittingRef = useRef(false);

  // ---- Load from the server (also works after a refresh) -------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const credential = readCredential(attemptId);
      if (!credential) {
        setPhase("nocredential");
        return;
      }

      try {
        const data = await getGuestAttempt(attemptId, credential);
        if (cancelled) return;

        const att = data.attempt;
        setAttempt(att);

        const offsetMs = new Date(data.server_time).getTime() - Date.now();
        const expiresAtMs = new Date(att.expires_at).getTime();

        // Already submitted earlier: show the stored score if we have it.
        if (att.status !== "in_progress") {
          setResult(readResult(attemptId));
          setPhase("done");
          return;
        }

        // Time ran out while the guest was away: submitting grades it.
        if (secondsRemaining(expiresAtMs, offsetMs) === 0) {
          const sub = await submitGuestAttempt(attemptId, credential);
          if (cancelled) return;
          storeResult(attemptId, sub.result);
          setResult(sub.result);
          setPhase("done");
          return;
        }

        const qData = await getGuestQuestions(attemptId, credential);
        if (cancelled) return;

        const saved = {};
        for (const a of data.answers) {
          saved[String(a.question_id)] = a.selected_option;
        }

        setQuestions(qData.questions);
        setAnswers(saved);
        setTiming({ expiresAtMs, offsetMs });
        setSecondsLeft(secondsRemaining(expiresAtMs, offsetMs));
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        if (err.code === "ATTEMPT_ALREADY_ENDED") {
          setResult(readResult(attemptId));
          setPhase("done");
          return;
        }
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
    if (!timing || phase !== "ready") return;
    const id = setInterval(() => {
      setSecondsLeft(secondsRemaining(timing.expiresAtMs, timing.offsetMs));
    }, 1000);
    return () => clearInterval(id);
  }, [timing, phase]);

  // ---- Submit (button OR automatic at 00:00) --------------------------
  const finish = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const data = await submitGuestAttempt(
        attemptId,
        readCredential(attemptId),
      );
      storeResult(attemptId, data.result);
      setResult(data.result);
      setPhase("done");
    } catch (err) {
      if (err.code === "ATTEMPT_ALREADY_ENDED") {
        setResult(readResult(attemptId));
        setPhase("done");
        return;
      }
      setSubmitError(err.message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [attemptId]);

  useEffect(() => {
    if (phase === "ready" && secondsLeft === 0) finish();
  }, [phase, secondsLeft, finish]);

  // ---- Saving answers -------------------------------------------------
  async function persist(questionId, option) {
    setSaveStatus((s) => ({ ...s, [questionId]: "saving" }));
    try {
      await saveGuestAnswer(
        attemptId,
        readCredential(attemptId),
        questionId,
        option,
      );
      setSaveStatus((s) => ({ ...s, [questionId]: "saved" }));
    } catch (err) {
      if (
        err.code === "ATTEMPT_EXPIRED" ||
        err.code === "ATTEMPT_ALREADY_ENDED"
      ) {
        // The server already graded it. We can't fetch the score (known gap).
        setResult(readResult(attemptId));
        setPhase("done");
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

  function handleRetry() {
    const q = questions[index];
    persist(q.id, answers[q.id]);
  }

  function handleSubmitClick() {
    const unanswered = questions.filter((x) => !answers[x.id]).length;
    const failed = Object.values(saveStatus).filter((s) => s === "failed").length;

    let message = "Submit your attempt? You cannot change answers afterwards.";
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

  if (phase === "nocredential") {
    return (
      <div>
        <p className="error" role="alert">
          This attempt can only be continued in the browser tab where you
          started it.
        </p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div>
        <p className="error" role="alert">{loadError}</p>
        <button onClick={retryLoad}>Try again</button>{" "}
        <button className="secondary" onClick={() => navigate("/")}>
          Back to home
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div>
        <h1>Practice attempt submitted</h1>
        {result ? (
          <p>
            You scored {result.score} out of {result.total_marks}.
            {result.auto_submitted &&
              " Time ran out, so your saved answers were submitted."}
          </p>
        ) : (
          <p>Your attempt was submitted, but the score can no longer be shown.</p>
        )}
        {attempt && <Link to={`/exams/${attempt.exam_id}`}>Take it again</Link>}
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
        <p className="error" role="alert">{submitError}</p>
      )}

      <p>Answered {answeredCount} of {questions.length}</p>

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
        {submitting ? "Submitting..." : "Submit attempt"}
      </button>
    </div>
  );
}