"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewTarget } from "@/types";
import { search, type SearchItem, type SearchKind } from "@/lib/search";

/**
 * Spotlight-style command palette. Always renders as a modal — the
 * caller controls when it's visible. Triggered from the top toolbar
 * (chip click) or from the global ⌘K shortcut bound there.
 */
interface SearchPillProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: ViewTarget) => void;
}

const KIND_DOT: Record<SearchKind, string> = {
  country: "bg-stance-favorable",
  state: "bg-stance-review",
  bloc: "bg-stance-none",
  bill: "bg-stance-restrictive",
};

const KIND_TAG: Record<SearchKind, string> = {
  country: "Country",
  state: "State",
  bloc: "Region",
  bill: "Bill",
};

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="text-muted flex-shrink-0"
    >
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 9.5L12.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Clear search"
      className="text-muted hover:text-ink flex-shrink-0"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M3 3L9 9M9 3L3 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export default function SearchPill({ open, onClose, onNavigate }: SearchPillProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => (query.trim() ? search(query, 8) : []), [query]);

  // Reset query when the modal is dismissed so re-opening doesn't show a
  // stale result list under the new query.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIdx(0);
      return;
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Click-outside dismiss. Bound only while open so it doesn't run idle
  // listeners when the chrome is hidden.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!modalRef.current?.contains(target)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onClose]);

  function pick(item: SearchItem) {
    onNavigate(item.target);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[activeIdx]);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className={`fixed inset-0 z-40 flex items-start justify-center pt-[14vh] px-4 bg-white/55 backdrop-blur-2xl transition-[opacity,backdrop-filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-[28rem] flex flex-col gap-2 transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-3"
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-white/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.06)] border border-black/[.04]">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search countries, states, bills…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none min-w-0"
          />
          {query && (
            <ClearButton
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            />
          )}
        </div>
        {results.length > 0 && (
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04] max-h-[60vh] overflow-y-auto p-1">
            {results.map((r, idx) => {
              const active = idx === activeIdx;
              return (
                <button
                  key={r.id}
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => pick(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl flex items-start gap-3 transition-colors ${
                    active ? "bg-bg/80" : "hover:bg-bg/60"
                  }`}
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${KIND_DOT[r.kind]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink font-medium tracking-tight truncate">
                      {r.label}
                    </div>
                    {r.sublabel && (
                      <div className="text-xs text-muted truncate">{r.sublabel}</div>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-muted/70 tracking-tight mt-1 flex-shrink-0">
                    {KIND_TAG[r.kind]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
