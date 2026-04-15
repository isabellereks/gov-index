"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoAlbersUsa, geoPath, type GeoProjection } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { NEUTRAL_FILL, NEUTRAL_STROKE, type SetTooltip } from "@/lib/map-utils";
import {
  getMunicipalitiesByState,
  getMunicipalityByFips,
} from "@/lib/municipal-data";
import { STATE_FIPS, type DataCenter, type MunicipalActionStatus, type PowerPlant } from "@/types";
import { US_FACILITIES } from "@/lib/datacenters";
import { plantsInState, plantsNearby } from "@/lib/energy-data";
import { FUEL_COLOR, plantRadius } from "@/lib/energy-colors";
import { DcIcon, SIZE_BANDS } from "./DataCenterDots";
import waterDataRaw from "@/data/energy/us-water.json";

void getMunicipalitiesByState;

interface WaterFile {
  rivers: FeatureCollection;
  lakes: FeatureCollection;
}
const WATER = waterDataRaw as unknown as WaterFile;

function bandRadius(mw: number | undefined): number {
  const v = mw ?? 0;
  for (const b of SIZE_BANDS) {
    if (v < b.max) return b.r;
  }
  return SIZE_BANDS[SIZE_BANDS.length - 1].r;
}

interface CountyMapProps {
  stateName: string;
  onSelectCounty: (fips: string) => void;
  selectedCountyFips: string | null;
  setTooltip: SetTooltip;
  showDataCenters?: boolean;
  onHoverFacility?: (
    dc: DataCenter,
    x: number,
    y: number,
    clusterSize: number,
  ) => void;
  onLeaveFacility?: () => void;
  onSelectFacility?: (dc: DataCenter) => void;
}

const COUNTIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type CountyFeature = Feature<Geometry, { name?: string }>;
type CountyCollection = FeatureCollection<Geometry, { name?: string }>;

// Module-level cache so multiple mounts share one fetch.
let countiesPromise: Promise<CountyCollection> | null = null;
let statesPromise: Promise<CountyCollection> | null = null;

function loadCounties(): Promise<CountyCollection> {
  if (!countiesPromise) {
    countiesPromise = fetch(COUNTIES_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        const counties = feature(
          topo,
          topo.objects.counties as GeometryCollection,
        ) as unknown as CountyCollection;
        return counties;
      });
  }
  return countiesPromise;
}

function loadStates(): Promise<CountyCollection> {
  if (!statesPromise) {
    statesPromise = fetch(STATES_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        const states = feature(
          topo,
          topo.objects.states as GeometryCollection,
        ) as unknown as CountyCollection;
        return states;
      });
  }
  return statesPromise;
}

function statusFill(status: MunicipalActionStatus | null): string {
  if (status === "enacted") return "var(--color-stance-restrictive)";
  if (status === "under-review") return "var(--color-stance-concerning)";
  if (status === "proposed") return "var(--color-stance-review)";
  if (status === "failed") return "var(--color-stance-none)";
  return NEUTRAL_FILL;
}

function dominantStatus(
  statuses: MunicipalActionStatus[],
): MunicipalActionStatus | null {
  const order: MunicipalActionStatus[] = [
    "enacted",
    "under-review",
    "proposed",
    "failed",
  ];
  for (const s of order) {
    if (statuses.includes(s)) return s;
  }
  return null;
}

const VIEWBOX_W = 960;
const VIEWBOX_H = 600;
// Inset so the state doesn't touch the edges.
const INSET = 56;

/** Approximate pixel radius of a mileage distance at a given lat/lng
 *  under the supplied projection. Uses a small lat offset (miles / 69°). */
function milesToScreenRadius(
  projection: GeoProjection,
  lat: number,
  lng: number,
  miles: number,
): number {
  const degOffset = miles / 69;
  const center = projection([lng, lat]);
  const offset = projection([lng, lat + degOffset]);
  if (!center || !offset) return 0;
  return Math.abs(offset[1] - center[1]);
}

/** Feature-bbox overlap check for filtering water features to a state. */
function bboxOverlap(
  a: [[number, number], [number, number]],
  b: [[number, number], [number, number]],
): boolean {
  return !(
    a[1][0] < b[0][0] ||
    a[0][0] > b[1][0] ||
    a[1][1] < b[0][1] ||
    a[0][1] > b[1][1]
  );
}

