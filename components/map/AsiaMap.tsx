"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { asiaProjection } from "@/lib/projections";
import { getEntity } from "@/lib/placeholder-data";
import { getEntityColorForDimension } from "@/lib/dimensions";
import {
  NEUTRAL_FILL,
  NEUTRAL_STROKE,
  type SetTooltip,
} from "@/lib/map-utils";
import { ASIA_FACILITIES } from "@/lib/datacenters";
import type { DataCenter, Dimension, DimensionLens } from "@/types";
import DataCenterDots from "./DataCenterDots";

interface AsiaMapProps {
  onSelectEntity: (geoId: string) => void;
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

const asiaProj = asiaProjection as unknown as ProjectionFunction;

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Asia + Oceania country ISO numeric codes. Includes Australia (36),
// New Zealand (554), and Papua New Guinea (598) so the Pacific edge is
// visible alongside East and Southeast Asia.
const ASIA_CODES = new Set<number>([
  4, 31, 36, 50, 51, 64, 96, 104, 116, 144, 156, 158, 196, 242, 268, 275, 296,
  344, 356, 360, 364, 368, 376, 392, 398, 400, 408, 410, 414, 417, 418, 422,
  446, 458, 462, 469, 496, 512, 524, 540, 548, 554, 586, 598, 608, 626, 634,
  643, 682, 686, 702, 704, 706, 716, 760, 762, 764, 776, 784, 792, 795, 860,
  882, 887,
]);

const BLOB_STYLE = {
  fill: NEUTRAL_FILL,
  stroke: NEUTRAL_FILL,
  strokeWidth: 0,
  outline: "none",
  pointerEvents: "none" as const,
};

export default function AsiaMap({
  onSelectEntity,
  selectedGeoId,
  setTooltip,
  dimension = "overall",
  lens = "datacenter",
  showDataCenters = false,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
}: AsiaMapProps) {
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
        projection={asiaProj}
        style={{
          width: "100%",
          height: "100%",
          shapeRendering: "geometricPrecision",
        }}
      >
        <Geographies geography={WORLD_URL}>
          {({ geographies }) =>
            geographies
              .filter((g) => ASIA_CODES.has(parseInt(g.id, 10)))
              // Render selected last so its stroke sits on top of neighbours.
              .sort((a, b) => {
                // World-atlas pads ISO codes to 3 digits ("036"); our entity
                // DB stores them unpadded ("36"). Normalize so lookups match.
                const aId = String(parseInt(a.id as string, 10));
                const bId = String(parseInt(b.id as string, 10));
                const aSel = aId === selectedGeoId;
                const bSel = bId === selectedGeoId;
                return aSel === bSel ? 0 : aSel ? 1 : -1;
              })
              .map((geo) => {
                const id = String(parseInt(geo.id as string, 10));
                const name = geo.properties.name as string;
                const ent = getEntity(id, "asia");
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

                const fill = getEntityColorForDimension(ent, dimension, lens);
                const stroke = isSelected ? "#FFFFFF" : NEUTRAL_STROKE;
                const strokeWidth = isSelected ? 4 : 1.5;

                // Taiwan (ISO 158) is a sliver at Asia's scale — the
                // visible path + hit target is too small to click
                // without accidentally catching a data-center dot
                // layered on top. Scale just this one country so both
                // the fill and the click surface grow together.
                const isTaiwan = id === "158";
                const scaleBump = isTaiwan ? "scale(2.6)" : undefined;

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
                  ...(scaleBump
                    ? {
                        transform: scaleBump,
                        transformBox: "fill-box" as const,
                        transformOrigin: "center" as const,
                      }
                    : {}),
                };

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) =>
                      setTooltip({ x: e.clientX, y: e.clientY, label: name, geoId: id, region: "asia" })
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
        {showDataCenters && onHoverFacility && onLeaveFacility && (
          <DataCenterDots projection={asiaProjection as unknown as (c: [number, number]) => [number, number] | null}
            facilities={ASIA_FACILITIES}
            onHoverFacility={onHoverFacility}
            onLeaveFacility={onLeaveFacility}
            onSelectFacility={onSelectFacility}
          />
        )}
      </ComposableMap>
    </div>
  );
}
