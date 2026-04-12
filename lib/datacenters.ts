import type { DataCenter } from "@/types";
import epochData from "@/data/datacenters/epoch-ai.json";
import researchedData from "@/data/datacenters/researched.json";
import internationalData from "@/data/datacenters/international.json";

interface EpochFile {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  facilities: DataCenter[];
}

interface ResearchedFile {
  generatedAt: string;
  facilities: DataCenter[];
}

const EPOCH = epochData as unknown as EpochFile;
const RESEARCHED = researchedData as unknown as ResearchedFile;
const INTERNATIONAL = internationalData as unknown as ResearchedFile;

// Merge Epoch (confident, frontier US) with Claude-researched US (broader
// US coverage) and Claude-researched international (EU + Asia + Oceania).
// Dedupe by id so re-runs of any sync can't double-count.
const merged = new Map<string, DataCenter>();
for (const f of EPOCH.facilities ?? []) merged.set(f.id, f);
for (const f of RESEARCHED.facilities ?? []) {
  if (!merged.has(f.id)) merged.set(f.id, f);
}
for (const f of INTERNATIONAL.facilities ?? []) {
  if (!merged.has(f.id)) merged.set(f.id, f);
}

export const ALL_FACILITIES: DataCenter[] = Array.from(merged.values());

export const US_FACILITIES: DataCenter[] = ALL_FACILITIES.filter(
  (f) => f.country === "United States",
);

// ISO-3166 numeric → DataCenter.country used in the JSON files. Ordering
// follows the EUROPE_CODES / ASIA_CODES sets in the regional map components
// so the dots and the interactive country shapes stay in sync.
const EU_COUNTRIES = new Set<string>([
  "Netherlands",
  "Ireland",
  "Sweden",
  "Finland",
  "Germany",
  "France",
  "United Kingdom",
  "Spain",
  "Italy",
  "Poland",
  "Denmark",
  "Norway",
  "Belgium",
  "Austria",
  "Portugal",
  "Greece",
  "Czech Republic",
  "Czechia",
  "Switzerland",
  "Luxembourg",
]);

const ASIA_COUNTRIES = new Set<string>([
  "Japan",
  "China",
  "South Korea",
  "Republic of Korea",
  "Singapore",
  "India",
  "Taiwan",
  "Indonesia",
  "Australia",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Hong Kong",
]);

export const EU_FACILITIES: DataCenter[] = ALL_FACILITIES.filter(
  (f) => f.country !== undefined && EU_COUNTRIES.has(f.country),
);

export const ASIA_FACILITIES: DataCenter[] = ALL_FACILITIES.filter(
  (f) => f.country !== undefined && ASIA_COUNTRIES.has(f.country),
);

export const EPOCH_ATTRIBUTION =
  "Frontier data centers from Epoch AI (CC-BY); supplementary research from public reporting";
