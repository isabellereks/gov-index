import type { DataCenter } from "@/types";
import epochData from "@/data/datacenters/epoch-ai.json";

interface EpochFile {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  facilities: DataCenter[];
}

const EPOCH = epochData as unknown as EpochFile;

export const ALL_FACILITIES: DataCenter[] = [...(EPOCH.facilities ?? [])];

export const US_FACILITIES: DataCenter[] = ALL_FACILITIES.filter(
  (f) => f.country === "United States",
);

export const EPOCH_ATTRIBUTION =
  "Frontier data center locations from Epoch AI (CC-BY)";
