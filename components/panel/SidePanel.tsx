"use client";

import type { Entity, GovLevel } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";
import Breadcrumb, { type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ContextBlurb from "./ContextBlurb";
import LegislationList from "./LegislationList";
import KeyFigures from "./KeyFigures";
import NewsSection from "./NewsSection";

interface SidePanelProps {
  entity: Entity | null;
  breadcrumbItems: BreadcrumbItem[];
  showViewStatesButton?: boolean;
  onViewStates?: () => void;
}

const LEVEL_LABEL: Record<GovLevel, string | null> = {
  federal: "Federal Government",
  state: "State Government",
  bloc: null,
};

const LEGISLATION_PREVIEW = 3;
const FIGURES_PREVIEW = 3;
const NEWS_PREVIEW = 3;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-ink tracking-tight mb-3">
      {children}
    </h3>
  );
}

function ShowAllLink({
  total,
  shown,
  label,
}: {
  total: number;
  shown: number;
  label: string;
}) {
  if (total <= shown) return null;
  return (
    <a
      href="#"
      className="inline-block text-xs text-muted hover:text-ink transition-colors mt-3"
    >
      Show all {total} {label} →
    </a>
  );
}

export default function SidePanel({
  entity,
  breadcrumbItems,
  showViewStatesButton = false,
  onViewStates,
}: SidePanelProps) {
  return (
    <aside className="w-96 max-h-[calc(100vh-96px)] bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden border border-black/[.04]">
      {/* Always-visible breadcrumb header */}
      <div className="px-6 pt-5 pb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {!entity ? (
        <div className="flex-1 flex items-center justify-center px-8 py-16 min-h-[200px]">
          <p className="text-xs text-muted text-center">
            Select a country or region to explore legislation
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-2 pb-5 border-b border-black/[.06]">
            <h2 className="text-2xl font-semibold text-ink tracking-tight">
              {entity.name}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StanceBadge stance={entity.stance} size="md" />
              {LEVEL_LABEL[entity.level] && (
                <span className="text-xs text-muted">
                  {LEVEL_LABEL[entity.level]}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <ContextBlurb text={entity.contextBlurb} />

            {showViewStatesButton && onViewStates && (
              <button
                type="button"
                onClick={onViewStates}
                className="self-start rounded-full bg-ink text-white text-xs font-medium px-4 py-2 hover:bg-ink/90 transition-colors"
              >
                View State Legislation →
              </button>
            )}

            {entity.legislation.length > 0 && (
              <section>
                <SectionHeading>Legislation</SectionHeading>
                <LegislationList
                  legislation={entity.legislation.slice(
                    0,
                    LEGISLATION_PREVIEW,
                  )}
                />
                <ShowAllLink
                  total={entity.legislation.length}
                  shown={LEGISLATION_PREVIEW}
                  label="bills"
                />
              </section>
            )}

            {entity.keyFigures.length > 0 && (
              <section>
                <SectionHeading>Key Figures</SectionHeading>
                <KeyFigures
                  figures={entity.keyFigures.slice(0, FIGURES_PREVIEW)}
                />
                <ShowAllLink
                  total={entity.keyFigures.length}
                  shown={FIGURES_PREVIEW}
                  label="figures"
                />
              </section>
            )}

            {entity.news.length > 0 && (
              <section>
                <SectionHeading>News</SectionHeading>
                <NewsSection news={entity.news.slice(0, NEWS_PREVIEW)} />
                <ShowAllLink
                  total={entity.news.length}
                  shown={NEWS_PREVIEW}
                  label="articles"
                />
              </section>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
