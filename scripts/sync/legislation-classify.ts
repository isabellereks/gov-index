/**
 * Classify ingested bills into the app's Legislation shape.
 *
 * Reads:   data/raw/legiscan/bills/{STATE}.json
 * Writes:  data/legislation/{stateCode}.json  (states)
 *          data/legislation/federal.json      (US)
 *
 * The classification is heuristic — keyword matches in title + description
 * drive category + impactTags + stance. A later pass can upgrade this with
 * Claude if needed, but heuristics give decent coverage for free.
 *
 * The LegiScan progress events are mapped to our Stage enum:
 *   1 = Introduced        -> "Filed"
 *   2 = Engrossed         -> "Floor"
 *   3 = Enrolled          -> "Floor"
 *   4 = Passed            -> "Enacted"
 *   5 = Vetoed            -> "Dead"
 *   6 = Failed / Died     -> "Dead"
 *   7 = Override          -> "Enacted"
 *   8 = Chaptered         -> "Enacted"
 *   9 = Refer/Committee   -> "Committee"
 *   10= Report Pass       -> "Committee"
 *   11= Report DNP        -> "Dead"
 *   12= Draft             -> "Filed"
 *  otherwise -> "Filed" (safe default)
 */

import "../env.js";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ImpactTag,
  Legislation,
  LegislationCategory,
  Stage,
  StanceType,
} from "../../types/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const RAW_BILLS_DIR = join(ROOT, "data/raw/legiscan/bills");
const CLAUDE_CACHE_PATH = join(ROOT, "data/raw/claude/classifications.json");
const OUT_DIR = join(ROOT, "data/legislation");
const OUT_STATES_DIR = join(OUT_DIR, "states");

interface ClaudeClassification {
  category: LegislationCategory;
  impactTags: ImpactTag[];
  stance: StanceType;
  summary: string;
  classifiedAt: string;
}

const claudeCache: Record<string, ClaudeClassification> = existsSync(
  CLAUDE_CACHE_PATH,
)
  ? JSON.parse(readFileSync(CLAUDE_CACHE_PATH, "utf8"))
  : {};

interface RawBill {
  bill_id: number;
  bill_number: string;
  title: string;
  description?: string;
  state?: string;
  url?: string;
  state_link?: string;
  session?: { session_name?: string; year_start?: number };
  status?: number;
  status_date?: string;
  progress?: Array<{ date: string; event: number }>;
  history?: Array<{ date: string; action: string }>;
  sponsors?: Array<{
    name: string;
    party?: string;
    role?: string;
  }>;
  subjects?: Array<{ subject_name: string }>;
}

interface OutFile {
  state: string;
  stateCode: string;
  region: "na";
  stance: StanceType;
  lastUpdated: string;
  contextBlurb: string;
  legislation: Legislation[];
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};

function mapStage(bill: RawBill): Stage {
  // Walk progress events backward to find the latest meaningful one
  const events = bill.progress ?? [];
  if (!events.length) return "Filed";
  const latest = events[events.length - 1];
  switch (latest.event) {
    case 4:
    case 7:
    case 8:
      return "Enacted";
    case 2:
    case 3:
      return "Floor";
    case 9:
    case 10:
      return "Committee";
    case 5:
    case 6:
    case 11:
      return "Dead";
    case 1:
    case 12:
    default:
      return "Filed";
  }
}

