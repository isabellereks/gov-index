/**
 * Placeholder for the content that will live below the map.
 * Pure structure — no real data wiring. Solid white background covers
 * the fixed map underneath as the user scrolls past it.
 */
export default function PageSkeleton() {
  return (
    <section className="relative z-10 bg-white">
      {/* Section 1 — title + lede */}
      <div className="max-w-5xl mx-auto px-8 pt-32 pb-24">
        <div className="text-xs uppercase tracking-widest text-muted mb-4">
          Latest activity
        </div>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink max-w-2xl">
          What&rsquo;s moving this week
        </h2>
        <p className="text-base text-muted mt-6 max-w-xl leading-relaxed">
          Bills that advanced, legislators who introduced new measures, and the
          stories shaping data center and AI policy worldwide.
        </p>
      </div>

      {/* Section 2 — trending bills grid */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <SectionHeader eyebrow="Trending bills" title="Moving through committee" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} variant="bill" />
          ))}
        </div>
      </div>

      {/* Section 3 — active legislators row */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <SectionHeader
          eyebrow="Most active"
          title="Legislators driving the conversation"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonCard key={i} variant="figure" />
          ))}
        </div>
      </div>

      {/* Section 4 — chart placeholder */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <SectionHeader eyebrow="Policy pulse" title="Stance over time" />
        <div className="mt-8 bg-bg/60 rounded-3xl p-8 h-80 flex items-end gap-3">
          {[0.4, 0.55, 0.7, 0.5, 0.65, 0.8, 0.6, 0.75, 0.9, 0.7, 0.85, 0.65].map(
            (h, i) => (
              <div
                key={i}
                className="flex-1 bg-black/[.06] rounded-xl"
                style={{ height: `${h * 100}%` }}
              />
            ),
          )}
        </div>
      </div>

      {/* Section 5 — newsletter / footer-ish */}
      <div className="max-w-5xl mx-auto px-8 pb-32">
        <div className="bg-bg/60 rounded-3xl p-12 text-center">
          <h3 className="text-2xl font-semibold tracking-tight text-ink">
            Get a weekly digest
          </h3>
          <p className="text-sm text-muted mt-3 max-w-md mx-auto">
            One short email summarizing the bills, legislators, and stories
            that moved this week.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 max-w-sm mx-auto">
            <div className="flex-1 h-10 rounded-full bg-white border border-black/[.06]" />
            <div className="h-10 w-24 rounded-full bg-ink" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/[.06]">
        <div className="max-w-5xl mx-auto px-8 py-10 flex items-center justify-between text-xs text-muted">
          <span>Track Policy</span>
          <div className="flex gap-6">
            <span>About</span>
            <span>Methodology</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted mb-2">
        {eyebrow}
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h3>
    </div>
  );
}

function SkeletonCard({ variant }: { variant: "bill" | "figure" }) {
  if (variant === "figure") {
    return (
      <div className="bg-bg/60 rounded-2xl p-5 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-black/[.06] mb-4" />
        <div className="h-3 w-24 rounded-full bg-black/[.06] mb-2" />
        <div className="h-2.5 w-16 rounded-full bg-black/[.04]" />
      </div>
    );
  }
  return (
    <div className="bg-bg/60 rounded-2xl p-5">
      <div className="h-2.5 w-16 rounded-full bg-black/[.06] mb-3" />
      <div className="h-3.5 w-full rounded-full bg-black/[.08] mb-2" />
      <div className="h-3.5 w-3/4 rounded-full bg-black/[.08] mb-4" />
      <div className="h-2 w-full rounded-full bg-black/[.04] mb-1.5" />
      <div className="h-2 w-5/6 rounded-full bg-black/[.04] mb-1.5" />
      <div className="h-2 w-4/6 rounded-full bg-black/[.04]" />
      <div className="mt-4 h-1 w-full rounded-full bg-black/[.06]">
        <div className="h-full w-1/2 rounded-full bg-stance-review" />
      </div>
    </div>
  );
}
