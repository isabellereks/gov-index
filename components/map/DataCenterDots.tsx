"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapContext } from "react-simple-maps";
import type { DataCenter, DataCenterStatus } from "@/types";

interface DataCenterDotsProps {
  facilities: DataCenter[];
  /** Called on mouse enter/move with the hovered facility (or cluster
   *  representative) and screen coords. */
  onHoverFacility: (
    dc: DataCenter,
    x: number,
    y: number,
    clusterSize: number,
  ) => void;
  onLeaveFacility: () => void;
  /** Called on click — pins the facility in the side panel. */
  onSelectFacility?: (dc: DataCenter) => void;
  /** Lng/lat cell size for grid clustering. Default 1.2° ≈ 100 km. */
  clusterDeg?: number;
  /**
   * Optional projection override. Pass the same d3 projection your
   * <ComposableMap> uses. When omitted we fall back to react-simple-maps'
   * MapContext — but the context-derived projection has been unreliable
   * under Turbopack/React 19 (returns non-iterables for some calls).
   */
  projection?: (coords: [number, number]) => [number, number] | null;
}

interface Cluster {
  key: string;
  facilities: DataCenter[];
  repr: DataCenter;
  lat: number;
  lng: number;
  totalMW: number;
  dominantStatus: DataCenterStatus | "mixed";
}

// SF-style palette. Chosen to stand out against the stance choropleth
// (which is warm reds / amber / mint green).
export const DC_COLOR = {
  operational: "#0A84FF", // systemBlue
  "under-construction": "#FF9500", // systemOrange
  proposed: "#5856D6", // systemIndigo
  mixed: "#0A84FF",
} as const;

export type DcDotStatus = DataCenterStatus | "mixed";

/**
 * County-view data center icon — iOS-app-icon shape (squircle) with a
 * subtle vertical gradient, a top sheen, and a soft drop shadow. Designed
 * to sit cleanly on a map full of circular power-plant dots. States and
 * continent views keep the simpler `DcDot` circle.
 *
 * Depends on these SVG defs being present in the parent SVG:
 *   - #dc-shadow, #dc-grad-operational, #dc-grad-construction,
 *     #dc-grad-mixed, #dc-sheen
 */
export function DcIcon({
  x,
  y,
  size,
  status,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  interactive = true,
}: {
  x: number;
  y: number;
  /** Matches DcDot radius at the same capacity band so the visual weight
   *  stays consistent across map zooms. */
  size: number;
  status: DcDotStatus;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const color = DC_COLOR[status] ?? DC_COLOR.operational;
  const isProposed = status === "proposed";
  // Square 1:1 body with squircle-ish corner radius (~34% of edge).
  const d = size * 3.2;
  const half = d / 2;
  const rx = d * 0.34;
  const gradId =
    status === "under-construction"
      ? "dc-grad-construction"
      : status === "mixed"
        ? "dc-grad-mixed"
        : "dc-grad-operational";
  const bodyFill = isProposed ? "#FFFFFF" : `url(#${gradId})`;
  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      shapeRendering="geometricPrecision"
      style={{
        cursor: interactive && onClick ? "pointer" : "default",
      }}
    >
      {/* Drop shadow plate — slightly offset downward, blurred via filter. */}
      <rect
        x={x - half}
        y={y - half + 1.2}
        width={d}
        height={d}
        rx={rx}
        fill="black"
        fillOpacity={0.14}
        style={{ filter: "url(#dc-shadow)", pointerEvents: "none" }}
      />
      {/* Body */}
      <rect
        x={x - half}
        y={y - half}
        width={d}
        height={d}
        rx={rx}
        fill={bodyFill}
        stroke={isProposed ? color : "rgba(255,255,255,0.35)"}
        strokeWidth={isProposed ? 1.4 : 0.7}
      />
      {/* Top-half sheen — white linear gradient that fades to clear.
          Skipped on proposed (already white body). */}
      {!isProposed && (
        <rect
          x={x - half + 0.6}
          y={y - half + 0.6}
          width={d - 1.2}
          height={(d - 1.2) * 0.48}
          rx={rx - 0.6}
          fill="url(#dc-sheen)"
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Center glyph — a tiny rounded pill that reads as a server-rack
          stripe without the literal "two horizontal lines" feel. */}
      <rect
        x={x - d * 0.18}
        y={y - d * 0.055}
        width={d * 0.36}
        height={d * 0.11}
        rx={d * 0.055}
        fill={isProposed ? color : "#FFFFFF"}
        fillOpacity={isProposed ? 0.9 : 0.85}
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}

interface DcDotProps {
  /** When omitted, the parent must wrap this in a <Marker> that
   *  positions it. When present, renders at explicit screen coords. */
  x?: number;
  y?: number;
  r: number;
  status: DcDotStatus;
  /** Cluster count: shows the number when > 1. */
  count?: number;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  interactive?: boolean;
}

/**
 * Single source of truth for the data-center dot visual: halo, body
 * circle, and optional cluster number. Used by both the projected
 * (countries / states) and the locally-projected (county) renderings
 * so the dots look identical at every drill level.
 */
export function DcDot({
  x,
  y,
  r,
  status,
  count = 1,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  interactive = true,
}: DcDotProps) {
  const color = DC_COLOR[status];
  const isProposed = status === "proposed";
  const isCluster = count > 1;
  const positioned = typeof x === "number" && typeof y === "number";
  const haloProps = positioned ? { cx: x, cy: y } : {};
  const bodyProps = positioned ? { cx: x, cy: y } : {};
  const textProps = positioned ? { x, y } : {};

  return (
    <>
      <circle
        {...haloProps}
        r={r + 2.2}
        fill={color}
        opacity={0.18}
        style={{ pointerEvents: "none" }}
      />
      <circle
        {...bodyProps}
        r={r}
        fill={isProposed ? "#FFFFFF" : color}
        stroke={isProposed ? color : "#FFFFFF"}
        strokeWidth={isProposed ? 1.6 : 1.1}
        style={{
          cursor: interactive && onClick ? "pointer" : "default",
          pointerEvents: "all",
        }}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      />
      {/* Cluster count is only readable on the medium / large bands.
          On the small (4px) band we drop it entirely — the dot itself
          is the signal, the number was unreadable noise. */}
      {isCluster && r >= 7 && (
        <text
          {...textProps}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: r >= 10 ? "9px" : "8px",
            fontWeight: 600,
            fontFamily: "inherit",
            fill: isProposed ? color : "#FFFFFF",
            pointerEvents: "none",
            letterSpacing: "-0.02em",
            transform: "translateY(-0.1px)",
          }}
        >
          {count}
        </text>
      )}
    </>
  );
}

