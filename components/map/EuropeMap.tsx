"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { euProjection } from "@/lib/projections";
import { getEntity } from "@/lib/placeholder-data";
import {
  NEUTRAL_FILL,
  NEUTRAL_STROKE,
  STANCE_HEX,
  type SetTooltip,
} from "@/lib/map-utils";

interface EuropeMapProps {
  onSelectEntity: (geoId: string) => void;
  selectedGeoId: string | null;
  setTooltip: SetTooltip;
}

const euProj = euProjection as unknown as ProjectionFunction;

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const EUROPE_CODES = new Set<number>([
  8, 20, 31, 40, 51, 56, 70, 100, 112, 191, 196, 203, 208, 233, 246, 250, 268,
  276, 292, 300, 336, 348, 352, 372, 380, 428, 438, 440, 442, 470, 492, 498,
  499, 528, 578, 616, 620, 642, 643, 674, 688, 703, 705, 724, 752, 756, 792,
  804, 807, 826,
]);

const BLOB_STYLE = {
  fill: NEUTRAL_FILL,
  stroke: NEUTRAL_FILL,
  strokeWidth: 0,
  outline: "none",
  pointerEvents: "none" as const,
};

export default function EuropeMap({
  onSelectEntity,
  selectedGeoId,
  setTooltip,
}: EuropeMapProps) {
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
        projection={euProj}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={WORLD_URL}>
          {({ geographies }) =>
            geographies
              .filter((g) => EUROPE_CODES.has(parseInt(g.id, 10)))
              // Render selected last so its stroke sits on top of neighbours.
              .sort((a, b) => {
                const aSel = (a.id as string) === selectedGeoId;
                const bSel = (b.id as string) === selectedGeoId;
                return aSel === bSel ? 0 : aSel ? 1 : -1;
              })
              .map((geo) => {
                const id = geo.id as string;
                const name = geo.properties.name as string;
                const ent = getEntity(id, "eu");
                const interactive = ent !== null;
                const isSelected = selectedGeoId === id;

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

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, label: name })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onSelectEntity(id)}
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
              })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
