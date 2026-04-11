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
import type { Dimension } from "@/types";
import DataCenterDots from "./DataCenterDots";

interface USStatesMapProps {
  onSelectEntity: (geoId: string) => void;
  onDoubleClickEntity?: (geoId: string) => void;
  selectedGeoId: string | null;
  setTooltip: SetTooltip;
  dimension?: Dimension;
  showDataCenters?: boolean;
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
  showDataCenters = false,
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
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={STATES_URL}>
          {({ geographies }) =>
            // Render selected last so its stroke sits on top of neighbours.
            geographies
              .slice()
              .sort((a, b) => {
                const aSel = (a.properties.name as string) === selectedGeoId;
                const bSel = (b.properties.name as string) === selectedGeoId;
                return aSel === bSel ? 0 : aSel ? 1 : -1;
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

              const fill = getEntityColorForDimension(ent, dimension);
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
                transition: "stroke 200ms, stroke-width 200ms, filter 200ms",
                filter: isSelected
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                  : undefined,
              };

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, label: name })
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
        {showDataCenters && (
          <DataCenterDots
            facilities={US_FACILITIES}
            setTooltip={setTooltip}
          />
        )}
      </ComposableMap>
    </div>
  );
}
