"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { REGION_LABEL, REGION_ORDER, type Region, type ViewTarget } from "@/types";
import SearchPill from "./SearchPill";
import ShortcutsHelp from "./ShortcutsHelp";

interface TopToolbarProps {
  region: Region;
  onRegionChange: (region: Region) => void;
  onSearchNavigate: (target: ViewTarget) => void;
}

const SHORT_LABEL: Record<Region, string> = {
  na: "N. America",
  eu: "Europe",
  asia: "Asia",
};

function isMacLike(): boolean {
  if (typeof navigator === "undefined") return true;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

/**
 * The single top-of-map toolbar — region tabs, the search trigger, and
 * the keyboard-shortcuts toggle. Replaces the older standalone
 * RegionNav (top-right) and the always-visible SearchPill (bottom-right
 * on lg, floating icon on mobile), so the map chrome reads as one
 * intentional bar instead of three competing islands.
 */
export default function TopToolbar({
  region,
  onRegionChange,
  onSearchNavigate,
}: TopToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mac, setMac] = useState(true);

  useEffect(() => setMac(isMacLike()), []);

  // Global hotkeys for the toolbar's modals. ⌘K / Ctrl+K opens search,
  // `?` opens the shortcuts cheat sheet. Both ignore typing in inputs
  // so the search modal's own input never collides with itself.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const inField =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);

      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setHelpOpen(false);
        return;
      }
      if (!inField && !cmd && !e.altKey && e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        role="toolbar"
        aria-label="Map controls"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1 p-1.5 lg:p-1 rounded-full bg-white/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04] max-w-[calc(100vw-2rem)]"
      >
        {/* Region tabs — the ink pill SLIDES between regions via
            framer-motion `layoutId`. Squishy spring: lower damping so it
            overshoots a touch, higher mass so it settles with weight. */}
        <div role="tablist" aria-label="Region" className="relative flex items-center gap-0.5">
          {REGION_ORDER.map((r) => {
            const active = r === region;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={REGION_LABEL[r]}
                onClick={() => {
                  if (!active) onRegionChange(r);
                }}
                className={`relative px-3.5 h-9 lg:px-3 lg:h-7 inline-flex items-center justify-center rounded-full text-[12px] lg:text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.94] ${
                  active
                    ? "text-white"
                    : "text-muted hover:text-ink hover:bg-black/[.04]"
                }`}
                style={{ transitionProperty: "color, transform, background-color" }}
              >
                {active && (
                  <motion.span
                    layoutId="toolbar-region-indicator"
                    className="absolute inset-0 rounded-full bg-ink"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 36,
                      mass: 0.7,
                    }}
                  />
                )}
                <span className="relative z-10">{SHORT_LABEL[r]}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 bg-black/[.08] mx-1" aria-hidden />

        {/* Search trigger — chip on lg, icon-only on small to save width */}
        <motion.button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
          className="h-9 lg:h-7 inline-flex items-center gap-2 px-2.5 lg:px-2 rounded-full text-muted hover:text-ink hover:bg-black/[.04] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9.5 9.5L12.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="hidden sm:inline text-[11px] tracking-tight">
            Search
          </span>
          <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-muted/70 font-medium">
            <kbd className="font-sans">{mac ? "⌘" : "Ctrl"}</kbd>
            <kbd className="font-sans">K</kbd>
          </span>
        </motion.button>

        {/* Help toggle — same squishy tap feedback, filled state when open */}
        <motion.button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          aria-label="Keyboard shortcuts"
          aria-pressed={helpOpen}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
          className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            helpOpen
              ? "bg-ink text-white"
              : "text-muted hover:text-ink hover:bg-black/[.04]"
          }`}
        >
          ?
        </motion.button>
      </div>

      <SearchPill
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(t) => {
          setSearchOpen(false);
          onSearchNavigate(t);
        }}
      />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