// Keyword rules → impact tags. A bill gets every tag whose keywords
// appear in its title or description. Tags are lowercase-matched.
const TAG_RULES: Array<{ tag: ImpactTag; kw: RegExp }> = [
  { tag: "water-consumption", kw: /\b(water consumption|water use|cooling|chiller)\b/i },
  { tag: "water-infrastructure", kw: /\b(water supply|water infrastructure|aquifer|municipal water)\b/i },
  { tag: "carbon-emissions", kw: /\b(emissions|greenhouse gas|carbon|ghg)\b/i },
  { tag: "protected-land", kw: /\b(national park|state park|wildlife|protected land|forest)\b/i },
  { tag: "environmental-review", kw: /\b(environmental (impact|review|study)|EIS|eis|NEPA|nepa)\b/i },
  { tag: "renewable-energy", kw: /\b(renewable|solar|wind|clean energy|green energy)\b/i },
  { tag: "grid-capacity", kw: /\b(grid|load|capacity|transmission|peaker)\b/i },
  { tag: "energy-rates", kw: /\b(rate|ratepayer|utility cost|cost shift|tariff)\b/i },
  { tag: "noise-vibration", kw: /\b(noise|vibration|decibel)\b/i },
  { tag: "local-zoning", kw: /\bzoning|setback|siting\b/i },
  { tag: "local-control", kw: /\b(local control|municipal (authority|control)|county authority)\b/i },
  { tag: "residential-proximity", kw: /\b(proximity|distance|residential|near schools|near homes)\b/i },
  { tag: "property-values", kw: /\bproperty (value|tax)|assessment\b/i },
  { tag: "tax-incentives", kw: /\b(tax (credit|incentive|exemption|abate)|sales tax)\b/i },
  { tag: "job-creation", kw: /\b(job (creation|training)|workforce|employment requirement)\b/i },
  { tag: "economic-development", kw: /\b(economic development|investment|growth)\b/i },
  { tag: "nda-transparency", kw: /\b(non-?disclosure|NDA|nda|transparency)\b/i },
  { tag: "algorithmic-transparency", kw: /\b(algorithm|automated decision|explainab)/i },
  { tag: "ai-safety", kw: /\b(AI (safety|risk)|artificial intelligence (safety|risk)|red team)\b/i },
  { tag: "deepfake-regulation", kw: /\b(deepfake|synthetic media|digital replica)\b/i },
  { tag: "ai-in-healthcare", kw: /\b(medical AI|AI (in|for) healthcare|health decision|therapy bot|therapeutic chatbot)\b/i },
  { tag: "ai-in-employment", kw: /\b(hiring algorithm|workplace (surveillance|monitoring)|employment (screen|algorithm))\b/i },
  { tag: "ai-in-education", kw: /\b(AI in (school|education)|student (AI|data)|education technology)\b/i },
  { tag: "child-safety", kw: /\b(minor|child|children|student|chatbot safety|age verification)\b/i },
  { tag: "data-privacy", kw: /\b(data privacy|personal data|consumer data|training data|privacy)\b/i },
];

const CATEGORY_RULES: Array<{ cat: LegislationCategory; kw: RegExp }> = [
  { cat: "data-center-siting", kw: /\b(data center (moratorium|siting|ban|construction|prohibit|setback|zoning))\b/i },
  { cat: "data-center-energy", kw: /\b(data center (energy|power|grid|cooling|water use)|data center reporting)\b/i },
  { cat: "synthetic-media", kw: /\b(deepfake|synthetic media|digital replica|political advert)\b/i },
  { cat: "ai-healthcare", kw: /\b(AI (in|for) health|medical AI|therapy bot|healthcare artificial intelligence)\b/i },
  { cat: "ai-workforce", kw: /\b(hiring algorithm|workplace monitoring|employment AI|automated employment decision)\b/i },
  { cat: "ai-education", kw: /\b(AI in (school|education|classroom)|student data|education AI)\b/i },
  { cat: "ai-government", kw: /\b(government AI|agency AI|procurement|public sector AI)\b/i },
  { cat: "ai-criminal-justice", kw: /\b(facial recognition|predictive policing|law enforcement AI|biometric surveillance)\b/i },
  { cat: "data-privacy", kw: /\b(consumer data protection|data privacy|personal data|consumer privacy)\b/i },
  { cat: "ai-governance", kw: /\b(artificial intelligence|AI (framework|governance|oversight|regulation))\b/i },
];

function classifyCategory(text: string): LegislationCategory {
  for (const { cat, kw } of CATEGORY_RULES) {
    if (kw.test(text)) return cat;
  }
  return "ai-governance";
}

function classifyTags(text: string): ImpactTag[] {
  const tags: ImpactTag[] = [];
  for (const { tag, kw } of TAG_RULES) {
    if (kw.test(text)) tags.push(tag);
  }
  return tags.slice(0, 5); // keep display manageable
}

