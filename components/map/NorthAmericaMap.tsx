"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { naProjection } from "@/lib/projections";
import { getEntity } from "@/lib/placeholder-data";
import { getEntityColorForDimension } from "@/lib/dimensions";
import {
  NEUTRAL_FILL,
  NEUTRAL_STROKE,
  type SetTooltip,
} from "@/lib/map-utils";
import { ALL_FACILITIES } from "@/lib/datacenters";
import type { DataCenter, Dimension, DimensionLens } from "@/types";
import DataCenterDots from "./DataCenterDots";

interface NorthAmericaMapProps {
  onSelectEntity: (geoId: string) => void;
  onDoubleClickEntity?: (geoId: string) => void;
  /** Click handler for a specific US state — navigates to the states view. */
  onSelectUsState?: (stateName: string) => void;
  /** Double-click on a US state — drill directly into counties. */
  onDoubleClickUsState?: (stateName: string) => void;
  selectedGeoId: string | null;
  setTooltip: SetTooltip;
  dimension?: Dimension;
  lens?: DimensionLens;
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

const naProj = naProjection as unknown as ProjectionFunction;

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Non-US North America contextual shapes rendered from the world atlas.
// Canada is interactive (we have an entity); Mexico is a neutral silhouette
// so the map doesn't feel amputated along the southern border.
const CANADA_ID = "124";
const MEXICO_ID = "484";

export default function NorthAmericaMap({
  onSelectEntity,
  onDoubleClickEntity,
  onSelectUsState,
  onDoubleClickUsState,
  selectedGeoId,
  setTooltip,
  dimension = "overall",
  lens = "datacenter",
  showDataCenters = false,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
}: NorthAmericaMapProps) {
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
      <ComposableMap
        width={960}
        height={600}
        projection={naProj}
        style={{
          width: "100%",
          height: "100%",
          // Force high-quality vector rendering. Without this, mobile
          // WebKit may pick optimizeSpeed for small primitives like the
          // data-center dots, which is what makes them look pixelated
          // when the parent layer is CSS-scaled for pinch-zoom.
          shapeRendering: "geometricPrecision",
        }}
      >
        {/* Layer 1 — Canada (interactive) + Mexico (neutral silhouette) */}
        <Geographies geography={WORLD_URL}>
          {({ geographies }) => {
            const features = geographies.filter(
              (g) => g.id === CANADA_ID || g.id === MEXICO_ID,
            );
            return features.map((geo) => {
              const id = geo.id as string;
              if (id === MEXICO_ID) {
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: NEUTRAL_FILL,
                        stroke: NEUTRAL_STROKE,
                        strokeWidth: 1,
                        outline: "none",
                        pointerEvents: "none",
                      },
                      hover: {
                        fill: NEUTRAL_FILL,
                        outline: "none",
                        pointerEvents: "none",
                      },
                      pressed: {
                        fill: NEUTRAL_FILL,
                        outline: "none",
                      },
                    }}
                  />
                );
              }
              // Canada — interactive
              const ent = getEntity(id, "na");
              if (!ent) return null;
              const isSelected = selectedGeoId === id;
              const fill = getEntityColorForDimension(ent, dimension, lens);
              const stroke = isSelected ? "#FFFFFF" : NEUTRAL_STROKE;
              const strokeWidth = isSelected ? 4 : 1.5;
              const base = {
                fill,
                stroke,
                strokeWidth,
                strokeLinejoin: "round" as const,
                strokeLinecap: "round" as const,
                outline: "none",
                cursor: "pointer",
                transition:
                  "stroke 200ms, stroke-width 200ms, filter 200ms",
                filter: isSelected
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                  : undefined,
              };
              const hoverFilter = isSelected
                ? "drop-shadow(0 4px 12px rgba(0,0,0,0.18)) brightness(0.94)"
                : "brightness(0.94)";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, label: "Canada", geoId: id, region: "na" })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => onSelectEntity(id)}
                  onDoubleClick={() => onDoubleClickEntity?.(id)}
                  style={{
                    default: base,
                    hover: { ...base, filter: hoverFilter },
                    pressed: base,
                  }}
                />
              );
            });
          }}
        </Geographies>

        {/* Layer 2 — US states, rendered at the continental zoom so the US
            shows its per-state stance breakdown instead of a single blob. */}
        <Geographies geography={STATES_URL}>
          {({ geographies }) => {
            return geographies
              .slice()
              .sort((a, b) => {
                const aSel =
                  (a.properties.name as string) === selectedGeoId;
                const bSel =
                  (b.properties.name as string) === selectedGeoId;
                return aSel === bSel ? 0 : aSel ? 1 : -1;
              })
              .map((geo) => {
                const name = geo.properties.name as string;
                const ent = getEntity(name, "na");
                const isSelected = selectedGeoId === name;
                if (!ent) {
                  // Unmapped states (e.g. territories) render as neutral fill
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: NEUTRAL_FILL,
                          stroke: NEUTRAL_STROKE,
                          strokeWidth: 0.5,
                          outline: "none",
                          pointerEvents: "none",
                        },
                        hover: {
                          fill: NEUTRAL_FILL,
                          outline: "none",
                          pointerEvents: "none",
                        },
                        pressed: {
                          fill: NEUTRAL_FILL,
                          outline: "none",
                        },
                      }}
                    />
                  );
                }
                const fill = getEntityColorForDimension(ent, dimension, lens);
                const stroke = isSelected ? "#FFFFFF" : NEUTRAL_STROKE;
                const strokeWidth = isSelected ? 3 : 0.6;
                const base = {
                  fill,
                  stroke,
                  strokeWidth,
                  strokeLinejoin: "round" as const,
                  strokeLinecap: "round" as const,
                  outline: "none",
                  cursor: "pointer",
                  transition:
                    "stroke 200ms, stroke-width 200ms, filter 200ms",
                  filter: isSelected
                    ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                    : undefined,
                };
                const hoverFilter = isSelected
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.18)) brightness(0.94)"
                  : "brightness(0.94)";
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, label: name, geoId: name, region: "na" })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onSelectUsState?.(name)}
                    onDoubleClick={() => onDoubleClickUsState?.(name)}
                    style={{
                      default: base,
                      hover: { ...base, filter: hoverFilter },
                      pressed: base,
                    }}
                  />
                );
              });
          }}
        </Geographies>

        {showDataCenters && onHoverFacility && onLeaveFacility && (
          <DataCenterDots projection={naProjection as unknown as (c: [number, number]) => [number, number] | null}
            facilities={ALL_FACILITIES}
            onHoverFacility={onHoverFacility}
            onLeaveFacility={onLeaveFacility}
            onSelectFacility={onSelectFacility}
          />
        )}
      </ComposableMap>
    </div>
  );
}
