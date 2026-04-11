"use client";

import { Marker } from "react-simple-maps";
import type { DataCenter, DataCenterStatus } from "@/types";
import type { SetTooltip } from "@/lib/map-utils";

interface DataCenterDotsProps {
  facilities: DataCenter[];
  setTooltip: SetTooltip;
}

function dotRadius(mw: number | undefined): number {
  return Math.max(2, Math.sqrt(mw ?? 50) * 0.4);
}

function dotOpacity(status: DataCenterStatus): number {
  if (status === "operational") return 0.6;
  if (status === "under-construction") return 0.7;
  return 0.45;
}

function formatMW(mw: number | undefined): string {
  if (!mw) return "unknown MW";
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${Math.round(mw)} MW`;
}

function shortLocation(location: string): string {
  return location.split(",")[0]?.trim() || location;
}

function tooltipLabel(dc: DataCenter): string {
  const parts = [
    `${dc.operator} — ${shortLocation(dc.location)}`,
    `${formatMW(dc.capacityMW)} · ${dc.status}`,
  ];
  if (dc.primaryUser && dc.primaryUser !== dc.operator) {
    parts.push(`Used by ${dc.primaryUser.replace(/\s*#\w+/g, "").trim()}`);
  }
  return parts.join(" · ");
}

export default function DataCenterDots({
  facilities,
  setTooltip,
}: DataCenterDotsProps) {
  return (
    <g>
      {facilities.map((dc) => {
        const r = dotRadius(dc.capacityMW);
        const isProposed = dc.status === "proposed";
        return (
          <Marker key={dc.id} coordinates={[dc.lng, dc.lat]}>
            <circle
              r={r}
              fill={isProposed ? "none" : "#1D1D1F"}
              stroke="#1D1D1F"
              strokeWidth={isProposed ? 1.25 : 0.5}
              style={{
                opacity: dotOpacity(dc.status),
                cursor: "pointer",
                pointerEvents: "all",
              }}
              onMouseEnter={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  label: tooltipLabel(dc),
                })
              }
              onMouseMove={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  label: tooltipLabel(dc),
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
          </Marker>
        );
      })}
    </g>
  );
}