function deriveStance(bill: RawBill, stage: Stage, category: LegislationCategory, tags: ImpactTag[]): StanceType {
  const text = `${bill.title} ${bill.description ?? ""}`.toLowerCase();
  const isMoratorium = /moratorium|prohibit|ban\b/.test(text);
  const isIncentive = /incentive|exempt|credit|fast.?track/.test(text);
  const isStudy = /study|commission|task force|working group|review/.test(text);

  if (isMoratorium && stage === "Enacted") return "restrictive";
  if (isMoratorium && (stage === "Floor" || stage === "Committee")) return "concerning";
  if (isIncentive) return "favorable";
  if (isStudy) return "review";

  // Category-driven defaults
  if (category === "ai-governance" || category === "ai-criminal-justice") {
    if (stage === "Enacted" || stage === "Floor") return "concerning";
    return "review";
  }
  if (category === "data-center-siting" || category === "data-center-energy") {
    if (stage === "Enacted") return "concerning";
    return "review";
  }
  return "review";
}

function stateStance(bills: Legislation[]): StanceType {
  const tally: Record<StanceType, number> = {
    restrictive: 0,
    concerning: 0,
    review: 0,
    favorable: 0,
    none: 0,
  };
  // Track ENACTED restrictive bills separately. A single filed moratorium
  // bill (e.g. Sanders/AOC at the federal level, or a long-shot state
  // proposal) shouldn't be enough to flip the whole jurisdiction to
  // "restrictive" — only bills that actually became law should lock
  // that bucket. This was the federal-level bug: one filed moratorium
  // overrode the prevailing innovation-friendly federal posture.
  let enactedRestrictive = 0;

  for (const b of bills) {
    const s: StanceType =
      b.stance ??
      (/\bmoratorium|prohibit|ban\b/i.test(b.title) && b.stage === "Enacted"
        ? "restrictive"
        : /\bmoratorium|prohibit|ban\b/i.test(b.title)
          ? "concerning"
          : /\bincentive|exempt|credit\b/i.test(b.title)
            ? "favorable"
            : "review");
    tally[s] += 1;
    if (s === "restrictive" && b.stage === "Enacted") enactedRestrictive++;
  }

  // Only an enacted restrictive bill (real moratorium that became law)
  // can lock the jurisdiction as restrictive.
  if (enactedRestrictive >= 1) return "restrictive";

  // Filed/committee restrictive bills count toward the concerning bucket
  // for tally purposes, since they signal regulatory pressure without
  // having become law yet.
  const opposition = tally.concerning + tally.restrictive;

  // Multiple opposition bills (concerning + filed restrictions) → concerning
  if (opposition >= 3) return "concerning";

  // More incentive bills than opposition AND at least 2 → favorable
  if (tally.favorable >= 2 && tally.favorable >= opposition) return "favorable";

  // Single incentive vs no opposition → still favorable
  if (tally.favorable >= 1 && opposition === 0) return "favorable";

  // Some opposition but not enough to dominate, plus discussion → review
  if (opposition >= 1 || tally.review >= 1) return "review";

  return "none";
}

function derivePartyOrigin(bill: RawBill): "R" | "D" | "B" | undefined {
  const parties = new Set<string>();
  for (const s of bill.sponsors ?? []) {
    if (s.party) parties.add(s.party);
  }
  if (parties.size > 1) return "B";
  if (parties.has("R")) return "R";
  if (parties.has("D")) return "D";
  return undefined;
}

function lastActionDate(bill: RawBill): string {
  if (bill.status_date) return bill.status_date;
  if (bill.progress?.length) return bill.progress[bill.progress.length - 1].date;
  if (bill.history?.length) return bill.history[bill.history.length - 1].date;
  return new Date().toISOString().slice(0, 10);
}

function officialSourceUrl(bill: RawBill): string | undefined {
  return bill.state_link ?? undefined;
}

