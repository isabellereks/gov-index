"use client";

import { STANCE_LABEL, type Dimension, DIMENSION_LABEL } from "@/types";
import { STANCE_HEX } from "@/lib/map-utils";
import { DIMENSION_GRADIENT } from "@/lib/dimensions";
import { SIZE_BANDS } from "@/components/map/DataCenterDots";

interface MobileLegendProps {
  dimension: Dimension;
  showDataCenters: boolean;
  visibility: number;
}

const STANCE_ORDER = [
  "restrictive",
  "concerning",
  "review",
  "none",
  "favorable",
] as const;

// Compact labels for the small legend chips — full STANCE_LABEL is
// too verbose for a mobile pill.
const SHORT_STANCE: Record<(typeof STANCE_ORDER)[number], string> = {
  restrictive: "Restricted",
  concerning: "Active",
  review: "Reviewing",
  none: "Inactive",
  favorable: "Favorable",
};

export function StanceRow() {
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted tracking-tight mb-2">
        Stance
      </div>
      <div className="flex items-center justify-between gap-1">
        {STANCE_ORDER.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STANCE_HEX[s] }}
              aria-label={STANCE_LABEL[s]}
            />
            <span className="text-[9px] text-muted truncate max-w-full">
              {SHORT_STANCE[s]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: Dimension }) {
  if (dimension === "overall") return null;
  const grad = DIMENSION_GRADIENT[dimension];
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted tracking-tight mb-2 truncate">
        {DIMENSION_LABEL[dimension]}
      </div>
      <div
        className="h-2 rounded-full"
        style={{
          background: `linear-gradient(to right, ${grad.from}, ${grad.to})`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted">Less</span>
        <span className="text-[9px] text-muted">More</span>
      </div>
    </div>
  );
}

export function SizeRow() {
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted tracking-tight mb-2">
        Size by power
      </div>
      <div className="flex items-end justify-between gap-2">
        {SIZE_BANDS.map((band) => (
          <div
            key={band.key}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            <span
              className="rounded-full bg-muted/30 flex-shrink-0"
              style={{ width: band.r * 1.6, height: band.r * 1.6 }}
              aria-hidden
            />
            <span className="text-[10px] text-muted truncate">
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataCenterRow() {
  const items = [
    { color: "#0A84FF", label: "Operational", hollow: false },
    { color: "#FF9500", label: "Building", hollow: false },
    { color: "#5856D6", label: "Proposed", hollow: true },
  ];
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted tracking-tight mb-2">
        Data centers
      </div>
      <div className="flex items-center justify-between gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            <span className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: item.color, opacity: 0.18 }}
              />
              <span
                className="relative w-2 h-2 rounded-full"
                style={{
                  backgroundColor: item.hollow ? "#FFFFFF" : item.color,
                  border: item.hollow ? `1.25px solid ${item.color}` : "none",
                }}
              />
            </span>
            <span className="text-[10px] text-ink truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Comprehensive bottom legend rendered on mobile when the side panel
 * is collapsed to the Dynamic Island. Combines the stance colors (or
 * the active dimension gradient) with the data-center status key into
 * a single card so the user can decode every visual at once.
 */
export default function MobileLegend({
  dimension,
  showDataCenters,
  visibility,
}: MobileLegendProps) {
  const showDimension = dimension !== "overall";
  return (
    <div
      className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-24 z-20 w-[min(22rem,calc(100vw-1.5rem))]"
      style={{
        opacity: visibility,
        pointerEvents: visibility < 0.5 ? "none" : "auto",
      }}
    >
      <div
        className="rounded-2xl bg-white/92 backdrop-blur-2xl border border-black/[.04] overflow-hidden"
        style={{
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <div className="px-4 py-3 flex flex-col gap-3">
          {showDimension ? <DimensionRow dimension={dimension} /> : <StanceRow />}
          {showDataCenters && (
            <>
              <div className="h-px bg-black/[.05]" />
              <DataCenterRow />
              <div className="h-px bg-black/[.05]" />
              <SizeRow />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
