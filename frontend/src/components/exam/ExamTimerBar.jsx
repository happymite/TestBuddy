export function formatSeconds(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "--:--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function ExamTimerBar({ title, secondsLeft }) {
  const isLow = secondsLeft !== null && secondsLeft <= 60;
  return (
    <div className={`timer-bar${isLow ? " low" : ""}`}>
      <strong>{title}</strong>
      <span role="timer" aria-label="Time remaining">
        {formatSeconds(secondsLeft)}
      </span>
    </div>
  );
}

