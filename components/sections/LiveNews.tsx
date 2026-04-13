"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ENTITIES } from "@/lib/placeholder-data";
import type { Entity, NewsItem } from "@/types";

interface NewsRow {
  item: NewsItem;
  entity: Entity;
}

const PREVIEW_COUNT = 12;

type ScopeFilter = "all" | "us-federal" | "us-states" | "international";

const SCOPE_OPTIONS: { key: ScopeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "us-federal", label: "US Federal" },
  { key: "us-states", label: "US States" },
  { key: "international", label: "International" },
];

type TopicFilter = "all" | "policy" | "data-centers" | "protests";

const TOPIC_OPTIONS: { key: TopicFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "policy", label: "Policy" },
  { key: "data-centers", label: "Data Centers" },
  { key: "protests", label: "Protests" },
];

// Topic is derived from headline + summary text — NewsItem doesn't carry
// a category. Buckets are matched independently (a story can be both
// Policy and Data Centers); the filter shows rows that match *any* of
// the picked topic's keywords. Keep keyword lists narrow so the buckets
// stay meaningful — broad lists collapse everything into "All".
const TOPIC_KEYWORDS: Record<Exclude<TopicFilter, "all">, RegExp> = {
  policy: /\b(bill|legislation|regulat|act\b|statute|law\b|laws\b|policy|executive order|rule\b|rules\b|framework|signed|vetoed|enacted|introduced|committee|congress|senate|house|parliament|directive|amendment)\b/i,
  "data-centers": /\b(data\s?cent(?:er|re)s?|hyperscale|gigawatt|\d+\s?(?:m|g)w\b|campus|aws|google|microsoft|meta|oracle|amazon|equinix|stargate|cooling|grid|power\s+demand)\b/i,
  protests: /\b(protest|rally|opposition|opposed|lawsuit|sued|court|moratorium|block(?:ed|ing)?|reject(?:ed)?|void(?:ed)?|halt(?:ed)?|den(?:y|ied|ying)|appeal(?:ed)?|ruling|challenge|injunction|ban\b|bans\b|restriction|outcry|backlash|residents)\b/i,
};

function matchesTopic(item: NewsItem, t: TopicFilter): boolean {
  if (t === "all") return true;
  const text = `${item.headline} ${item.summary ?? ""}`;
  return TOPIC_KEYWORDS[t].test(text);
}

type SortKey = "latest" | "relevance";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "relevance", label: "Most relevant" },
];

// Signal-weighted terms for the relevance score. High-signal words
// (lawsuit, moratorium, executive order) outweigh generic ones so a
// story about a court ruling beats a generic "AI policy" explainer.
const HIGH_SIGNAL = /\b(lawsuit|moratorium|executive order|injunction|ruling|court|passed|enacted|vetoed|signed|blocked|voided|halted|rejected|anthropic|openai|stargate|gigawatt|\d+\s?gw\b|referendum)\b/gi;
const MED_SIGNAL = /\b(policy|regulat|legislat|data\s?cent(?:er|re)|hyperscale|grid|bill\b|framework|protest|rally|opposition)\b/gi;

function countMatches(re: RegExp, text: string): number {
  return text.match(re)?.length ?? 0;
}

// Exponential recency decay with a 7-day half-life. A 1-day-old story
// keeps ~91% of its score; a 14-day-old story keeps ~25%. Beyond that
// the story has to be truly high-signal to rise.
function recencyMultiplier(dateIso: string): number {
  if (!dateIso) return 0.5;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 0.5;
  const ageDays = Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.pow(0.5, ageDays / 7);
}

function relevanceScore(row: NewsRow): number {
  const text = `${row.item.headline} ${row.item.summary ?? ""}`;
  const base =
    countMatches(HIGH_SIGNAL, text) * 3 +
    countMatches(MED_SIGNAL, text) * 1 +
    (row.item.summarySource === "article" ? 2 : 0);
  return (base + 1) * recencyMultiplier(row.item.date);
}

