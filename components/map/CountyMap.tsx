"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { NEUTRAL_FILL, NEUTRAL_STROKE, type SetTooltip } from "@/lib/map-utils";
import {
  getMunicipalitiesByState,
  getMunicipalityByFips,
} from "@/lib/municipal-data";
import { STATE_FIPS, type MunicipalActionStatus } from "@/types";
import DataCenterDots from "./DataCenterDots";
import { US_FACILITIES } from "@/lib/datacenters";

interface CountyMapProps {
  stateName: string;
  onSelectCounty: (fips: string) => void;
  selectedCountyFips: string | null;
  setTooltip: SetTooltip;
  showDataCenters?: boolean;
}

const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

/** Most severe action status in a county determines its choropleth color. */
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

function statusFill(status: MunicipalActionStatus | null): string {
  if (status === "enacted") return "var(--color-stance-restrictive)";
  if (status === "under-review") return "var(--color-stance-concerning)";
  if (status === "proposed") return "var(--color-stance-review)";
  if (status === "failed") return "var(--color-stance-none)";
  return NEUTRAL_FILL;
}

export default function CountyMap({
  stateName,
  onSelectCounty,
  selectedCountyFips,
  setTooltip,
  showDataCenters = false,
}: CountyMapProps) {
  const statePrefix = STATE_FIPS[stateName];

  // Reuse the same Albers USA projection the states map uses but re-scaled
  // later per-state via d3's fitSize. That happens inside the render callback
  // below because it needs the actual filtered features.
  const baseProjection = useMemo(
    () => geoAlbersUsa().scale(900).translate([480, 300]),
    [],
  );

  // Reserved for future action list headers — suppress unused warning.
  void getMunicipalitiesByState(stateName);

  if (!statePrefix) {
    return (
      <div className="flex items-center justify-center text-sm text-muted">
        Counties not available for {stateName}
      </div>
    );
  }

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
        projection={baseProjection as unknown as ProjectionFunction}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={COUNTIES_URL}>
          {({ geographies }) => {
            // Filter to the selected state's counties
            const stateCounties = geographies.filter((g) =>
              String(g.id).startsWith(statePrefix),
            );

            // Re-fit the projection to the state bbox so the state fills the frame
            if (stateCounties.length > 0) {
              const featureCollection = {
                type: "FeatureCollection" as const,
                features: stateCounties.map((g) => g as unknown as GeoJSON.Feature),
              };
              try {
                // fitSize mutates in place. d3 types don't love this but it works.
                (
                  baseProjection as unknown as {
                    fitExtent: (
                      extent: [[number, number], [number, number]],
                      object: unknown,
                    ) => unknown;
                  }
                ).fitExtent(
                  [
                    [40, 40],
                    [920, 560],
                  ],
                  featureCollection,
                );
                // Invalidate the cached path so Geographies re-renders
                void geoPath(baseProjection);
              } catch {
                // ignore fit errors
              }
            }

            return stateCounties.map((geo) => {
              const fips = String(geo.id).padStart(5, "0");
              const municipality = getMunicipalityByFips(fips);
              const countyName =
                (geo.properties as { name?: string })?.name ?? fips;
              const statuses: MunicipalActionStatus[] =
                municipality?.actions.map((a) => a.status) ?? [];
              const dominant = dominantStatus(statuses);
              const isSelected = selectedCountyFips === fips;
              const hasData = !!municipality;
              const fill = hasData ? statusFill(dominant) : NEUTRAL_FILL;
              const stroke = isSelected ? "#1D1D1F" : NEUTRAL_STROKE;
              const strokeWidth = isSelected ? 2 : 0.4;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      label: hasData
                        ? `${countyName} — ${municipality!.actions.length} local action${municipality!.actions.length === 1 ? "" : "s"}`
                        : countyName,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => onSelectCounty(fips)}
                  style={{
                    default: {
                      fill,
                      stroke,
                      strokeWidth,
                      strokeLinejoin: "round",
                      outline: "none",
                      cursor: hasData ? "pointer" : "default",
                      transition: "stroke 200ms, stroke-width 200ms, filter 200ms",
                    },
                    hover: {
                      fill,
                      stroke,
                      strokeWidth,
                      outline: "none",
                      cursor: hasData ? "pointer" : "default",
                      filter: hasData ? "brightness(0.95)" : undefined,
                    },
                    pressed: {
                      fill,
                      stroke,
                      strokeWidth,
                      outline: "none",
                    },
                  }}
                />
              );
            });
          }}
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
