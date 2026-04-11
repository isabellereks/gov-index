"use client";

import Hero from "@/components/hero/Hero";
import MapShell from "@/components/map/MapShell";
import PageSkeleton from "@/components/skeleton/PageSkeleton";
import { useScrollProgress } from "@/lib/use-scroll-progress";

export default function Page() {
  const progress = useScrollProgress();
  return (
    <>
      <MapShell revealProgress={progress} />
      <Hero progress={progress} />
      {/* Reveal window (200vh) + dwell (200vh) so the user lands on the
          fully-revealed map and can use it before scrolling further. */}
      <div className="h-[400vh]" aria-hidden />
      <PageSkeleton />
    </>
  );
}