function toLegislation(bill: RawBill): Legislation {
  const text = `${bill.title} ${bill.description ?? ""}`;
  const stage = mapStage(bill);

  // Prefer Claude's semantic classification if we have it; fall back to
  // the keyword heuristics for bills that Claude hasn't been run on
  // (or that failed JSON parsing).
  const claude = claudeCache[String(bill.bill_id)];
  const category = claude?.category ?? classifyCategory(text);
  const tags = claude?.impactTags ?? classifyTags(text);
  const summary =
    claude?.summary ??
    (bill.description
      ? bill.description.length > 280
        ? bill.description.slice(0, 277) + "..."
        : bill.description
      : bill.title);

  // Claude returns its own stance. Trust it when present; otherwise use
  // the heuristic `deriveStance` which considers stage, category, and
  // moratorium/incentive cues.
  const stance: StanceType =
    claude?.stance ?? deriveStance(bill, stage, category, tags);

  return {
    id: `${bill.state}-${bill.bill_number}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"),
    billCode: bill.bill_number,
    title: bill.title,
    summary,
    stage,
    stance,
    impactTags: tags,
    category,
    updatedDate: lastActionDate(bill),
    partyOrigin: derivePartyOrigin(bill),
    sourceUrl: officialSourceUrl(bill),
    legiscanUrl: bill.url,
    legiscanId: bill.bill_id,
    sponsors: (bill.sponsors ?? []).map((s) => s.name).slice(0, 4),
  };
}

function writeContextBlurb(
  state: string,
  stateFull: string,
  bills: Legislation[],
): string {
  const name = state === "US" ? "The US federal government" : stateFull;
  // Exclude bills Claude flagged as unrelated (stance === "none")
  const relevant = bills.filter((b) => b.stance !== "none");
  const count = relevant.length;
  if (count === 0) {
    return `${name} has no AI or data-center legislation currently tracked in 2025–2026.`;
  }
  const enacted = relevant.filter((b) => b.stage === "Enacted").length;
  const restrictive = relevant.filter((b) => b.stance === "restrictive").length;
  const concerning = relevant.filter((b) => b.stance === "concerning").length;
  const favorable = relevant.filter((b) => b.stance === "favorable").length;
  const dataCenter = relevant.filter(
    (b) => b.category === "data-center-siting" || b.category === "data-center-energy",
  ).length;
  const ai = relevant.length - dataCenter;

  const parts: string[] = [];
  parts.push(
    `${name} has ${count} relevant bill${count === 1 ? "" : "s"} tracked in 2025–2026` +
      (dataCenter > 0 && ai > 0
        ? ` — ${dataCenter} on data-center policy and ${ai} on AI regulation.`
        : dataCenter > 0
          ? ` on data-center policy.`
          : ai > 0
            ? ` on AI regulation.`
            : `.`),
  );
  if (enacted)
    parts.push(
      `${enacted} ${enacted === 1 ? "has" : "have"} been enacted into law.`,
    );
  if (restrictive)
    parts.push(
      `${restrictive} ${restrictive === 1 ? "imposes" : "impose"} active bans or moratoriums.`,
    );
  if (concerning && !restrictive)
    parts.push(
      `${concerning} ${concerning === 1 ? "advances" : "advance"} stricter regulation.`,
    );
  if (favorable)
    parts.push(
      `${favorable} ${favorable === 1 ? "offers" : "offer"} incentives or deregulation.`,
    );
  return parts.join(" ");
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(OUT_STATES_DIR, { recursive: true });

  const files = readdirSync(RAW_BILLS_DIR).filter((f) => f.endsWith(".json"));
  let totalBills = 0;
  let totalJurisdictions = 0;

  for (const file of files) {
    const state = file.replace(".json", "");
    const raw = JSON.parse(readFileSync(join(RAW_BILLS_DIR, file), "utf8")) as RawBill[];
    const legislation = raw.map(toLegislation);
    const stateFull = state === "US" ? "United States" : STATE_NAMES[state] ?? state;
    const out: OutFile = {
      state: stateFull,
      stateCode: state,
      region: "na",
      stance: stateStance(legislation),
      lastUpdated: new Date().toISOString().slice(0, 10),
      contextBlurb: writeContextBlurb(state, stateFull, legislation),
      legislation,
    };

    const target =
      state === "US"
        ? join(OUT_DIR, "federal.json")
        : join(OUT_STATES_DIR, `${stateFull.toLowerCase().replace(/\s+/g, "-")}.json`);
    writeFileSync(target, JSON.stringify(out, null, 2));
    totalBills += legislation.length;
    totalJurisdictions += 1;
  }

  console.log(
    `[classify] wrote ${totalJurisdictions} jurisdictions, ${totalBills} bills total`,
  );
}

main();
