import type { Dispatch, SetStateAction } from "react";
import type { StanceType } from "@/types";

export const STANCE_HEX: Record<StanceType, string> = {
  restrictive: "#BD8369",
  review: "#C5A468",
  favorable: "#80A589",
  concerning: "#AA655B",
  none: "#B8B5AC",
};

export const NEUTRAL_FILL = "#EFEDE8";
export const NEUTRAL_STROKE = "#E5E5E5";
export const INK = "#1D1D1F";

export interface TooltipState {
  x: number;
  y: number;
  label: string;
}

export type SetTooltip = Dispatch<SetStateAction<TooltipState | null>>;
