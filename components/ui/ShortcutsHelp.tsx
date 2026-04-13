"use client";

import { useEffect, useRef } from "react";

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface Row {
  keys: string[];
  label: string;
}

// Grouped keyboard reference. Each row's `keys` get rendered as separate
// kbd-style chips so combinations read correctly. Pulled from the
// keydown handler in MapShell so this stays a single source of truth.
const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Move between regions",
    rows: [
      { keys: ["A", "←"], label: "Previous region" },
      { keys: ["D", "→"], label: "Next region" },
      { keys: ["1"], label: "North America" },
      { keys: ["2"], label: "Europe" },
      { keys: ["3"], label: "Asia" },
    ],
  },
  {
    title: "Drill in / out",
    rows: [
      { keys: ["S", "↓"], label: "Drill into selection" },
      { keys: ["W", "↑"], label: "Step back out" },
      { keys: ["Esc"], label: "Clear selection" },
    ],
  },
  {
    title: "Find & search",
    rows: [
      { keys: ["⌘", "K"], label: "Open search" },
      { keys: ["?"], label: "Show this help" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.6rem] h-[1.6rem] px-1.5 rounded-md bg-bg/80 border border-black/[.06] text-[11px] font-medium text-ink tracking-tight font-sans">
      {children}
    </kbd>
  );
}

export default function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className={`fixed inset-0 z-40 flex items-start justify-center pt-[14vh] px-4 bg-white/55 backdrop-blur-2xl transition-[opacity,backdrop-filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        ref={cardRef}
        className={`w-full max-w-[26rem] rounded-3xl bg-white/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.14),0_2px_10px_rgba(0,0,0,0.06)] border border-black/[.04] p-5 transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-3"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink tracking-tight">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-[11px] font-medium text-muted tracking-tight mb-2">
                {group.title}
              </div>
              <ul className="flex flex-col gap-1.5">
                {group.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between text-sm text-ink"
                  >
                    <span>{row.label}</span>
                    <span className="flex items-center gap-1">
                      {row.keys.map((k, i) => (
                        <span
                          key={k}
                          className="flex items-center gap-1 text-muted"
                        >
                          {i > 0 && <span className="text-[11px]">or</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
