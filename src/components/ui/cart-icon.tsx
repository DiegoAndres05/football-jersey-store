export function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 4.5h2.2L6.4 7" />
      <path d="M6.2 7h15l-1.7 8.4a1.5 1.5 0 0 1-1.5 1.2H8.5a1.5 1.5 0 0 1-1.5-1.2L5.6 7" />
      <path d="M8.2 7V5.4A1.4 1.4 0 0 1 9.6 4h6.2" />
      <circle cx="9.2" cy="19.8" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="16.6" cy="19.8" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}
