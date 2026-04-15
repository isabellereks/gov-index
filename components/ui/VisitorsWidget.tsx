"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Small "live visitors" pill — pulsing green dot, tabular count, rotating
 * micro-label. Purely cosmetic: the count is a client-side random walk
 * seeded off the current hour, not a real visitor number. Swap the
 * effect below for a real source (edge KV, Plausible API, etc.) when
 * you're ready.
 *
 * Visual chrome matches the rest of the app — translucent white pill
 * with the same shadow recipe used by the top toolbar.
 */

const LABELS = [
  "watching the grid",
  "counting bills",
  "tracking politicians",
  "scouting local bills",
  "watching the news",
  "finding data centers",
];

function seededBase(): number {
  // Deterministic baseline per hour so the number doesn't teleport every
  // render. Between ~30 and ~160, biased up through the UTC afternoon.
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfMonth = now.getUTCDate();
  const peak = 120;
  const trough = 35;
  const dist = Math.abs(hour - 15); // 15:00 UTC ~= midday US business hours
  const amplitude = ((peak - trough) * (12 - Math.min(12, dist))) / 12;
  const jitter = (dayOfMonth * 7) % 19;
  return Math.round(trough + amplitude + jitter);
}

export default function VisitorsWidget() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [labelIdx, setLabelIdx] = useState(0);

  // Pick a stable starting label so SSR → client hydration doesn't
  // flicker. Rotates every ~6s once mounted.
  const startingLabel = useMemo(() => Math.floor(Math.random() * LABELS.length), []);

  // Longest possible string the slot ever holds, used as a ghost
  // measurer so the slot's actual rendered width matches the widest
  // label exactly — no truncation, no reflow. `ch` is too coarse for
  // proportional fonts (Inter), so we lay the longest copy out invisibly
  // and let the browser size it.
  const longestLabel = useMemo(() => {
    const widest = LABELS.reduce((a, b) => (b.length > a.length ? b : a), "");
    return `people ${widest}`;
  }, []);

  useEffect(() => {
    setMounted(true);
    setLabelIdx(startingLabel);

    // Session id persists for the tab lifetime. Using sessionStorage
    // (not localStorage) means each new tab counts as a fresh visitor
    // while a user clicking around stays one session.
    let sessionId = sessionStorage.getItem("visitor-session");
    if (!sessionId) {
      sessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      sessionStorage.setItem("visitor-session", sessionId);
    }

    // ─── Request budget ───────────────────────────────────────────────
    //
    // Vercel's free tier allows 1M edge requests/month. The old setup
    // (heartbeat every 30-60s + poll every 15-20s) would hit that ceiling
    // with just a handful of concurrent viewers. Now:
    //
    //   - one combined POST per hour — heartbeat + count in one response
    //   - cosmetic drift between hourly snaps (±5 around the last truth)
    //     so the number looks live without additional requests
    //
    // That's ~720 edge requests per tab per month vs. the previous 172k.
    // The server's WINDOW_MS is 65 min so an hourly heartbeat stays
    // inside the "active now" window.
    const DRIFT_RANGE = 5;
    // Anchor the drift around the most recent real count. Ref because
    // the drift interval closes over state but doesn't need to re-render
    // on each write.
    const anchorRef = { current: 0 };

    async function heartbeat() {
      try {
        const r = await fetch("/api/visitors", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
          keepalive: true,
          cache: "no-store",
        });
        if (!r.ok) {
          // 5xx / KV unavailable — leave the displayed count alone and
          // let drift keep it moving around the last known anchor (or
          // a seeded base on very first load).
          if (anchorRef.current === 0) anchorRef.current = seededBase();
          return;
        }
        const data = (await r.json()) as { count?: number };
        if (typeof data.count !== "number") {
          if (anchorRef.current === 0) anchorRef.current = seededBase();
          return;
        }
        // Trust the API. Floor at 1 — we're always a session ourselves.
        const real = Math.max(1, data.count);
        anchorRef.current = real;
        setCount(real);
      } catch {
        if (anchorRef.current === 0) anchorRef.current = seededBase();
      }
    }

    // Initial heartbeat; then once an hour.
    heartbeat();
    const beat = window.setInterval(heartbeat, 60 * 60 * 1000);

    // Cosmetic drift — ±DRIFT_RANGE around the anchor, random walk
    // every few seconds. Runs whether the API is up or down; when it's
    // up, each hourly heartbeat resets the anchor to the real count,
    // and the drift starts moving around that new value. When it's
    // down, `seededBase()` provided an initial anchor so the pill
    // never reads 0.
    const drift = window.setInterval(() => {
      setCount((c) => {
        const anchor = anchorRef.current || seededBase();
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = c + delta;
        const floor = Math.max(1, anchor - DRIFT_RANGE);
        const ceil = anchor + DRIFT_RANGE;
        if (next < floor) return floor;
        if (next > ceil) return ceil;
        return next;
      });
    }, 4000 + Math.random() * 3000);

    const rotate = window.setInterval(() => {
      setLabelIdx((i) => (i + 1) % LABELS.length);
    }, 6000);

    return () => {
      window.clearInterval(beat);
      window.clearInterval(drift);
      window.clearInterval(rotate);
    };
  }, [startingLabel]);

  if (!mounted) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-2xl border border-black/[.04] px-3 py-1.5 text-[11px] tracking-tight"
      style={{
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
      }}
      aria-live="polite"
      aria-atomic="true"
      title="Approximate live visitor count"
    >
      <span className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
        <span className="absolute inset-0 rounded-full bg-stance-favorable/50 animate-ping" />
        <span className="relative w-2 h-2 rounded-full bg-stance-favorable" />
      </span>
      {/* Count: gentle fade-slide on increment so the digit change is
          felt without snapping. Tabular-nums keeps the slot width
          stable across digit changes. */}
      <span
        className="text-ink font-semibold tabular-nums relative inline-block overflow-hidden align-middle"
        style={{
          // 1.25em so the line-box has room for descenders (tabular
          // nums don't descend, but keeping count + label slot heights
          // identical avoids a tiny vertical mismatch).
          height: "1.25em",
          lineHeight: 1.25,
          minWidth: "2ch",
          textAlign: "right",
        }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={count}
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-60%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 block whitespace-nowrap text-right"
            style={{ font: "inherit", lineHeight: 1.25, willChange: "transform, opacity" }}
          >
            {count.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </span>
      {/* Slot-machine label flip. Both spans live absolutely inside a
          relative slot so they overlap during transition (no layout pop,
          no parent reflow). Width pinned to the longest label so the
          pill doesn't jitter as labels swap. Tween easing instead of
          spring — springs overshoot text and read as glitch on a
          ~1em tall surface. */}
      <span
        className="text-muted relative inline-block overflow-hidden align-middle"
        style={{
          // Taller than 1em so descenders on "p", "g", "y" don't get
          // clipped by the overflow-hidden track. 1.25em matches the
          // count slot so they align on the same baseline.
          height: "1.25em",
          lineHeight: 1.25,
        }}
      >
        {/* Invisible width-setter — sizes the slot to the widest label
            in proportional units (Inter) so the pill width never
            shifts when labels rotate. aria-hidden + visibility:hidden
            so it doesn't reach AT or paint. */}
        <span
          aria-hidden
          className="invisible whitespace-nowrap"
          style={{ font: "inherit", lineHeight: 1 }}
        >
          {longestLabel}
        </span>
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={labelIdx}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 block whitespace-nowrap"
            style={{
              font: "inherit",
              lineHeight: 1.25,
              willChange: "transform, opacity",
            }}
          >
            {count === 1 ? "person" : "people"} {LABELS[labelIdx]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
