"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewTarget } from "@/types";
import { search, type SearchItem, type SearchKind } from "@/lib/search";

interface SearchPillProps {
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

export default function SearchPill({ onNavigate }: SearchPillProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => (query.trim() ? search(query, 8) : []), [query]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function pick(item: SearchItem) {
    onNavigate(item.target);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
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
    <div ref={containerRef} className="fixed bottom-6 right-6 z-30 w-[22rem]">
      {open && results.length > 0 && (
        <div className="mb-2 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04] max-h-[60vh] overflow-y-auto p-1">
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
                    <div className="text-xs text-muted truncate">
                      {r.sublabel}
                    </div>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted mt-1 flex-shrink-0">
                  {KIND_TAG[r.kind]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-muted flex-shrink-0"
        >
          <circle
            cx="6"
            cy="6"
            r="4.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9.5 9.5L12.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search countries, states, bills…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
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
        )}
      </div>
    </div>
  );
}
