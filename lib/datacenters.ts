import type { DataCenter } from "@/types";
import epochData from "@/data/datacenters/epoch-ai.json";
import researchedData from "@/data/datacenters/researched.json";
import internationalData from "@/data/datacenters/international.json";

// researched.json stores `state` as the USPS 2-letter code ("OR");
// epoch-ai.json stores the full name ("Oregon"). Normalize to the full
// name so entity.name-based filtering works for both.
const USPS_TO_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function normalizeState(f: DataCenter): DataCenter {
  if (f.state && f.state.length === 2) {
    const full = USPS_TO_NAME[f.state.toUpperCase()];
    if (full) return { ...f, state: full };
  }
  return f;
}

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
for (const f of EPOCH.facilities ?? []) merged.set(f.id, normalizeState(f));
for (const f of RESEARCHED.facilities ?? []) {
  if (!merged.has(f.id)) merged.set(f.id, normalizeState(f));
}
for (const f of INTERNATIONAL.facilities ?? []) {
  if (!merged.has(f.id)) merged.set(f.id, normalizeState(f));
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

export function facilitiesForEntity(entity: {
  level: string;
  region: string;
  name: string;
}): { facilities: DataCenter[]; groupBy: "state" | "country" | null } {
  if (entity.level === "bloc") {
    const byRegion =
      entity.region === "eu"
        ? EU_FACILITIES
        : entity.region === "asia"
          ? ASIA_FACILITIES
          : US_FACILITIES;
    return {
      facilities: byRegion,
      groupBy: entity.region === "na" ? "state" : "country",
    };
  }
  if (entity.level === "state") {
    return {
      facilities: ALL_FACILITIES.filter((f) => f.state === entity.name),
      groupBy: null,
    };
  }
  const inCountry = ALL_FACILITIES.filter((f) => f.country === entity.name);
  return {
    facilities: inCountry,
    groupBy: entity.name === "United States" ? "state" : null,
  };
}
