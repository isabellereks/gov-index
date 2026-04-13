"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, MotionConfig } from "framer-motion";
import type { DataCenter, DimensionLens, Entity, GovLevel } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";
import ContextBlurb from "./ContextBlurb";
import LegislationList from "./LegislationList";
import KeyFigures from "./KeyFigures";
import NewsSection from "./NewsSection";
import FacilityDetail from "./FacilityDetail";
import DataCentersList from "./DataCentersList";
import { facilitiesForEntity } from "@/lib/datacenters";

interface SidePanelProps {
  entity: Entity | null;
  showViewStatesButton?: boolean;
  onViewStates?: () => void;
  visibility?: number;
  size: "min" | "md";
  onSizeChange: (s: "min" | "md") => void;
  isMobileViewport: boolean;
  /** When set, the panel renders facility detail instead of entity content. */
  facility?: DataCenter | null;
  onCloseFacility?: () => void;
  /** Pins a facility from the Data Centers tab. */
  onSelectFacility?: (dc: DataCenter) => void;
  lens?: DimensionLens;
}

const LEVEL_LABEL: Record<GovLevel, string | null> = {
  federal: "Federal Government",
  state: "State Government",
  bloc: null,
};

type Layer = "legislation" | "figures" | "news" | "datacenters";
type Position = "left" | "right" | "bottom";
type Size = "min" | "md";

const LEGISLATION_PREVIEW = 5;
const FIGURES_PREVIEW = 3;
const NEWS_PREVIEW = 3;
const DC_PREVIEW = 6;

// Bouncy spring — more pronounced overshoot for the rubber-band feel.
const SPRING = "cubic-bezier(0.5, 1.55, 0.4, 1)";
const DUR = "650ms";
const TRANSITION = `transform ${DUR} ${SPRING}, width ${DUR} ${SPRING}, min-height ${DUR} ${SPRING}, max-height ${DUR} ${SPRING}, opacity 250ms ease`;

function ExpandToggle({
  total,
  shown,
  label,
  expanded,
  onToggle,
}: {
  total: number;
  shown: number;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (total <= shown) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-block text-xs text-muted hover:text-ink transition-colors mt-3"
    >
      {expanded ? `Show fewer ${label}` : `Show all ${total} ${label} →`}
    </button>
  );
}

function SeeAllLink({
  total,
  shown,
  label,
  href,
}: {
  total: number;
  shown: number;
  label: string;
  href: string;
}) {
  if (total <= shown) return null;
  return (
    <Link
      href={href}
      className="inline-block text-xs text-muted hover:text-ink transition-colors mt-3"
    >
      See all {total} {label} →
    </Link>
  );
}

function ToolbarButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-black/[.04] transition-colors flex-shrink-0"
    >
      {children}
    </button>
  );
}

