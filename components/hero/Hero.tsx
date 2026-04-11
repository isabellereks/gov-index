"use client";

import GlobeHero from "./GlobeHero";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

type Props = { progress: number };

export default function Hero({ progress }: Props) {
  const headlineOpacity = clamp(1 - progress / 0.2, 0, 1);
  const headlineY = -progress * 40;

  const lockProgress = clamp((progress - 0.18) / 0.35, 0, 1);
  const phi = -15 - lockProgress * 25;
  const lockLambda = lockProgress > 0 ? 100 : undefined;

  const zoom = clamp((progress - 0.55) / 0.45, 0, 1);
  const globeScale = 1 + zoom * 1.8;
  const globeOpacity = clamp(1 - (zoom - 0.35) / 0.5, 0, 1);
  const bgOpacity = 1 - zoom;

  const inactive = progress > 0.92;

  return (
    <section
      className="fixed inset-0 z-20 overflow-hidden"
      style={{ pointerEvents: inactive ? "none" : "auto" }}
      aria-hidden={inactive}
    >
      <div
        className="absolute inset-0 bg-bg"
        style={{ opacity: bgOpacity }}
      />

      <div
        className="absolute inset-x-0 top-[26vh] z-0 px-6 text-center pointer-events-none"
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          willChange: "transform, opacity",
        }}
      >
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-ink text-balance leading-[1.05]">
          Tracking AI policies
          <br />
          in your hometown
        </h1>
      </div>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{
          opacity: globeOpacity,
          transform: `translateY(26vh) scale(${globeScale})`,
          willChange: "transform, opacity",
        }}
      >
        <div className="w-[min(95vmin,900px)] h-[min(95vmin,900px)]">
          <GlobeHero phi={phi} lockLambda={lockLambda} />
        </div>
      </div>
    </section>
  );
}
