export function GraduationCapLogoIcon({ size = 42, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`saga-cap-icon ${className}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Mortarboard Diamond Top */}
      <path
        d="M27 4L49 14.5L27 25L5 14.5L27 4Z"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Contoured Head Band */}
      <path
        d="M13 18.8V26.5C13 26.5 17 33.5 27 33.5C37 33.5 41 26.5 41 26.5V18.8"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Right-hanging Tassel */}
      <path
        d="M44.5 17.5V28.5"
        stroke="#1D4ED8"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="44.5" cy="30" r="1.8" fill="#1D4ED8" />
    </svg>
  );
}

export default function SagaCityLogo({
  size = 38,
  showText = true,
  stacked = false,
  className = "",
}) {
  return (
    <div
      className={`saga-brand-logo ${stacked ? "stacked" : ""} ${className}`}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <GraduationCapLogoIcon size={size} />

      {showText && (
        <div className="saga-brand-text-wrap">
          <span className="saga-brand-title">SAGA CITY</span>
          <span className="saga-brand-subtitle">Education &amp; Examination Portal</span>
          {stacked && (
            <span className="saga-brand-motto-sub">LEARN • PRACTICE • EVALUATE • EXCEL</span>
          )}
        </div>
      )}
    </div>
  );
}
