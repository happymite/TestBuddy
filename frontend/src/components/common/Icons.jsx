export function IconWrapper({ children, size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`saga-icon ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function BookOpenIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </IconWrapper>
  );
}

export function TargetIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </IconWrapper>
  );
}

export function ClockIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconWrapper>
  );
}

export function ChartBarIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </IconWrapper>
  );
}

export function CheckIcon({ size = 16, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </IconWrapper>
  );
}

export function CalendarIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </IconWrapper>
  );
}

export function AtomIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" strokeDasharray="3 3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" />
    </IconWrapper>
  );
}

export function FlaskIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M10 2v7.5L4.5 20A1.5 1.5 0 0 0 6 22h12a1.5 1.5 0 0 0 1.5-2L14 9.5V2" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <path d="M7 16h10" />
    </IconWrapper>
  );
}

export function MathIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconWrapper>
  );
}

export function LeafIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c0 3 .5 6.5-1.5 10.5A7 7 0 0 1 11 20z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </IconWrapper>
  );
}

export function TrophyIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M4 3h16v6a8 8 0 0 1-16 0V3z" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </IconWrapper>
  );
}

export function DocumentIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </IconWrapper>
  );
}

export function FolderIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </IconWrapper>
  );
}

export function PhoneIcon({ size = 18, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </IconWrapper>
  );
}

export function MessageIcon({ size = 18, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </IconWrapper>
  );
}

export function UserIcon({ size = 20, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconWrapper>
  );
}

export function ArrowRightIcon({ size = 16, className = "" }) {
  return (
    <IconWrapper size={size} className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </IconWrapper>
  );
}

