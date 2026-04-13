"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Hero from "@/components/hero/Hero";
import MapShell from "@/components/map/MapShell";
import SummaryBar from "@/components/sections/SummaryBar";
import DimensionToggle from "@/components/sections/DimensionToggle";
import AIOverview from "@/components/sections/AIOverview";
import LegislationTable from "@/components/sections/LegislationTable";
import DataCentersOverview from "@/components/sections/DataCentersOverview";
import LiveNews from "@/components/sections/LiveNews";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import type {
  Dimension,
  DimensionLens,
  Region,
  ViewTarget,
} from "@/types";

// Ease-out quart: strong, smooth deceleration — used for any RAF-driven
// scroll that needs to land past the hero reveal.
function smoothScrollToMap(duration = 1200) {
  if (typeof window === "undefined") return;
  // `useScrollProgress(2)` treats 2 viewport heights as a full reveal, so
  // scrolling to 2.2vh lands the user safely past the reveal with chrome
  // visible. Stay put if we're already past that point — no need to yank
  // the page around on every table click.
  const targetY = window.innerHeight * 2.2;
  const startY = window.scrollY;
  if (startY >= targetY - 1) return;
  const distance = targetY - startY;
  const startTime = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 4);
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Page() {
  const progress = useScrollProgress();
  const [dimension, setDimension] = useState<Dimension>("overall");
  const [lens, setLens] = useState<DimensionLens>("datacenter");
  const navigateRef = useRef<((t: ViewTarget) => void) | null>(null);

  const handleNavigateToEntity = (t: ViewTarget) => {
    navigateRef.current?.(t);
    // Land the user on the revealed map, not back at the hero. The old
    // `scrollTo({top: 0})` dumped people onto the homepage every time they
    // clicked a bill row.
    smoothScrollToMap();
  };

  const handleGlobeRegionClick = (region: Region) => {
    // Update the map state first — the map is already mounted under the hero,
    // so by the time the user scrolls into view it's already on the right
    // region. Then run a custom RAF-driven scroll so the reveal animation
    // plays slowly and smoothly.
    navigateRef.current?.({
      region,
      naView: "countries",
      selectedGeoId: null,
    });
    smoothScrollToMap(1800);
  };

  return (
    <>
      <MapShell
        revealProgress={progress}
        dimension={dimension}
        lens={lens}
        navigateRef={navigateRef}
      />
      <Hero progress={progress} onRegionClick={handleGlobeRegionClick} />
      <div className="h-[400vh]" aria-hidden />

      {/* Section 1 — At a glance: summary stats + color-by toggle */}
      <section className="relative z-10 bg-white border-t border-black/[.06]">
        <div className="max-w-5xl mx-auto px-8 pt-20 pb-16">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
            01 · At a glance
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-10">
            State of US policy
          </h2>
          <SummaryBar lens={lens} />
          <div className="mt-12">
            <DimensionToggle
              dimension={dimension}
              onChange={setDimension}
              lens={lens}
              onLensChange={setLens}
            />
          </div>
        </div>
      </section>

      {/* Section 2 — AI overview narrative */}
      <section className="relative z-10 bg-bg border-t border-black/[.06]">
        <div className="max-w-5xl mx-auto px-8 py-20">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
            02 · Latest developments
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-10">
            What happened this week
          </h2>
          <AIOverview />
        </div>
      </section>

      {/* Section 3 — Full legislation table */}
      <section
        id="legislation"
        className="relative z-10 bg-white border-t border-black/[.06] scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-8 pt-20 pb-24">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
            03 · The full record
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-10">
            Every bill we&rsquo;re tracking
          </h2>
          <LegislationTable
            dimension={dimension}
            onNavigateToEntity={handleNavigateToEntity}
          />
        </div>
      </section>

      {/* Section 4 — Where the compute lives: data center inventory */}
      <section
        id="datacenters"
        className="relative z-10 bg-bg border-t border-black/[.06] scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-8 pt-20 pb-24">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
            04 · Where the compute lives
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-10">
            Data centers we&rsquo;re tracking
          </h2>
          <DataCentersOverview onNavigateToEntity={handleNavigateToEntity} />
        </div>
      </section>

      {/* Section 5 — Live news feed */}
      <section
        id="news"
        className="relative z-10 bg-white border-t border-black/[.06] scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-8 pt-20 pb-24">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
            05 · From the wire
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-[1.1] mb-10">
            Live news
          </h2>
          <LiveNews />
        </div>
      </section>

      {/* Footer */}
      <section className="relative z-10 bg-white border-t border-black/[.06]">
        <div className="max-w-5xl mx-auto px-8 py-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <span>Track Policy</span>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-ink transition-colors">
              About
            </Link>
            <Link
              href="/methodology"
              className="hover:text-ink transition-colors"
            >
              Methodology
            </Link>
            <Link href="/contact" className="hover:text-ink transition-colors">
              Contact
            </Link>
          </div>
          <span>
            Built by{" "}
            <a
              href="https://x.com/isareksopuro"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              @isareksopuro
            </a>
          </span>
        </div>
      </section>
    </>
  );
}
