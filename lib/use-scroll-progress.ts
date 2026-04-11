"use client";

import { useEffect, useState } from "react";

/**
 * Returns the hero → map reveal progress, 0 to 1.
 *
 * Anchored to a fixed reveal distance (default 2 viewport heights), NOT the
 * total document height. This way the reveal animation completes by the time
 * the user has scrolled past the dedicated reveal spacer, and any content
 * beyond that scrolls normally without re-driving the reveal.
 */
export function useScrollProgress(revealVh = 2) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const max = window.innerHeight * revealVh;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(Math.max(0, Math.min(1, p)));
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", compute);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [revealVh]);

  return progress;
}