function matchesScope(entity: Entity, s: ScopeFilter): boolean {
  if (s === "all") return true;
  if (s === "us-federal") {
    return (
      entity.region === "na" &&
      entity.level === "federal" &&
      entity.geoId === "840"
    );
  }
  if (s === "us-states") {
    return entity.region === "na" && entity.level === "state";
  }
  return !(
    entity.region === "na" &&
    (entity.level === "state" ||
      (entity.level === "federal" && entity.geoId === "840"))
  );
}

function buildNewsRows(): NewsRow[] {
  const rows: NewsRow[] = [];
  for (const entity of ENTITIES) {
    for (const item of entity.news) {
      rows.push({ item, entity });
    }
  }
  return rows.sort((a, b) =>
    (b.item.date ?? "").localeCompare(a.item.date ?? ""),
  );
}

const LAST_UPDATED_FMT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

// "today" / "yesterday" keep the feed feeling fresh when it actually is —
// the full date is only used once a story is a few days old. Based on the
// latest news item we have, not on a pipeline-writer timestamp, so it
// reflects real content freshness.
function formatLastUpdated(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round(
    (startOf(now).getTime() - startOf(d).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return LAST_UPDATED_FMT.format(d);
}

const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return SHORT_DATE_FMT.format(d);
}

function rowMatchesQuery(row: NewsRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const fields = [row.item.headline, row.item.source, row.entity.name];
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

function LiveNewsCard({
  item,
  entityName,
}: {
  item: NewsItem;
  entityName: string;
}) {
  const hasSummary = Boolean(item.summary);

  return (
    <article className="break-inside-avoid mb-3 bg-white border border-black/[.06] rounded-2xl p-5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-black/[.12] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)] hover:-translate-y-0.5">
      {/* Headline goes straight to the source article — no click-to-expand
          indirection. The card is a display surface, not a toggle. */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <h3 className="flex-1 min-w-0 text-sm font-medium text-ink tracking-tight leading-snug group-hover:underline underline-offset-2 decoration-black/20">
          {item.headline}
        </h3>
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          aria-hidden
          className="mt-1 flex-shrink-0 text-muted/60 group-hover:text-ink transition-colors"
        >
          <path
            d="M3 3H8V8M8 3L3 8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      {hasSummary && (
        <p className="text-[13px] text-ink/75 leading-relaxed mt-2.5">
          {item.summary}
          {item.summarySource === "headline-only" && (
            <span
              className="ml-1.5 inline-block align-middle text-[10px] text-muted/80 px-1.5 py-0.5 rounded-full bg-bg/70 border border-black/[.05]"
              title="Source article was paywalled or unreachable — summary derived from the headline alone"
            >
              from headline
            </span>
          )}
        </p>
      )}

      <div className="text-[11px] text-muted mt-3 flex items-center gap-1.5 min-w-0">
        <span className="font-medium text-ink/70 truncate max-w-[10rem] flex-shrink-0">
          {item.source}
        </span>
        <span aria-hidden className="flex-shrink-0">·</span>
        <span className="flex-shrink-0">{formatShortDate(item.date)}</span>
        <span aria-hidden className="flex-shrink-0">·</span>
        <span className="truncate">{entityName}</span>
      </div>
    </article>
  );
}

interface LiveNewsProps {
  /** Render every filtered story — used on the dedicated /news page. */
  showAll?: boolean;
}

export default function LiveNews({ showAll = false }: LiveNewsProps = {}) {
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<ScopeFilter>("all");
  const [activeTopic, setActiveTopic] = useState<TopicFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("relevance");

  const allRows = useMemo(() => buildNewsRows(), []);
  const lastUpdated = useMemo(
    () => formatLastUpdated(allRows[0]?.item.date),
    [allRows],
  );

  // Pre-compute counts per scope so the chip badges are live, ignoring the
  // search query so the user can always see how much content is in each
  // bucket before searching.
  const scopeCounts = useMemo(() => {
    const counts: Record<ScopeFilter, number> = {
      all: allRows.length,
      "us-federal": 0,
      "us-states": 0,
      international: 0,
    };
    for (const r of allRows) {
      if (matchesScope(r.entity, "us-federal")) counts["us-federal"] += 1;
      else if (matchesScope(r.entity, "us-states")) counts["us-states"] += 1;
      else counts.international += 1;
    }
    return counts;
  }, [allRows]);

  // Topic counts run against the scope-filtered set so the chip numbers
  // reflect what would actually appear if you toggled to that topic
  // (without also losing the active scope choice).
  const topicCounts = useMemo<Record<TopicFilter, number>>(() => {
    const scoped = activeScope === "all"
      ? allRows
      : allRows.filter((r) => matchesScope(r.entity, activeScope));
    const counts: Record<TopicFilter, number> = {
      all: scoped.length,
      policy: 0,
      "data-centers": 0,
      protests: 0,
    };
    for (const r of scoped) {
      if (matchesTopic(r.item, "policy")) counts.policy += 1;
      if (matchesTopic(r.item, "data-centers")) counts["data-centers"] += 1;
      if (matchesTopic(r.item, "protests")) counts.protests += 1;
    }
    return counts;
  }, [allRows, activeScope]);

  const filtered = useMemo(() => {
    let rows = allRows;
    if (activeScope !== "all") {
      rows = rows.filter((r) => matchesScope(r.entity, activeScope));
    }
    if (activeTopic !== "all") {
      rows = rows.filter((r) => matchesTopic(r.item, activeTopic));
    }
    const q = query.trim();
    if (q) {
      rows = rows.filter((r) => rowMatchesQuery(r, q));
    }
    if (sortKey === "relevance") {
      rows = [...rows].sort((a, b) => relevanceScore(b) - relevanceScore(a));
    }
    // Default (latest): allRows is already date-desc from buildNewsRows.
    return rows;
  }, [allRows, activeScope, activeTopic, query, sortKey]);

  const hasMore = !showAll && filtered.length > PREVIEW_COUNT;
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT);

  return (
    <div>
      {lastUpdated && (
        <p className="text-xs text-muted -mt-6 mb-8">
          Last updated {lastUpdated}
        </p>
      )}

      {/* Search input */}
      <div className="mb-6">
        <div className="max-w-md flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-black/[.06] focus-within:border-black/20 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-muted flex-shrink-0"
          >
            <circle
              cx="6"
              cy="6"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M9.5 9.5L12.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted hover:text-ink flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 3L9 9M9 3L3 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scope row */}
      <div className="mb-4">
        <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
          Scope
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPE_OPTIONS.map((opt) => {
            const active = opt.key === activeScope;
            const count = scopeCounts[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveScope(opt.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                  active
                    ? "bg-ink text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "border border-black/[.06] text-muted hover:text-ink hover:bg-black/[.02]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] ${active ? "text-white/70" : "text-muted"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic row — derived from headline / summary keywords. A story
          can match multiple topics so picking one doesn't subtract from
          the others' counts. */}
      <div className="mb-6">
        <div className="text-[13px] font-medium text-muted tracking-tight mb-2">
          Topic
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPIC_OPTIONS.map((opt) => {
            const active = opt.key === activeTopic;
            const count = topicCounts[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveTopic(opt.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                  active
                    ? "bg-ink text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "border border-black/[.06] text-muted hover:text-ink hover:bg-black/[.02]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] ${active ? "text-white/70" : "text-muted"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort — same chip-dropdown pattern used in the other sections. */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[13px] font-medium text-muted tracking-tight">
          Sort
        </span>
        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none rounded-full bg-black/[.04] text-ink text-xs font-medium pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
          >
            <path
              d="M2.5 3.75L5 6.25L7.5 3.75"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted">
          No stories match this search.
        </div>
      ) : (
        <>
          {/* CSS columns let each card take its natural height — short
              headlines pack tight, long ones stretch. The browser
              re-flows automatically on resize. `break-inside-avoid`
              keeps a card from being split between columns. */}
          <div className="columns-1 md:columns-2 gap-3 [column-fill:balance]">
            {visible.map(({ item, entity }) => (
              <LiveNewsCard
                key={item.id}
                item={item}
                entityName={entity.name}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Link
                href="/news"
                className="rounded-full border border-black/[.06] text-muted hover:text-ink px-5 py-2 text-xs font-medium transition-colors"
              >
                Show all {filtered.length} stories →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