export default function SidePanel({
  entity,
  showViewStatesButton = false,
  onViewStates,
  visibility = 1,
  size,
  onSizeChange,
  isMobileViewport,
  facility = null,
  onCloseFacility,
  onSelectFacility,
  lens = "datacenter",
}: SidePanelProps) {
  // Mobile defaults to the bottom-anchored card; desktop to top-left.
  // Derived state (not initial useState) so it actually tracks the
  // useSyncExternalStore matchMedia subscription on the client. Once the
  // user makes an explicit pick it sticks.
  const [explicitPosition, setExplicitPosition] = useState<Position | null>(
    null,
  );
  const position: Position =
    explicitPosition ?? (isMobileViewport ? "bottom" : "left");
  const setPosition = (p: Position) => setExplicitPosition(p);
  const [preferredLayer, setPreferredLayer] = useState<Layer>("legislation");
  const [expandedSections, setExpandedSections] = useState<Set<Layer>>(new Set());
  const toggleExpand = (layer: Layer) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(layer) ? next.delete(layer) : next.add(layer);
      return next;
    });
  const setSize = onSizeChange;
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // A pinned facility takes over the panel content while it's set.
  const facilityMode = !!facility;
  const hasLegislation = !!entity && entity.legislation.length > 0;
  const hasFigures = !!entity && entity.keyFigures.length > 0;
  const hasNews = !!entity && entity.news.length > 0;

  // Scope facilities to whatever the entity represents. The panel preview
  // always renders flat; grouping only matters on the full /datacenters page.
  const scopedFacilities: DataCenter[] = entity
    ? facilitiesForEntity(entity).facilities
    : [];
  const hasDatacenters = scopedFacilities.length > 0;

  const availableLayers: Layer[] = [];
  if (hasLegislation) availableLayers.push("legislation");
  if (hasFigures) availableLayers.push("figures");
  if (hasNews) availableLayers.push("news");
  if (hasDatacenters) availableLayers.push("datacenters");
  const activeLayer: Layer =
    availableLayers.length > 0 && !availableLayers.includes(preferredLayer)
      ? availableLayers[0]
      : preferredLayer;

  const isDragging = dragOffset !== null;

  // Position the panel via direct top/right/bottom/left (not via calc-with-%
  // in a transform — that doesn't resolve reliably in all browsers).
  // Min mode sits below the TopToolbar (which owns top-6 ≈ 1.5rem); stacking
  // them avoids the dynamic island being covered by the region tabs.
  const positionStyle: CSSProperties = (() => {
    if (size === "min") {
      return {
        top: "4.5rem",
        left: "50%",
        right: "auto",
        bottom: "auto",
      };
    }
    if (position === "left") {
      return {
        top: "5rem",
        left: "1.5rem",
        right: "auto",
        bottom: "auto",
      };
    }
    if (position === "right") {
      return {
        top: "5rem",
        right: "1.5rem",
        left: "auto",
        bottom: "auto",
      };
    }
    return {
      bottom: "8rem",
      left: "50%",
      right: "auto",
      top: "auto",
    };
  })();

  // Transform: handle horizontal centering (-50%) for centered anchors,
  // plus the drag offset.
  const horizCentered = size === "min" || position === "bottom";
  const dx = dragOffset?.x ?? 0;
  const dy = dragOffset?.y ?? 0;
  const transformValue = horizCentered
    ? `translate(calc(-50% + ${dx}px), ${dy}px)`
    : `translate(${dx}px, ${dy}px)`;

  // Two discrete sizes:
  //   min — Dynamic Island-style horizontal pill (~13rem × 2.5rem), top-centered
  //   md  — full panel (24/28rem wide, content-driven height), positioned by `position`
  const sizeStyle: CSSProperties = (() => {
    if (size === "min") {
      return {
        width: "fit-content",
        minWidth: "7rem",
        maxWidth: "min(15rem, calc(100vw - 2rem))",
        minHeight: "2.5rem",
        maxHeight: "2.5rem",
      };
    }
    if (position === "bottom") {
      // Compact square-ish card on bottom-anchor positions, including
      // mobile. Sized so the map has plenty of room above it.
      return {
        width: "min(20rem, calc(100vw - 2rem))",
        minHeight: "0px",
        maxHeight: "min(22rem, 45vh)",
      };
    }
    return {
      width: "min(22rem, calc(100vw - 2rem))",
      minHeight: "0px",
      maxHeight: "calc(100vh - 9rem)",
    };
  })();

  const onDragPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    setDragOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const onDragPointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const totalDx = e.clientX - dragStartRef.current.x;
    const totalDy = e.clientY - dragStartRef.current.y;
    const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    setDragOffset(null);
    dragStartRef.current = null;

    // Tap (no significant movement). 12px threshold is forgiving enough
    // for touch micro-movement. The handle is the only minimize/dismiss
    // affordance — if a facility is pinned we close it, otherwise we
    // toggle between Dynamic Island and the full panel.
    if (totalDist < 12) {
      if (size === "min") {
        setSize("md");
      } else if (facilityMode && onCloseFacility) {
        onCloseFacility();
      } else {
        setSize("min");
      }
      return;
    }

    // Mobile: a clear downward drag collapses the panel to the Dynamic Island.
    if (isMobileViewport && totalDy > 60 && totalDy > Math.abs(totalDx)) {
      setSize("min");
      return;
    }

    // Otherwise it's a drag — snap to the nearest anchor.
    const x = e.clientX;
    const y = e.clientY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let next: Position;
    if (y > vh * 0.65) {
      next = "bottom";
    } else if (x < vw * 0.5) {
      next = "left";
    } else {
      next = "right";
    }
    setPosition(next);
  };

  // ─── Render branches by size ───────────────────────────────────────────

  const renderMin = () => (
    <div
      onPointerDown={onDragPointerDown}
      onPointerMove={onDragPointerMove}
      onPointerUp={onDragPointerUp}
      onPointerCancel={onDragPointerUp}
      className={`block w-full h-full px-6 text-center text-[14px] font-semibold text-ink tracking-tight whitespace-nowrap truncate select-none touch-none leading-[2.5rem] ${
        isDragging ? "cursor-grabbing" : "cursor-pointer"
      }`}
    >
      {facility
        ? (facility.operator.replace(/\s*#\w+/g, "").trim() || "Data center")
        : (entity?.name ?? "Select a region")}
    </div>
  );

  const renderMd = () => (
    <>
      <div
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        className={`flex items-center justify-center px-3 pt-2 pb-1 flex-shrink-0 select-none touch-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Drag to move panel, tap to collapse"
      >
        {/* Tiny dynamic feedback on the grab bar — CSS-only so pointer
            capture is never interrupted by a motion component recomputing
            transforms mid-drag. Widens and darkens while actively held. */}
        <div
          className={`h-1 rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isDragging ? "bg-black/30 w-12" : "bg-black/15 w-9"
          }`}
        />
      </div>

      {facilityMode && facility ? (
        <FacilityDetail facility={facility} />
      ) : !entity ? (
        <div className="flex-1 flex items-center justify-center px-8 py-12 min-h-[160px]">
          <p className="text-xs text-muted text-center">
            Select a region to see its policies and data centers
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-1 pb-5 border-b border-black/[.06]">
            <h2 className="text-2xl font-semibold text-ink tracking-tight">
              {entity.name}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StanceBadge
                stance={lens === "ai" ? entity.stanceAI : entity.stanceDatacenter}
                size="md"
              />
              {LEVEL_LABEL[entity.level] && (
                <span className="text-xs text-muted">
                  {LEVEL_LABEL[entity.level]}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Onboarding hint — shows on the regional overview only, so
                it appears the moment a new visitor lands and disappears
                the instant they make a selection. Avoids needing a
                dismissible tutorial. */}
            {entity.isOverview && (
              <div className="rounded-2xl bg-[oklch(0.96_0.025_85)] border border-[oklch(0.88_0.05_85)]/50 px-4 py-3 text-[12px] text-ink/80 leading-relaxed">
                <div className="text-ink font-semibold mb-0.5">
                  Click anywhere to explore
                </div>
                A country, state, or any data center pin opens its
                detail. <span className="hidden lg:inline">Press <kbd className="font-sans px-1 rounded bg-white/85 border border-black/[.08] text-[10px] text-ink">?</kbd> for keyboard shortcuts.</span>
              </div>
            )}

            <ContextBlurb text={entity.contextBlurb} />

            {showViewStatesButton && onViewStates && (
              <button
                type="button"
                onClick={onViewStates}
                className="self-start rounded-full bg-ink text-white text-xs font-medium px-4 py-2 hover:bg-ink/90 transition-colors"
              >
                View state policies →
              </button>
            )}

            {availableLayers.length > 0 && (
              <MotionConfig
                transition={{
                  type: "spring",
                  damping: 22,
                  mass: 0.4,
                  stiffness: 260,
                }}
              >
                <div
                  className="sticky top-0 z-10 -mx-6 -mt-2 px-6 pt-2 pb-2 bg-white/90 backdrop-blur-md flex"
                  role="tablist"
                  aria-label="Sidebar sections"
                >
                  <div className="relative inline-flex items-center gap-1 p-1 rounded-full bg-black/[.04]">
                  {availableLayers.map((layer) => {
                    const active = layer === activeLayer;
                    const label =
                      layer === "legislation"
                        ? "Legislation"
                        : layer === "figures"
                          ? "Key Figures"
                          : layer === "news"
                            ? "News"
                            : "Data Centers";
                    return (
                      <button
                        key={layer}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPreferredLayer(layer)}
                        className={`relative text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
                          active ? "text-ink" : "text-muted hover:text-ink"
                        }`}
                        style={{ transitionProperty: "color, transform" }}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidepanel-layer-indicator"
                            className="absolute inset-0 rounded-full bg-white"
                            style={{
                              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            }}
                            // Bouncier than the default MotionConfig spring
                            // so the pill overshoots a touch and settles —
                            // makes the swap feel alive without losing
                            // precision.
                            transition={{
                              type: "spring",
                              stiffness: 480,
                              damping: 26,
                              mass: 0.7,
                            }}
                          />
                        )}
                        <span className="relative z-10">{label}</span>
                      </button>
                    );
                  })}
                  </div>
                </div>

                {activeLayer === "legislation" && hasLegislation && (
                  <motion.section layout>
                    <LegislationList
                      legislation={entity.legislation.slice(0, LEGISLATION_PREVIEW)}
                      stateCode={entity.level === "federal" ? "US" : undefined}
                      onSelectFacility={onSelectFacility}
                    />
                    <SeeAllLink
                      total={entity.legislation.length}
                      shown={LEGISLATION_PREVIEW}
                      label="bills"
                      href={`/legislation/${encodeURIComponent(entity.id)}`}
                    />
                  </motion.section>
                )}

                {activeLayer === "figures" && hasFigures && (
                  <motion.section layout>
                    <KeyFigures
                      figures={
                        expandedSections.has("figures")
                          ? entity.keyFigures
                          : entity.keyFigures.slice(0, FIGURES_PREVIEW)
                      }
                      legislation={entity.legislation}
                    />
                    <ExpandToggle
                      total={entity.keyFigures.length}
                      shown={FIGURES_PREVIEW}
                      label="figures"
                      expanded={expandedSections.has("figures")}
                      onToggle={() => toggleExpand("figures")}
                    />
                  </motion.section>
                )}

                {activeLayer === "news" && hasNews && (
                  <motion.section layout>
                    <NewsSection news={entity.news.slice(0, NEWS_PREVIEW)} />
                    <SeeAllLink
                      total={entity.news.length}
                      shown={NEWS_PREVIEW}
                      label="articles"
                      href={`/news/${encodeURIComponent(entity.id)}`}
                    />
                  </motion.section>
                )}

                {activeLayer === "datacenters" && hasDatacenters && (
                  <motion.section layout>
                    <DataCentersList
                      facilities={scopedFacilities.slice(0, DC_PREVIEW)}
                      groupBy={null}
                      onSelectFacility={onSelectFacility}
                    />
                    <SeeAllLink
                      total={scopedFacilities.length}
                      shown={DC_PREVIEW}
                      label="data centers"
                      href={`/datacenters/${encodeURIComponent(entity.id)}`}
                    />
                  </motion.section>
                )}
              </MotionConfig>
            )}
          </div>
        </div>
      )}
    </>
  );

  const isMin = size === "min";

  // NOTE: the shell is a plain <aside>, not motion.aside. framer-motion's
  // `animate` prop commandeers the element's `transform`, which collides
  // with the inline `transform: translate(...)` we use for positioning
  // and drag offsets — wrapping the aside in motion broke both the pill's
  // stability and the drag gesture. The existing CSS spring on the shell
  // already carries the min↔md morph, so we don't need motion here.
  return (
    <aside
      style={{
        ...positionStyle,
        ...sizeStyle,
        transform: transformValue,
        opacity: visibility,
        pointerEvents: visibility < 0.5 ? "none" : "auto",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "rgba(0, 0, 0, 0.04)",
        borderRadius: isMin ? "9999px" : "1.5rem",
        transition: isDragging
          ? "none"
          : `${TRANSITION}, background-color 350ms ease, border-color 350ms ease, border-radius 350ms ease`,
        willChange: "transform",
      }}
      className="fixed z-30 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden"
    >
      {isMin ? renderMin() : renderMd()}
    </aside>
  );
}
