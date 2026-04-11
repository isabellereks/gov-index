export type Region = "na" | "eu" | "asia";

/** Sub-view inside the NA region: countries → states → counties drill-down. */
export type NaView = "countries" | "states" | "counties";

export interface ViewTarget {
  region: Region;
  naView: NaView;
  selectedGeoId: string | null;
  /** State to drill into for county view. Full name, e.g. "Virginia". */
  selectedStateName?: string | null;
  /** 5-digit FIPS of the selected county (when naView === "counties"). */
  selectedCountyFips?: string | null;
}

export type MunicipalActionStatus =
  | "enacted"
  | "proposed"
  | "under-review"
  | "failed";

export interface MunicipalAction {
  title: string;
  date: string;
  status: MunicipalActionStatus;
  summary: string;
  sourceUrl?: string;
}

export interface MunicipalEntity {
  id: string;
  name: string;
  /** 5-digit FIPS code matching the us-atlas counties-10m.json feature id. */
  fips: string;
  state: string;
  stateCode: string;
  type: "county" | "city" | "town" | "township";
  actions: MunicipalAction[];
  concerns: ImpactTag[];
  contextBlurb: string;
}

/** State name → 2-digit FIPS prefix. */
export const STATE_FIPS: Record<string, string> = {
  Alabama: "01",
  Alaska: "02",
  Arizona: "04",
  Arkansas: "05",
  California: "06",
  Colorado: "08",
  Connecticut: "09",
  Delaware: "10",
  Florida: "12",
  Georgia: "13",
  Hawaii: "15",
  Idaho: "16",
  Illinois: "17",
  Indiana: "18",
  Iowa: "19",
  Kansas: "20",
  Kentucky: "21",
  Louisiana: "22",
  Maine: "23",
  Maryland: "24",
  Massachusetts: "25",
  Michigan: "26",
  Minnesota: "27",
  Mississippi: "28",
  Missouri: "29",
  Montana: "30",
  Nebraska: "31",
  Nevada: "32",
  "New Hampshire": "33",
  "New Jersey": "34",
  "New Mexico": "35",
  "New York": "36",
  "North Carolina": "37",
  "North Dakota": "38",
  Ohio: "39",
  Oklahoma: "40",
  Oregon: "41",
  Pennsylvania: "42",
  "Rhode Island": "44",
  "South Carolina": "45",
  "South Dakota": "46",
  Tennessee: "47",
  Texas: "48",
  Utah: "49",
  Vermont: "50",
  Virginia: "51",
  Washington: "53",
  "West Virginia": "54",
  Wisconsin: "55",
  Wyoming: "56",
};

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

/**
 * Single label map used for both US states and countries. Replaces the
 * older Restricting / Cautionary / Under Review / No Activity / Encouraging
 * system — those were vague and didn't work equally for both contexts.
 */
export const STANCE_LABEL: Record<StanceType, string> = {
  restrictive: "Active Restrictions",
  concerning: "Legislative Process",
  review: "Under Discussion",
  none: "No Action",
  favorable: "Innovation-Friendly",
};

export type GovLevel = "federal" | "state" | "bloc";

export type ImpactTag =
  // Environmental
  | "water-consumption"
  | "carbon-emissions"
  | "protected-land"
  | "environmental-review"
  | "renewable-energy"
  // Infrastructure
  | "grid-capacity"
  | "energy-rates"
  | "water-infrastructure"
  // Community
  | "noise-vibration"
  | "local-zoning"
  | "local-control"
  | "residential-proximity"
  | "property-values"
  // Economic
  | "tax-incentives"
  | "job-creation"
  | "economic-development"
  | "nda-transparency"
  // AI-specific
  | "algorithmic-transparency"
  | "ai-safety"
  | "deepfake-regulation"
  | "ai-in-healthcare"
  | "ai-in-employment"
  | "ai-in-education"
  | "child-safety"
  | "data-privacy";

export type LegislationCategory =
  | "data-center-siting"
  | "data-center-energy"
  | "ai-governance"
  | "synthetic-media"
  | "ai-healthcare"
  | "ai-workforce"
  | "ai-education"
  | "ai-government"
  | "data-privacy"
  | "ai-criminal-justice";

