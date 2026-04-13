import Link from "next/link";
import LiveNews from "@/components/sections/LiveNews";

export default function NewsIndexPage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-8 py-14">
        <Link
          href="/#news"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-10"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2L3.5 6L7.5 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to map
        </Link>
        <h1 className="text-4xl font-semibold text-ink tracking-tight leading-[1.05] mb-2">
          Every story we&rsquo;re tracking
        </h1>
        <p className="text-sm text-muted mb-10">
          The full newswire across every jurisdiction.
        </p>
        <LiveNews showAll />
      </div>
    </main>
  );
}
