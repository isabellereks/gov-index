"use client";

interface HistoryNavProps {
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export default function HistoryNav({
  canBack,
  canForward,
  onBack,
  onForward,
}: HistoryNavProps) {
  return (
    <div className="fixed top-6 right-6 z-30 inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-white/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04]">
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        aria-label="Back"
        className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-black/[.04] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted disabled:cursor-not-allowed transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M7.5 2L3.5 6L7.5 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onForward}
        disabled={!canForward}
        aria-label="Forward"
        className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-black/[.04] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-muted disabled:cursor-not-allowed transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M4.5 2L8.5 6L4.5 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