export type Dimension =
  | "overall"
  // Data Center lens
  | "environmental"
  | "energy"
  | "community"
  | "land-use"
  // AI Regulation lens
  | "ai-governance-dim"
  | "ai-consumer"
  | "ai-workforce"
  | "ai-public"
  | "ai-synthetic";

export type DimensionLens = "datacenter" | "ai";

export const DATACENTER_DIMENSIONS: Dimension[] = [
  "environmental",
  "energy",
  "community",
  "land-use",
];

export const AI_DIMENSIONS: Dimension[] = [
  "ai-governance-dim",
  "ai-consumer",
  "ai-workforce",
  "ai-public",
  "ai-synthetic",
];

export const IMPACT_TAG_LABEL: Record<ImpactTag, string> = {
  "water-consumption": "Water Consumption",
  "carbon-emissions": "Carbon Emissions",
  "protected-land": "Protected Land",
  "environmental-review": "Environmental Review",
  "renewable-energy": "Renewable Energy",
  "grid-capacity": "Grid Capacity",
  "energy-rates": "Energy Rates",
  "water-infrastructure": "Water Infrastructure",
  "noise-vibration": "Noise & Vibration",
  "local-zoning": "Local Zoning",
  "local-control": "Local Control",
  "residential-proximity": "Residential Proximity",
  "property-values": "Property Values",
  "tax-incentives": "Tax Incentives",
  "job-creation": "Job Creation",
  "economic-development": "Economic Development",
  "nda-transparency": "NDA Transparency",
  "algorithmic-transparency": "Algorithmic Transparency",
  "ai-safety": "AI Safety",
  "deepfake-regulation": "Deepfake Regulation",
  "ai-in-healthcare": "AI in Healthcare",
  "ai-in-employment": "AI in Employment",
  "ai-in-education": "AI in Education",
  "child-safety": "Child Safety",
  "data-privacy": "Data Privacy",
};

export const CATEGORY_LABEL: Record<LegislationCategory, string> = {
  "data-center-siting": "Data Center Siting",
  "data-center-energy": "Data Center Energy",
  "ai-governance": "AI Governance",
  "synthetic-media": "Synthetic Media",
  "ai-healthcare": "AI in Healthcare",
  "ai-workforce": "AI in Workforce",
  "ai-education": "AI in Education",
  "ai-government": "AI in Government",
  "data-privacy": "Data Privacy",
  "ai-criminal-justice": "AI in Criminal Justice",
};

export const DIMENSION_LABEL: Record<Dimension, string> = {
  overall: "Overall stance",
  // Data Center lens
  environmental: "Environmental impact",
  energy: "Energy & grid",
  community: "Community impact",
  "land-use": "Land use",
  // AI Regulation lens
  "ai-governance-dim": "Governance",
  "ai-consumer": "Consumer protection",
  "ai-workforce": "Workforce & employment",
  "ai-public": "Public services",
  "ai-synthetic": "Synthetic media",
};

export interface Legislation {
  id: string;
  billCode: string;
  title: string;
  summary: string;
  stage: Stage;
  /** Per-bill stance, primarily from Claude semantic classification. */
  stance?: StanceType;
  impactTags: ImpactTag[];
  category: LegislationCategory;
  updatedDate: string;
  partyOrigin?: "R" | "D" | "B";
  sourceUrl?: string;
  legiscanUrl?: string;
  legiscanId?: number;
  sponsors?: string[];
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

export type DataCenterStatus = "proposed" | "under-construction" | "operational";

export interface DataCenter {
  id: string;
  operator: string;
  location: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  capacityMW?: number;
  status: DataCenterStatus;
  yearBuilt?: number;
  yearProposed?: number;
  notes?: string;
  concerns?: string[];
  source: "epoch-ai" | "researched";
  primaryUser?: string;
  computeH100e?: number;
  costUSD?: number;
}

export const REGION_LABEL: Record<Region, string> = {
  na: "North America",
  eu: "European Union",
  asia: "Asia",
};

export const REGION_ORDER: Region[] = ["na", "eu", "asia"];
