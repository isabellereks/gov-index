"use client";

import { REGION_LABEL, REGION_ORDER, type Region } from "@/types";

interface RegionSliderProps {
  region: Region;
  onChange: (region: Region) => void;
}

export default function RegionSlider({ region, onChange }: RegionSliderProps) {
  const idx = REGION_ORDER.indexOf(region);
  const len = REGION_ORDER.length;

  const goPrev = () => onChange(REGION_ORDER[(idx - 1 + len) % len]);
  const goNext = () => onChange(REGION_ORDER[(idx + 1) % len]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
      <div className="text-xs font-medium text-ink tracking-tight pointer-events-none">
        {REGION_LABEL[region]}
      </div>
      <div className="pointer-events-auto inline-flex items-center gap-3 px-3 py-2 rounded-full bg-white/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] border border-black/[.04]">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous region"
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-black/[.04] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2L3.5 6L7.5 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2 px-1">
          {REGION_ORDER.map((r) => {
            const active = r === region;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChange(r)}
                aria-label={REGION_LABEL[r]}
                aria-current={active}
                className="group flex items-center justify-center w-3 h-3"
              >
                <span
                  className={`block rounded-full transition-all ${
                    active
                      ? "w-2 h-2 bg-ink"
                      : "w-1.5 h-1.5 bg-black/20 group-hover:bg-black/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next region"
          className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-black/[.04] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 2L8.5 6L4.5 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
