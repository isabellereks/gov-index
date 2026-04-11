export type Region = "na" | "eu" | "asia";

/** Sub-view inside the NA region: country-level vs US-states drill-down. */
export type NaView = "countries" | "states";

export interface ViewTarget {
  region: Region;
  naView: NaView;
  selectedGeoId: string | null;
}

export type Stage =
  | "Filed"
  | "Committee"
  | "Floor"
  | "Enacted"
  | "Carried Over"
  | "Dead";

export type StanceType =
  | "restrictive"
  | "review"
  | "favorable"
  | "concerning"
  | "none";

export type GovLevel = "federal" | "state" | "bloc";

export interface Legislation {
  id: string;
  billCode: string;
  title: string;
  summary: string;
  stage: Stage;
  tags: string[];
  sourceUrl?: string;
}

export interface Legislator {
  id: string;
  name: string;
  role: string;
  party: string;
  stance: StanceType;
  quote?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  url: string;
}

export interface Entity {
  id: string;
  geoId: string;
  name: string;
  region: Region;
  level: GovLevel;
  /** True for the regional overview entity (one per region). */
  isOverview?: boolean;
  /** True if this entity has a state-level drill-down (currently only US). */
  canDrillDown?: boolean;
  stance: StanceType;
  contextBlurb: string;
  legislation: Legislation[];
  keyFigures: Legislator[];
  news: NewsItem[];
}

export const REGION_LABEL: Record<Region, string> = {
  na: "North America",
  eu: "European Union",
  asia: "Asia",
};

export const REGION_ORDER: Region[] = ["na", "eu", "asia"];
