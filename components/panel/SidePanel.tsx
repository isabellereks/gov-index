"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, MotionConfig } from "framer-motion";
import type {
  DataCenter,
  DimensionLens,
  Entity,
  GovLevel,
  Legislation,
} from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";
import ContextBlurb from "./ContextBlurb";
import LegislationList from "./LegislationList";
import KeyFigures from "./KeyFigures";
import NewsSection from "./NewsSection";
import FacilityDetail from "./FacilityDetail";
import DataCentersList from "./DataCentersList";
import EnergySection from "./EnergySection";
import { facilitiesForEntity } from "@/lib/datacenters";
import { getStateProfile, plantsInState } from "@/lib/energy-data";

interface SidePanelProps {
  entity: Entity | null;
  showViewStatesButton?: boolean;
  onViewStates?: () => void;
  /** When set, the selected state entity has county-level municipal data
   *  and a "View local actions →" button appears below the blurb. */
  showViewCountiesButton?: boolean;
  onViewCounties?: () => void;
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
  /** When set, adds a "Local" tab with county-level actions. Each entry
   *  is a Legislation-shaped row (adapter applied upstream) so it
   *  reuses LegislationList's rendering. */
  localActions?: Legislation[];
}

const LEVEL_LABEL: Record<GovLevel, string | null> = {
  federal: "Federal Government",
  state: "State Government",
  bloc: null,
};

