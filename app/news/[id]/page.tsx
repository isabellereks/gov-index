import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTITIES } from "@/lib/placeholder-data";
import NewsSection from "@/components/panel/NewsSection";
import StanceBadge from "@/components/ui/StanceBadge";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const entity = ENTITIES.find((e) => e.id === decodedId);
  if (!entity) notFound();

  const total = entity.news.length;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-8 py-14">
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

        <div className="mb-10">
          <h1 className="text-4xl font-semibold text-ink tracking-tight leading-[1.05]">
            {entity.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted tracking-tight">
                Data centers
              </span>
              <StanceBadge stance={entity.stanceDatacenter} size="md" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted tracking-tight">AI</span>
              <StanceBadge stance={entity.stanceAI} size="md" />
            </div>
            <span className="text-sm text-muted">
              {total} {total === 1 ? "article" : "articles"}
            </span>
          </div>
        </div>

        {total > 0 ? (
          <NewsSection news={entity.news} />
        ) : (
          <p className="text-sm text-muted">
            No news on file for {entity.name}.
          </p>
        )}
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return ENTITIES.filter((e) => e.news.length > 0).map((e) => ({ id: e.id }));
}
