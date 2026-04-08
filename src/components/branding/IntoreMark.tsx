import type { CSSProperties } from 'react';

export function IntoreMark({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 5.5 54.5 32 32 58.5 9.5 32 32 5.5Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="6.5" fill="currentColor" />
    </svg>
  );
}

