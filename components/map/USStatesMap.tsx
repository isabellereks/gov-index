"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { usProjection } from "@/lib/projections";
import { getEntity } from "@/lib/placeholder-data";
import { getEntityColorForDimension } from "@/lib/dimensions";
import {
  NEUTRAL_FILL,
  NEUTRAL_STROKE,
  type SetTooltip,
} from "@/lib/map-utils";
import { US_FACILITIES } from "@/lib/datacenters";
import { getMunicipalitiesByState } from "@/lib/municipal-data";
import type { DataCenter, Dimension, DimensionLens } from "@/types";
import DataCenterDots from "./DataCenterDots";

interface USStatesMapProps {
  onSelectEntity: (geoId: string) => void;
  onDoubleClickEntity?: (geoId: string) => void;
  selectedGeoId: string | null;
  setTooltip: SetTooltip;
  dimension?: Dimension;
  lens?: DimensionLens;
  showDataCenters?: boolean;
  /** When set, that state visually "lifts" (scales up + drop-shadow) and
   *  the rest fade — staged before MapShell flips to CountyMap so the
   *  drill reads as a focus, not a hard cut. */
  drillingTo?: string | null;
  onHoverFacility?: (
    dc: DataCenter,
    x: number,
    y: number,
    clusterSize: number,
  ) => void;
  onLeaveFacility?: () => void;
  onSelectFacility?: (dc: DataCenter) => void;
}

const usProj = usProjection as unknown as ProjectionFunction;

const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const BLOB_STYLE = {
  fill: NEUTRAL_FILL,
  stroke: NEUTRAL_FILL,
  strokeWidth: 0,
  outline: "none",
  pointerEvents: "none" as const,
};

export default function USStatesMap({
  onSelectEntity,
  onDoubleClickEntity,
  selectedGeoId,
  setTooltip,
  dimension = "overall",
  lens = "datacenter",
  showDataCenters = false,
  drillingTo = null,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
}: USStatesMapProps) {
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
        projection={usProj}
        style={{
          width: "100%",
          height: "100%",
          shapeRendering: "geometricPrecision",
        }}
      >
        <Geographies geography={STATES_URL}>
          {({ geographies }) =>
            // Render selected last so its stroke sits on top of neighbours.
            // Drilling target ranks even higher so the "lift" sits above
            // every other state during the drill animation.
            geographies
              .slice()
              .sort((a, b) => {
                const an = a.properties.name as string;
                const bn = b.properties.name as string;
                const rank = (n: string) =>
                  n === drillingTo ? 2 : n === selectedGeoId ? 1 : 0;
                return rank(an) - rank(bn);
              })
              .map((geo) => {
              const name = geo.properties.name as string;
              const ent = getEntity(name, "na");
              const interactive = ent !== null;
              const isSelected = selectedGeoId === name;

              if (!interactive) {
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: BLOB_STYLE,
                      hover: BLOB_STYLE,
                      pressed: BLOB_STYLE,
                    }}
                  />
                );
              }

              const fill = getEntityColorForDimension(ent, dimension, lens);
              const stroke = isSelected ? "#FFFFFF" : NEUTRAL_STROKE;
              const strokeWidth = isSelected ? 4 : 1.5;
              const drillable = getMunicipalitiesByState(name).length > 0;
              const isDrillTarget = drillingTo === name;
              const isDrillOther = drillingTo !== null && !isDrillTarget;

              const base = {
                fill,
                stroke: isDrillTarget ? "#FFFFFF" : stroke,
                strokeWidth: isDrillTarget ? 5 : strokeWidth,
                strokeLinejoin: "round" as const,
                strokeLinecap: "round" as const,
                outline: "none",
                // Only states with municipal data can be drilled into via
                // double-click. Surface that affordance via the cursor so
                // the gesture is discoverable.
                cursor: drillable ? "zoom-in" : "pointer",
                transition:
                  "stroke 200ms, stroke-width 200ms, filter 380ms cubic-bezier(0.32,0.72,0,1), opacity 380ms ease, transform 380ms cubic-bezier(0.32,0.72,0,1)",
                transformBox: "fill-box" as const,
                transformOrigin: "center" as const,
                opacity: isDrillOther ? 0.12 : 1,
                transform: isDrillTarget ? "scale(1.45)" : undefined,
                filter: isDrillTarget
                  ? "drop-shadow(0 22px 40px rgba(0,0,0,0.35)) drop-shadow(0 6px 14px rgba(0,0,0,0.18)) brightness(1.06)"
                  : isSelected
                    ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                    : undefined,
              };

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      label: name,
                      geoId: name,
                      region: "na",
                      drillable,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => onSelectEntity(name)}
                  onDoubleClick={() => onDoubleClickEntity?.(name)}
                  style={{
                    default: base,
                    hover: {
                      ...base,
                      filter: isSelected
                        ? "drop-shadow(0 4px 12px rgba(0,0,0,0.18)) brightness(0.94)"
                        : "brightness(0.94)",
                    },
                    pressed: base,
                  }}
                />
              );
            })}
        </Geographies>
        {showDataCenters && onHoverFacility && onLeaveFacility && (
          <DataCenterDots projection={usProjection as unknown as (c: [number, number]) => [number, number] | null}
            facilities={US_FACILITIES}
            onHoverFacility={onHoverFacility}
            onLeaveFacility={onLeaveFacility}
            onSelectFacility={onSelectFacility}
            clusterDeg={0.55}
          />
        )}
      </ComposableMap>
    </div>
  );
}
