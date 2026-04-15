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

    // Heartbeat + count fetch. If the API is unreachable or KV isn't
    // provisioned yet (503 kv-not-configured), we fall back to the
    // cosmetic drift from seededBase so the pill never shows "0".
    let usingFallback = false;
    async function heartbeat() {
      try {
        const r = await fetch("/api/visitors", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
          keepalive: true,
        });
        if (!r.ok) usingFallback = true;
      } catch {
        usingFallback = true;
      }
    }

    async function fetchCount() {
      try {
        const r = await fetch("/api/visitors", { cache: "no-store" });
        if (!r.ok) {
          // 503 = KV not provisioned, or 5xx. Fall back to cosmetic
          // drift so the pill still has a number — the infra is down,
          // we never want to claim 0.
          usingFallback = true;
          applyFallback();
          return;
        }
        const data = (await r.json()) as { count?: number };
        if (typeof data.count !== "number") {
          usingFallback = true;
          applyFallback();
          return;
        }
        // Trust the API. Only floor at 1 — we're on the page, so we
        // are ourselves a session (our heartbeat POST may not have
        // been recorded in the read snapshot, especially right after
        // mount). Everything else reflects real KV state.
        setCount(Math.max(1, data.count));
        usingFallback = false;
      } catch {
        usingFallback = true;
        applyFallback();
      }
    }

    function applyFallback() {
      if (!usingFallback) return;
      setCount((c) => {
        if (c > 0) return c;
        return seededBase();
      });
    }

    // Initial + recurring. Heartbeat every 60s (well under the 5-min
    // window the server GCs on). Count refresh every 20s so the
    // displayed number feels live without hammering the API.
    heartbeat().then(fetchCount);
    const beat = window.setInterval(heartbeat, 60_000);
    const poll = window.setInterval(fetchCount, 20_000);

    // Re-heartbeat the instant a user alt-tabs back in. Without this, a
    // viewer who switches away for ~5 min falls out of the window and
    // the number appears to drop even though they're still "on".
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        heartbeat().then(fetchCount);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Cosmetic drift — only takes effect while `usingFallback` is true.
    // Runs continuously so the number moves naturally when the API is
    // down, and is a silent no-op when the real count is flowing.
    const drift = window.setInterval(() => {
      if (!usingFallback) return;
      setCount((c) => {
        const base = seededBase();
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = c + delta;
        const floor = Math.max(12, base - 18);
        const ceil = base + 22;
        if (next < floor) return floor;
        if (next > ceil) return ceil;
        return next;
      });
    }, 3500 + Math.random() * 2500);

    const rotate = window.setInterval(() => {
      setLabelIdx((i) => (i + 1) % LABELS.length);
    }, 6000);

    return () => {
      window.clearInterval(beat);
      window.clearInterval(poll);
      window.clearInterval(drift);
      window.clearInterval(rotate);
      document.removeEventListener("visibilitychange", onVisibility);
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