type Layer =
  | "legislation"
  | "figures"
  | "news"
  | "datacenters"
  | "local"
  | "energy";
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
  showViewCountiesButton = false,
  onViewCounties,
  visibility = 1,
  size,
  onSizeChange,
  isMobileViewport,
  facility = null,
  onCloseFacility,
  onSelectFacility,
  lens = "datacenter",
  localActions,
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
  // Green traffic-light "expand" — bigger reading surface. On mobile
  // that means a ~90vh sheet; on desktop a wider panel. Resets to
  // false whenever the panel collapses to the island.
  const [expanded, setExpanded] = useState(false);
  const tabRefs = useRef<Partial<Record<Layer, HTMLButtonElement | null>>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
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
  const hasLocal = (localActions?.length ?? 0) > 0;

  // Energy tab — US states only. Data is keyed off state name, so check
  // that a profile or plants exist for this state before offering the tab.
  const isUsState =
    !!entity && entity.level === "state" && entity.region === "na";
  const hasEnergy =
    isUsState &&
    (!!getStateProfile(entity.name) || plantsInState(entity.name).length > 0);

  // Active tab scrolls into view when the layer changes — covers the case
  // where adding the Energy tab pushes the pill wider than the panel and
  // the active one would otherwise clip off the edge.
  useEffect(() => {
    const btn = tabRefs.current[preferredLayer];
    if (btn) btn.scrollIntoView({ inline: "center", block: "nearest" });
  }, [preferredLayer]);

  // Reset the panel's scroll container to the top whenever the selected
  // entity changes. Without this, users landing on a new state/country
  // inherit the previous entity's scroll position — which on mobile
  // reads as "the sidebar opens mid-content" instead of at the top.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [entity?.id]);

  // Expanded state is a per-session preference for the current view;
  // collapsing to the island always clears it so reopening feels fresh.
  useEffect(() => {
    if (size === "min") setExpanded(false);
  }, [size]);

  const availableLayers: Layer[] = [];
  if (hasLegislation) availableLayers.push("legislation");
  if (hasLocal) availableLayers.push("local");
  if (hasFigures) availableLayers.push("figures");
  if (hasNews) availableLayers.push("news");
  if (hasDatacenters) availableLayers.push("datacenters");
  if (hasEnergy) availableLayers.push("energy");
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
        // Sits 0.75rem below the (taller on mobile) region toolbar so
        // the two pills don't kiss. Desktop pill is h-7 + p-1 = 36px,
        // mobile pill is h-9 + p-1.5 = 48px; 5.75rem covers both.
        top: "5.75rem",
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
    // Bottom anchor: on mobile, tuck closer to the depth stepper so the
    // panel can grow taller (the reading surface is the scarce resource).
    // On desktop, keep more breathing room from the chrome.
    return {
      bottom: isMobileViewport ? "5.25rem" : "8rem",
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
        minWidth: "8rem",
        maxWidth: "min(17rem, calc(100vw - 2rem))",
        // Explicit `height` (not just min/max) so h-full on children
        // resolves correctly. Without it, `items-center` had no
        // reference and the label rendered at the top of the pill.
        height: "2.75rem",
      };
    }
    if (position === "bottom") {
      // Mobile bottom card needs to be a usable reading surface — the
      // earlier 20rem × 22rem cap was leaving most of the panel as
      // chrome with very little content visible. Now: near full-bleed
      // width (1rem margins each side), and ~60vh tall capped at 30rem
      // so there's still real map showing. Desktop bottom-anchor stays
      // compact since the user has chosen to dock it there explicitly.
      if (isMobileViewport) {
        return {
          width: "calc(100vw - 1.5rem)",
          maxWidth: "26rem",
          minHeight: "0px",
          maxHeight: expanded ? "min(44rem, 90vh)" : "min(30rem, 60vh)",
        };
      }
      return {
        width: expanded
          ? "min(26rem, calc(100vw - 2rem))"
          : "min(20rem, calc(100vw - 2rem))",
        minHeight: "0px",
        maxHeight: "min(22rem, 45vh)",
      };
    }
    return {
      width: expanded
        ? "min(30rem, calc(100vw - 2rem))"
        : "min(22rem, calc(100vw - 2rem))",
      minHeight: "0px",
      maxHeight: "calc(100vh - 9rem)",
    };
  })();

  const onDragPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    // Prevent the tap from ALSO registering on whatever is behind the
    // pill — on mobile the island sits over the top of Canada on the
    // NA map, and without these the tap was bleeding through as a
    // Canada click, which then silently changed the selected entity.
    e.stopPropagation();
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    setDragOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const onDragPointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    // Prevent the browser from synthesizing a click from this pointer
    // gesture. Without this, on mobile: tap pill → setSize(md) runs,
    // pill animates away from the tap position, THEN the synthesized
    // click retargets to whatever element is now where the finger
    // lifted — which on NA view is Canada's geography (the pill sits
    // over Canada). That click then fires onSelectEntity("124") and
    // silently swaps the selected entity to Canada.
    e.preventDefault();
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

    // Mobile: a clear upward drag from the island expands the panel.
    // Complements the tap affordance so the gesture feels symmetric
    // with swipe-to-dismiss.
    if (
      isMobileViewport &&
      size === "min" &&
      totalDy < -24 &&
      Math.abs(totalDy) > Math.abs(totalDx)
    ) {
      setSize("md");
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

  const islandPrimary = facility
    ? facility.operator.replace(/\s*#\w+/g, "").trim() || "Data center"
    : entity?.name ?? null;

  const renderMin = () => (
    // Plain <button> with onClick. The previous pointer-capture +
    // custom tap-vs-drag detection was fragile: touch sequences
    // misfired often enough that users reported "island doesn't open",
    // and synthesized clicks would retarget to the map beneath when
    // the pill animated away. A button with onClick uses the
    // browser's own click path — taps just work.
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSize("md");
      }}
      aria-label={
        islandPrimary
          ? `${islandPrimary} — open for details`
          : "Open map details"
      }
      className="w-full h-full flex items-center justify-center gap-1.5 px-5 text-[13px] font-semibold text-ink tracking-tight whitespace-nowrap select-none cursor-pointer active:scale-[0.97] transition-transform"
    >
      {/* Invisible left-spacer matches the chevron's visible glyph
          (6px, not the full 10px SVG block) so text+chevron read as
          geometrically centered. */}
      <span aria-hidden className="w-[6px] flex-shrink-0" />
      {islandPrimary ? (
        <span className="truncate">{islandPrimary}</span>
      ) : (
        <span className="text-muted font-normal">Tap to explore</span>
      )}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden
        className="text-muted flex-shrink-0"
      >
        <path
          d="M3 2l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  const collapseToIsland = () => {
    setExpanded(false);
    setSize("min");
  };
  const closeAndCollapse = () => {
    if (facilityMode && onCloseFacility) onCloseFacility();
    setExpanded(false);
    setSize("min");
  };

  const renderMd = () => (
    <>
      {/* Mac-style traffic-light controls — icons appear on hover (or
          always on touch, where there's no hover state). Red = close +
          dismiss facility; yellow = minimize to island; green = toggle
          expanded reading surface. */}
      <div className="group/tl flex items-center gap-1.5 px-3.5 pt-3 pb-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={closeAndCollapse}
          aria-label="Close"
          title="Close"
          className="relative w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-95 active:brightness-90 transition"
        >
          <svg
            viewBox="0 0 12 12"
            className="absolute inset-0 w-full h-full opacity-0 group-hover/tl:opacity-100 transition-opacity"
            aria-hidden
          >
            <path
              d="M4.2 4.2 L7.8 7.8 M7.8 4.2 L4.2 7.8"
              stroke="#4D0000"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={collapseToIsland}
          aria-label="Minimize"
          title="Minimize"
          className="relative w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-95 active:brightness-90 transition"
        >
          <svg
            viewBox="0 0 12 12"
            className="absolute inset-0 w-full h-full opacity-0 group-hover/tl:opacity-100 transition-opacity"
            aria-hidden
          >
            <path
              d="M3.8 6 H8.2"
              stroke="#5C3200"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Shrink" : "Expand"}
          aria-pressed={expanded}
          title={expanded ? "Shrink" : "Expand"}
          className="relative w-3 h-3 rounded-full bg-[#28C840] hover:brightness-95 active:brightness-90 transition"
        >
          {/* Two corner triangles, clearly separated by a blank
              diagonal through the middle — matches macOS Finder's zoom
              glyph. Flips across the anti-diagonal when expanded so
              the arrows appear to invert. */}
          <svg
            viewBox="0 0 12 12"
            className="absolute inset-0 w-full h-full opacity-0 group-hover/tl:opacity-100 transition-opacity"
            aria-hidden
          >
            {expanded ? (
              <>
                <path d="M8 3.5 H4 L8 7.5 Z" fill="#003D00" />
                <path d="M4 8.5 H8 L4 4.5 Z" fill="#003D00" />
              </>
            ) : (
              <>
                <path d="M3.5 3.5 H7 L3.5 7 Z" fill="#003D00" />
                <path d="M8.5 8.5 H5 L8.5 5 Z" fill="#003D00" />
              </>
            )}
          </svg>
        </button>
      </div>
      <div
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        className={`flex items-center justify-center px-3 pb-1 flex-shrink-0 select-none touch-none ${
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-6 pt-1 pb-5 border-b border-black/[.06]">
            <h2 className="text-2xl font-semibold text-ink tracking-tight">
              {entity.name}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              {/* Use the overall stance on the headline tag so a state
                  like Texas — which has enacted AI/privacy bills but
                  nothing data-center-specific — doesn't read as "No
                  Action" when viewed under the data-center lens. The
                  map coloring + SummaryBar still split by lens. */}
              <StanceBadge
                stance={entity.stance ?? (lens === "ai" ? entity.stanceAI : entity.stanceDatacenter)}
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

            {showViewCountiesButton && onViewCounties && (
              <button
                type="button"
                onClick={onViewCounties}
                className="self-start rounded-full bg-ink text-white text-xs font-medium px-4 py-2 hover:bg-ink/90 transition-colors"
              >
                View local actions →
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
                  className="-mt-2 pt-2 pb-2 flex"
                  role="tablist"
                  aria-label="Sidebar sections"
                >
                  {/* Tab strip width strategy:
                      • 2+ tabs  → fill the row and evenly share width
                        via flex-1 on each button (tabs-share-width).
                      • 1 tab    → size to content so a lone "News" pill
                        doesn't stretch across the whole panel. */}
                  <div
                    className={`relative flex items-center gap-0.5 p-1 rounded-full bg-black/[.04] ${
                      availableLayers.length === 1 ? "" : "w-full"
                    }`}
                  >
                  {availableLayers.map((layer) => {
                    const active = layer === activeLayer;
                    const label =
                      layer === "legislation"
                        ? "Bills"
                        : layer === "local"
                          ? "Local"
                          : layer === "figures"
                            ? "Figures"
                            : layer === "news"
                              ? "News"
                              : layer === "datacenters"
                                ? "Centers"
                                : "Energy";
                    return (
                      <button
                        key={layer}
                        ref={(el) => {
                          tabRefs.current[layer] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        title={
                          layer === "legislation"
                            ? "Legislation"
                            : layer === "figures"
                              ? "Key Figures"
                              : layer === "datacenters"
                                ? "Data Centers"
                                : label
                        }
                        onClick={() => setPreferredLayer(layer)}
                        className={`relative flex-1 min-w-0 text-xs font-medium px-2 py-1.5 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] truncate ${
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

                {activeLayer === "local" && hasLocal && localActions && (
                  <motion.section layout>
                    <LegislationList
                      legislation={localActions.slice(0, LEGISLATION_PREVIEW)}
                      onSelectFacility={onSelectFacility}
                    />
                    {localActions.length > LEGISLATION_PREVIEW && (
                      <div className="text-[11px] text-muted tracking-tight mt-3">
                        {localActions.length - LEGISLATION_PREVIEW} more · drill
                        into the map to see county-by-county
                      </div>
                    )}
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

                {activeLayer === "energy" && hasEnergy && (
                  <motion.section layout>
                    <EnergySection stateName={entity.name} />
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