function clusterFacilities(facs: DataCenter[], cellDeg: number): Cluster[] {
  const buckets = new Map<string, DataCenter[]>();
  for (const f of facs) {
    const key = `${Math.round(f.lat / cellDeg)}|${Math.round(f.lng / cellDeg)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(f);
    buckets.set(key, bucket);
  }
  const clusters: Cluster[] = [];
  for (const [key, bucket] of buckets) {
    let totalMW = 0;
    let sumLat = 0;
    let sumLng = 0;
    let repr = bucket[0];
    for (const f of bucket) {
      const mw = f.capacityMW ?? 0;
      totalMW += mw;
      sumLat += f.lat;
      sumLng += f.lng;
      if ((f.capacityMW ?? 0) > (repr.capacityMW ?? 0)) repr = f;
    }
    const statuses = new Set(bucket.map((f) => f.status));
    clusters.push({
      key,
      facilities: bucket,
      repr,
      lat: sumLat / bucket.length,
      lng: sumLng / bucket.length,
      totalMW,
      dominantStatus: statuses.size === 1 ? bucket[0].status : "mixed",
    });
  }
  // Biggest first so small dots render on top and aren't hidden.
  clusters.sort((a, b) => b.totalMW - a.totalMW);
  return clusters;
}

// Three discrete size buckets keyed off cluster total MW. Discrete > continuous
// because the eye reads "small / medium / large" instantly, but a continuous
// log scale just looks like a uniformly noisy field. Bands match the legend
// shown to the user (< 100 / 100-500 / 500+).
export const SIZE_BANDS = [
  { key: "sm" as const, label: "< 100 MW", max: 100, r: 4 },
  { key: "md" as const, label: "100–500 MW", max: 500, r: 7 },
  { key: "lg" as const, label: "500+ MW", max: Infinity, r: 11 },
];

function clusterRadius(totalMW: number): number {
  for (const band of SIZE_BANDS) {
    if (totalMW < band.max) return band.r;
  }
  return SIZE_BANDS[SIZE_BANDS.length - 1].r;
}

export default function DataCenterDots({
  facilities,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
  clusterDeg = 1.8,
  projection: projectionProp,
}: DataCenterDotsProps) {
  const clusters = useMemo(
    () => clusterFacilities(facilities, clusterDeg),
    [facilities, clusterDeg],
  );

  // Gate on mount — projection output is float-sensitive, so server vs
  // client renders can diverge by a trailing digit. The dots have no
  // SEO/a11y value pre-hydration, so skip them until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Prefer the projection passed as a prop; fall back to MapContext only
  // when no prop is supplied. Context-derived projection has been flaky
  // under Turbopack/React 19 for reasons we don't fully understand —
  // going direct via prop is the reliable path.
  const ctx = useMapContext();
  const projection = (projectionProp ??
    (ctx as { projection?: (c: [number, number]) => [number, number] | null } | undefined)
      ?.projection) as
    | ((c: [number, number]) => [number, number] | null | undefined)
    | undefined;

  if (!mounted || typeof projection !== "function") return null;

  return (
    <g shapeRendering="geometricPrecision">
      {clusters.map((c) => {
        let projected: [number, number] | null | undefined;
        try {
          projected = projection([c.lng, c.lat]);
        } catch {
          return null;
        }
        if (!projected || !Array.isArray(projected) || projected.length < 2) {
          return null;
        }
        const [x, y] = projected;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const r = clusterRadius(c.totalMW);
        return (
          <g key={c.key} transform={`translate(${x}, ${y})`}>
            <DcDot
              r={r}
              status={c.dominantStatus}
              count={c.facilities.length}
              onMouseEnter={(e) =>
                onHoverFacility(
                  c.repr,
                  e.clientX,
                  e.clientY,
                  c.facilities.length,
                )
              }
              onMouseMove={(e) =>
                onHoverFacility(
                  c.repr,
                  e.clientX,
                  e.clientY,
                  c.facilities.length,
                )
              }
              onMouseLeave={() => onLeaveFacility()}
              onClick={
                onSelectFacility ? () => onSelectFacility(c.repr) : undefined
              }
              interactive={!!onSelectFacility}
            />
          </g>
        );
      })}
    </g>
  );
}
