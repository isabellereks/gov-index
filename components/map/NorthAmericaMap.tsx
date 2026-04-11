"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { naProjection } from "@/lib/projections";
import { getEntity } from "@/lib/placeholder-data";
import {
  NEUTRAL_STROKE,
  STANCE_HEX,
  type SetTooltip,
} from "@/lib/map-utils";

interface NorthAmericaMapProps {
  onSelectEntity: (geoId: string) => void;
  onDoubleClickEntity?: (geoId: string) => void;
  selectedGeoId: string | null;
  setTooltip: SetTooltip;
}

const naProj = naProjection as unknown as ProjectionFunction;

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const NA_IDS = new Set(["840", "124"]);

export default function NorthAmericaMap({
  onSelectEntity,
  onDoubleClickEntity,
  selectedGeoId,
  setTooltip,
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
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={WORLD_URL}>
          {({ geographies }) => {
            const naFeatures = geographies
              .filter((g) => NA_IDS.has(g.id))
              // Render selected last so its stroke sits on top of neighbours.
              .sort((a, b) => {
                const aSel = (a.id as string) === selectedGeoId;
                const bSel = (b.id as string) === selectedGeoId;
                return aSel === bSel ? 0 : aSel ? 1 : -1;
              });
            return naFeatures.map((geo) => {
              const id = geo.id as string;
              const ent = getEntity(id, "na");
              if (!ent) return null;
              const isSelected = selectedGeoId === id;
              const name = id === "840" ? "United States" : "Canada";

              const fill = STANCE_HEX[ent.stance];
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

              const hoverFilter = isSelected
                ? "drop-shadow(0 4px 12px rgba(0,0,0,0.18)) brightness(0.94)"
                : "brightness(0.94)";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, label: name })
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
      </ComposableMap>
    </div>
  );
}
