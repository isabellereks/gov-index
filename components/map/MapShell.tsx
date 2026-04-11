"use client";

import { useMemo, useState } from "react";
import {
  REGION_LABEL,
  REGION_ORDER,
  type Region,
  type ViewTarget,
} from "@/types";
import { getEntity, getOverviewEntity } from "@/lib/placeholder-data";
import type { TooltipState } from "@/lib/map-utils";
import SidePanel from "@/components/panel/SidePanel";
import RegionSlider from "@/components/ui/RegionSlider";
import HistoryNav from "@/components/ui/HistoryNav";
import SearchPill from "@/components/ui/SearchPill";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import NorthAmericaMap from "./NorthAmericaMap";
import USStatesMap from "./USStatesMap";
import EuropeMap from "./EuropeMap";
import AsiaMap from "./AsiaMap";

type ViewState = ViewTarget;

const INITIAL_VIEW: ViewState = {
  region: "na",
  naView: "countries",
  selectedGeoId: null,
};

function viewsEqual(a: ViewState, b: ViewState): boolean {
  return (
    a.region === b.region &&
    a.naView === b.naView &&
    a.selectedGeoId === b.selectedGeoId
  );
}

interface MapShellProps {
  revealProgress?: number;
}

export default function MapShell({ revealProgress = 1 }: MapShellProps) {
  const [history, setHistory] = useState<ViewState[]>([INITIAL_VIEW]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const current = history[historyIdx];
  const { region, naView, selectedGeoId } = current;

  const overviewEntity = useMemo(() => getOverviewEntity(region), [region]);

  const selectedEntity = useMemo(() => {
    if (!selectedGeoId) return overviewEntity;
    const found = getEntity(selectedGeoId, region);
    return found ?? overviewEntity;
  }, [selectedGeoId, region, overviewEntity]);

  const navigateTo = (next: ViewState) => {
    if (viewsEqual(current, next)) return;
    const newHistory = [...history.slice(0, historyIdx + 1), next];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const handleSelectEntity = (geoId: string) =>
    navigateTo({ ...current, selectedGeoId: geoId });

  const handleRegionChange = (next: Region) =>
    navigateTo({ region: next, naView: "countries", selectedGeoId: null });

  const handleResetRegion = () =>
    navigateTo({ region, naView: "countries", selectedGeoId: null });

  const handleResetStates = () =>
    navigateTo({ ...current, selectedGeoId: null });

  const handleViewStates = () =>
    navigateTo({ region: "na", naView: "states", selectedGeoId: null });

  const handleDoubleClickEntity = (geoId: string) => {
    if (geoId === "840") handleViewStates();
  };

  const handleSearchNavigate = (target: ViewTarget) => navigateTo(target);

  const canBack = historyIdx > 0;
  const canForward = historyIdx < history.length - 1;
  const goBack = () => canBack && setHistoryIdx(historyIdx - 1);
  const goForward = () => canForward && setHistoryIdx(historyIdx + 1);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        label: REGION_LABEL[region],
        onClick:
          (region === "na" && (naView === "states" || selectedGeoId)) ||
          (region !== "na" && selectedGeoId)
            ? handleResetRegion
            : undefined,
      },
    ];

    if (region === "na" && naView === "states") {
      items.push({
        label: "United States",
        onClick: selectedGeoId ? handleResetStates : undefined,
      });
      if (selectedGeoId && selectedEntity && !selectedEntity.isOverview) {
        items.push({ label: selectedEntity.name });
      }
    } else if (
      selectedGeoId &&
      selectedEntity &&
      !selectedEntity.isOverview
    ) {
      items.push({ label: selectedEntity.name });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, naView, selectedGeoId, selectedEntity, history, historyIdx]);

  const showViewStatesButton =
    region === "na" &&
    naView === "countries" &&
    selectedEntity?.canDrillDown === true;

  const regionIdx = REGION_ORDER.indexOf(region);

  const zoomT = Math.max(0, Math.min(1, (revealProgress - 0.55) / 0.45));
  const mapScale = 0.88 + zoomT * 0.12;
  const chromeOpacity = Math.max(0, Math.min(1, (revealProgress - 0.85) / 0.12));

  return (
    <div className="fixed inset-0 bg-white overflow-hidden z-0">
      {/* Scaled zoom wrapper — the rail zooms from ~0.78 to 1.0 during the hero blend. */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${mapScale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Sliding region rail — all three regions rendered side-by-side. */}
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(-${regionIdx * 100}%)` }}
        >
          {REGION_ORDER.map((r) => (
          <div
            key={r}
            className="w-full h-full flex-shrink-0 flex items-center justify-center"
          >
            {r === "na" && naView === "countries" && (
              <NorthAmericaMap
                onSelectEntity={handleSelectEntity}
                onDoubleClickEntity={handleDoubleClickEntity}
                selectedGeoId={selectedGeoId}
                setTooltip={setTooltip}
              />
            )}
            {r === "na" && naView === "states" && (
              <USStatesMap
                onSelectEntity={handleSelectEntity}
                selectedGeoId={selectedGeoId}
                setTooltip={setTooltip}
              />
            )}
            {r === "eu" && (
              <EuropeMap
                onSelectEntity={handleSelectEntity}
                selectedGeoId={r === region ? selectedGeoId : null}
                setTooltip={setTooltip}
              />
            )}
            {r === "asia" && (
              <AsiaMap
                onSelectEntity={handleSelectEntity}
                selectedGeoId={r === region ? selectedGeoId : null}
                setTooltip={setTooltip}
              />
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Floating side panel overlay */}
      <div
        className="absolute top-6 left-6 z-30 max-h-[calc(100vh-96px)]"
        style={{ opacity: chromeOpacity, pointerEvents: chromeOpacity < 0.5 ? "none" : "auto" }}
      >
        <SidePanel
          entity={selectedEntity}
          breadcrumbItems={breadcrumbItems}
          showViewStatesButton={showViewStatesButton}
          onViewStates={handleViewStates}
        />
      </div>

      {/* Top-right history nav (back / forward) */}
      <div
        style={{ opacity: chromeOpacity, pointerEvents: chromeOpacity < 0.5 ? "none" : "auto" }}
      >
        <HistoryNav
          canBack={canBack}
          canForward={canForward}
          onBack={goBack}
          onForward={goForward}
        />
      </div>

      {/* Bottom-center region slider — hidden in the US states drill-down */}
      {!(region === "na" && naView === "states") && (
        <div
          style={{ opacity: chromeOpacity, pointerEvents: chromeOpacity < 0.5 ? "none" : "auto" }}
        >
          <RegionSlider region={region} onChange={handleRegionChange} />
        </div>
      )}

      {/* Bottom-right search pill */}
      <div
        style={{ opacity: chromeOpacity, pointerEvents: chromeOpacity < 0.5 ? "none" : "auto" }}
      >
        <SearchPill onNavigate={handleSearchNavigate} />
      </div>

      {/* Tooltip rendered OUTSIDE the slide rail so its position:fixed
          is relative to the viewport, not the transformed rail. */}
      {tooltip && (
        <div
          className="fixed bg-white/85 backdrop-blur-md text-ink text-xs px-3 py-1.5 rounded-full pointer-events-none z-50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] tracking-tight"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