export default function CountyMap({
  stateName,
  onSelectCounty,
  selectedCountyFips,
  setTooltip,
  showDataCenters = false,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
}: CountyMapProps) {
  const statePrefix = STATE_FIPS[stateName];
  const [counties, setCounties] = useState<CountyCollection | null>(null);
  const [states, setStates] = useState<CountyCollection | null>(null);
  const [hoveredDc, setHoveredDc] = useState<{
    lat: number;
    lng: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCounties().then((c) => {
      if (!cancelled) setCounties(c);
    });
    loadStates().then((s) => {
      if (!cancelled) setStates(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const computed = useMemo(() => {
    if (!counties || !statePrefix) {
      return null;
    }
    const filtered = counties.features.filter((f) =>
      String(f.id).startsWith(statePrefix),
    );
    const stateFeatureEl =
      states?.features.find((f) => String(f.id) === statePrefix) ?? null;

    const projection = geoAlbersUsa();
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: filtered,
    };
    projection.fitExtent(
      [
        [INSET, INSET],
        [VIEWBOX_W - INSET, VIEWBOX_H - INSET],
      ],
      collection,
    );
    const path = geoPath(projection);
    const paths = filtered.map((f) => path(f) ?? "");
    const nationalPaths = stateFeatureEl ? [path(stateFeatureEl) ?? ""] : [];

    // Compute geographic bbox of this state for water-feature filtering.
    const geoPathWGS = geoPath();
    const stateGeoBounds = stateFeatureEl
      ? (geoPathWGS.bounds(stateFeatureEl) as [[number, number], [number, number]])
      : null;

    // Filter + project water features that overlap the state bbox.
    const lakes = stateGeoBounds
      ? WATER.lakes.features
          .filter((f) => {
            const b = geoPathWGS.bounds(f) as [[number, number], [number, number]];
            return bboxOverlap(b, stateGeoBounds);
          })
          .map((f) => ({
            d: path(f) ?? "",
            area: path.area(f),
            name: (f.properties?.name ?? null) as string | null,
          }))
          .filter((l) => l.d)
      : [];

    const rivers = stateGeoBounds
      ? WATER.rivers.features
          .filter((f) => {
            const b = geoPathWGS.bounds(f) as [[number, number], [number, number]];
            return bboxOverlap(b, stateGeoBounds);
          })
          .map((f) => ({
            d: path(f) ?? "",
            weight: Math.min(
              2.5,
              Math.max(0.5, Number(f.properties?.strokeweig ?? 1) * 0.8),
            ),
            name: (f.properties?.name ?? null) as string | null,
          }))
          .filter((r) => r.d)
      : [];

    // Project power plants in the state.
    const plants = plantsInState(stateName)
      .map((p) => {
        const xy = projection([p.lng, p.lat]);
        return xy ? { plant: p, x: xy[0], y: xy[1] } : null;
      })
      .filter((p): p is { plant: PowerPlant; x: number; y: number } => Boolean(p));

    // Project data centers in the state.
    const facilities = US_FACILITIES.filter((f) => f.state === stateName);
    const dcs = facilities
      .map((dc) => {
        const xy = projection([dc.lng, dc.lat]);
        return xy ? { dc, x: xy[0], y: xy[1] } : null;
      })
      .filter((p): p is { dc: DataCenter; x: number; y: number } => Boolean(p));

    // US-wide bbox for the zoom-in animation starting point.
    const usProj = geoAlbersUsa().scale(900).translate([480, 300]);
    const usPath = geoPath(usProj);
    const b = stateFeatureEl
      ? (usPath.bounds(stateFeatureEl) as [[number, number], [number, number]])
      : null;

    return {
      projection,
      stateFeatures: filtered,
      zoomedPaths: paths,
      countryPaths: nationalPaths,
      lakes,
      rivers,
      plants,
      dcs,
      bbox: b,
    };
  }, [counties, states, statePrefix, stateName]);

  // Proximity-highlighted plants (within 50mi of the hovered DC). Stats
  // feed the info chip that pops next to the hovered data center.
  const hoveredStats = useMemo(() => {
    if (!hoveredDc) return null;
    const nearby = plantsNearby(hoveredDc.lat, hoveredDc.lng, 50);
    const ids = new Set(nearby.map((p) => p.id));
    const totalMW = nearby.reduce((s, p) => s + p.capacityMW, 0);
    return { ids, count: nearby.length, totalMW };
  }, [hoveredDc]);
  const highlightedPlantIds = hoveredStats?.ids ?? new Set<string>();

  // Transform-based zoom animation.
  const [animateReady, setAnimateReady] = useState(false);
  const firstMountRef = useRef(true);

  useEffect(() => {
    if (!computed || computed.zoomedPaths.length === 0) return;
    setAnimateReady(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [stateName, computed]);

  useEffect(() => {
    firstMountRef.current = false;
  }, []);

  const fromTransform = useMemo(() => {
    const bbox = computed?.bbox ?? null;
    if (!bbox) return "translate(480 300) scale(0.3) translate(-480 -300)";
    const [[x0, y0], [x1, y1]] = bbox;
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bw <= 0 || bh <= 0)
      return "translate(480 300) scale(0.3) translate(-480 -300)";
    const scale = Math.min(bw / (VIEWBOX_W - 2 * INSET), bh / (VIEWBOX_H - 2 * INSET));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = cx - (VIEWBOX_W / 2) * scale;
    const ty = cy - (VIEWBOX_H / 2) * scale;
    return `translate(${tx} ${ty}) scale(${scale})`;
  }, [computed]);

  if (!statePrefix) {
    return (
      <div className="flex items-center justify-center text-sm text-muted">
        Counties not available for {stateName}
      </div>
    );
  }

  if (!counties || !computed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted">
        Loading counties…
      </div>
    );
  }

  const {
    projection,
    stateFeatures,
    zoomedPaths,
    countryPaths,
    lakes,
    rivers,
    plants,
    dcs,
  } = computed;

  // Thresholds for "large lake" gradient treatment. Area is in projected
  // pixel² so it scales with the fitted viewport automatically.
  const LARGE_LAKE_AREA = 400;

  // Proximity ring pixel radii, if a DC is hovered.
  const ringRadii = hoveredDc
    ? [25, 50].map((m) => ({
        miles: m,
        r: milesToScreenRadius(projection, hoveredDc.lat, hoveredDc.lng, m),
      }))
    : [];

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) =>
        setTooltip((current) =>
          current ? { ...current, x: e.clientX, y: e.clientY } : current,
        )
      }
      onMouseLeave={() => setTooltip(null)}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: "100%",
          shapeRendering: "geometricPrecision",
        }}
      >
        <defs>
          <filter id="water-blur" x="-2%" y="-2%" width="104%" height="104%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
          <radialGradient id="lake-gradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#AFD2E2" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6BA3C4" stopOpacity="0.85" />
          </radialGradient>
          <filter id="dc-shadow" x="-30%" y="-20%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dy="1" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* DC proximity halo — soft radial glow that fades to transparent,
              replacing the old dashed radar ring. */}
          <radialGradient id="dc-halo">
            <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#0A84FF" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
          </radialGradient>
          {/* App-icon body gradients — top 12% lighter so the icon reads
              as a lit surface, not a flat chip. */}
          <linearGradient id="dc-grad-operational" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3AA0FF" />
            <stop offset="100%" stopColor="#0A84FF" />
          </linearGradient>
          <linearGradient id="dc-grad-construction" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB547" />
            <stop offset="100%" stopColor="#FF9500" />
          </linearGradient>
          <linearGradient id="dc-grad-mixed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3AA0FF" />
            <stop offset="100%" stopColor="#0A84FF" />
          </linearGradient>
          {/* Sheen overlay for the top half of the icon body. */}
          <linearGradient id="dc-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g
          style={{
            transform: animateReady ? "none" : fromTransform,
            transformOrigin: "0 0",
            transition:
              "transform 650ms cubic-bezier(0.32, 0.72, 0, 1), opacity 400ms ease",
            opacity: animateReady ? 1 : 0.85,
          }}
        >
          {/* State silhouette underlay */}
          {countryPaths.map((d, i) => (
            <path
              key={`outline-${i}`}
              d={d}
              fill={NEUTRAL_FILL}
              stroke={NEUTRAL_STROKE}
              strokeWidth={1.5}
            />
          ))}

          {/* Water fills — lakes */}
          {lakes.map((lake, i) => {
            const isLarge = lake.area > LARGE_LAKE_AREA;
            return (
              <path
                key={`lake-${i}`}
                d={lake.d}
                fill={isLarge ? "url(#lake-gradient)" : "#9BC4D9"}
                fillOpacity={isLarge ? 1 : 0.85}
                stroke="#5B93B0"
                strokeWidth={0.6}
                strokeOpacity={0.6}
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* Water strokes — rivers. A soft white casing underneath makes the
              line read on any terrain color without resorting to a heavy blur. */}
          {rivers.map((river, i) => {
            const w = Math.max(river.weight, 1.8);
            return (
              <g key={`river-${i}`} style={{ pointerEvents: "none" }}>
                <path
                  d={river.d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={w + 1.6}
                  strokeOpacity={0.85}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={river.d}
                  fill="none"
                  stroke="#4A8BAE"
                  strokeWidth={w}
                  strokeOpacity={0.95}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Counties (choropleth) */}
          {zoomedPaths.map((d, i) => {
            const f = stateFeatures[i];
            const fips = String(f.id).padStart(5, "0");
            const countyName =
              (f.properties as { name?: string })?.name ?? fips;
            const municipality = getMunicipalityByFips(fips);
            const statuses: MunicipalActionStatus[] =
              municipality?.actions.map((a) => a.status) ?? [];
            const dominant = dominantStatus(statuses);
            const hasData = !!municipality;
            const isSelected = selectedCountyFips === fips;
            const fill = hasData ? statusFill(dominant) : NEUTRAL_FILL;
            const stroke = isSelected ? "#1D1D1F" : NEUTRAL_STROKE;
            const strokeWidth = isSelected ? 2 : 0.5;
            return (
              <path
                key={fips}
                d={d}
                fill={fill}
                fillOpacity={hasData ? 0.92 : 0.78}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                style={{
                  cursor: hasData ? "pointer" : "default",
                  transition:
                    "stroke 200ms, stroke-width 200ms, filter 200ms",
                  filter: isSelected
                    ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                    : undefined,
                  outline: "none",
                }}
                onMouseEnter={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: countyName,
                    countyFips: hasData ? fips : undefined,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
                onClick={() => hasData && onSelectCounty(fips)}
              />
            );
          })}

          {/* DC proximity halo — sits below the plants so highlighted plants
              read as "lit" from within the halo. Fade on in/out via opacity. */}
          {hoveredDc && ringRadii.length > 0 && (
            <circle
              cx={hoveredDc.x}
              cy={hoveredDc.y}
              r={ringRadii[ringRadii.length - 1].r}
              fill="url(#dc-halo)"
              style={{
                pointerEvents: "none",
                transition: "opacity 220ms ease",
              }}
            />
          )}

          {/* Power plants — terrain layer, small muted dots. Highlighted
              plants (inside the halo) get a fuel-tinted drop-shadow glow
              instead of a scale pop, so the animation feels like a light
              turning on rather than a mechanical resize. */}
          {plants.map(({ plant, x, y }) => {
            const r = plantRadius(plant.capacityMW);
            const color = FUEL_COLOR[plant.fuelType] ?? FUEL_COLOR.other;
            const highlighted = highlightedPlantIds.has(plant.id);
            return (
              <circle
                key={plant.id}
                cx={x}
                cy={y}
                r={r}
                fill={color}
                fillOpacity={highlighted ? 1 : 0.45}
                stroke="#FFFFFF"
                strokeWidth={highlighted ? 0.8 : 0.5}
                strokeOpacity={highlighted ? 0.9 : 0.3}
                style={{
                  cursor: "default",
                  transition:
                    "fill-opacity 260ms ease, stroke-opacity 260ms ease, filter 260ms ease",
                  filter: highlighted
                    ? `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color}aa)`
                    : undefined,
                }}
                onMouseEnter={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: `${plant.name} · ${Math.round(plant.capacityMW)} MW · ${plant.fuelType}`,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Data center icons — rounded-rect rack shape (county view only) */}
          {showDataCenters && onHoverFacility && onLeaveFacility && (
            <g>
              {dcs.map(({ dc, x, y }) => {
                const size = bandRadius(dc.capacityMW);
                return (
                  <DcIcon
                    key={dc.id}
                    x={x}
                    y={y}
                    size={size}
                    status={dc.status}
                    onMouseEnter={(e) => {
                      onHoverFacility(dc, e.clientX, e.clientY, 1);
                      setHoveredDc({ lat: dc.lat, lng: dc.lng, x, y });
                    }}
                    onMouseMove={(e) => onHoverFacility(dc, e.clientX, e.clientY, 1)}
                    onMouseLeave={() => {
                      onLeaveFacility();
                      setHoveredDc(null);
                    }}
                    onClick={
                      onSelectFacility ? () => onSelectFacility(dc) : undefined
                    }
                    interactive={!!onSelectFacility}
                  />
                );
              })}
            </g>
          )}

          {/* Info chip — drawn last so it floats above both plants and
              nearby DC icons. foreignObject lets us use real HTML for
              auto-sized type + backdrop-blur. */}
          {hoveredDc && hoveredStats && hoveredStats.count > 0 && (
            <foreignObject
              x={hoveredDc.x - 100}
              y={hoveredDc.y - 58}
              width={200}
              height={28}
              style={{ overflow: "visible", pointerEvents: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    fontFamily: "inherit",
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "#1D1D1F",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    padding: "4px 9px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hoveredStats.count} plant
                  {hoveredStats.count === 1 ? "" : "s"} ·{" "}
                  {hoveredStats.totalMW >= 1000
                    ? `${(hoveredStats.totalMW / 1000).toFixed(1)} GW`
                    : `${Math.round(hoveredStats.totalMW)} MW`}{" "}
                  within 50 mi
                </div>
              </div>
            </foreignObject>
          )}
        </g>
      </svg>
    </div>
  );
}
