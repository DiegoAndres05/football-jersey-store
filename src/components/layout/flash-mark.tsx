export function FlashMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-black ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0" aria-hidden="true">
        <path d="M13.2 1.5 4.4 13.2h6.1L9.6 22.5l10-12.2h-6.2L13.2 1.5Z" fill="currentColor" />
      </svg>
      <span className="text-[18px] font-extrabold tracking-[-0.03em] [font-family:var(--font-ui-heavy),var(--font-sans)] sm:text-[20px]">
        FLASHSPORT
      </span>
    </span>
  );
}
