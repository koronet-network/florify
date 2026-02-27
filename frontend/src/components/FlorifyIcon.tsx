export default function FlorifyIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <polygon
        points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
        fill="none"
        stroke="#007BA0"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <g transform="translate(50, 50)">
        <ellipse cx="0" cy="-22" rx="12" ry="22" fill="#007BA0" opacity="0.85" transform="rotate(0)" />
        <ellipse cx="0" cy="-22" rx="12" ry="22" fill="#007BA0" opacity="0.85" transform="rotate(120)" />
        <ellipse cx="0" cy="-22" rx="12" ry="22" fill="#007BA0" opacity="0.85" transform="rotate(240)" />
        <circle cx="0" cy="0" r="6" fill="#ffffff" />
        <circle cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
      </g>
    </svg>
  );
}
