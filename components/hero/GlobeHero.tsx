"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
} from "react-simple-maps";

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const OCEAN = "#A8D5E6";
const LAND = "#C2CEBE";
const GRATICULE = "rgba(255, 255, 255, 0.28)";

const AUTO_STEP_DEG = 0.12;
const IDLE_RESUME_MS = 1200;
const LERP_RATE = 0.08;

type Props = {
  phi?: number;
  lockLambda?: number;
};

export default function GlobeHero({ phi = -15, lockLambda }: Props) {
  const [lambda, setLambda] = useState(20);
  const draggingRef = useRef(false);
  const lastPointerXRef = useRef<number | null>(null);
  const idleSinceRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const lockLambdaRef = useRef<number | undefined>(lockLambda);

  useEffect(() => {
    lockLambdaRef.current = lockLambda;
  }, [lockLambda]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    idleSinceRef.current = performance.now();
    let raf = 0;
    const tick = () => {
      const lock = lockLambdaRef.current;
      if (lock !== undefined) {
        setLambda((current) => {
          const diff = ((((lock - current) % 360) + 540) % 360) - 180;
          if (Math.abs(diff) < 0.05) return lock;
          return current + diff * LERP_RATE;
        });
      } else if (
        !draggingRef.current &&
        !reducedMotionRef.current &&
        performance.now() - idleSinceRef.current > IDLE_RESUME_MS
      ) {
        setLambda((l) => l + AUTO_STEP_DEG);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const projectionConfig = useMemo(
    () => ({
      scale: 380,
      rotate: [lambda, phi, 0] as [number, number, number],
    }),
    [lambda, phi],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lockLambdaRef.current !== undefined) return;
    draggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || lastPointerXRef.current === null) return;
    const dx = e.clientX - lastPointerXRef.current;
    lastPointerXRef.current = e.clientX;
    setLambda((l) => l + dx * 0.35);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    lastPointerXRef.current = null;
    idleSinceRef.current = performance.now();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      role="img"
      aria-label="Rotating globe of Earth"
      className="relative w-full h-full touch-pan-y select-none cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <ComposableMap
        width={800}
        height={800}
        projection="geoOrthographic"
        projectionConfig={projectionConfig}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="globe-ocean" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#CDE7F1" />
            <stop offset="100%" stopColor={OCEAN} />
          </radialGradient>
          <radialGradient id="globe-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(20,60,90,0.22)" />
          </radialGradient>
        </defs>

        <Sphere
          id="globe-sphere"
          fill="url(#globe-ocean)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={0.6}
        />
        <Graticule stroke={GRATICULE} strokeWidth={0.5} />
        <Geographies geography={WORLD_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: LAND, stroke: "none", outline: "none" },
                  hover: { fill: LAND, stroke: "none", outline: "none" },
                  pressed: { fill: LAND, stroke: "none", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        <circle
          cx={400}
          cy={400}
          r={380}
          fill="url(#globe-shadow)"
          pointerEvents="none"
        />
      </ComposableMap>
    </div>
  );
}
