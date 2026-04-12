/**
 * Research EU / Asia / Canada-province entities via Claude with web_search.
 * Writes one JSON file per entity under data/international/{slug}.json.
 *
 * Resumes by default (skips non-empty files). Force with
 * INTL_FORCE_REFRESH=1. Cap per run with INTL_MAX.
 *
 * Budget estimate: ~$0.15 per entity × 15 entities ≈ $2.25.
 */

import "../env.js";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT_DIR = join(ROOT, "data/international");

const MODEL = "claude-sonnet-4-6";
const MAX = process.env.INTL_MAX ? Number(process.env.INTL_MAX) : Infinity;

interface EntitySpec {
  slug: string;
  id: string;
  geoId: string;
  name: string;
  region: "eu" | "asia" | "na";
  level: "federal" | "state" | "bloc";
  focus: string;
}

const TARGETS: EntitySpec[] = [
  // ─── EU ───
  {
    slug: "netherlands",
    id: "netherlands",
    geoId: "528",
    name: "Netherlands",
    region: "eu",
    level: "federal",
    focus:
      "major Amsterdam data center hub, energy permit debates, Holland Rijnland moratorium history, nitrogen crisis implications, AI Act national implementation",
  },
  {
    slug: "ireland",
    id: "ireland",
    geoId: "372",
    name: "Ireland",
    region: "eu",
    level: "federal",
    focus:
      "Dublin hyperscale concentration, EirGrid grid capacity constraints, CRU data center connection policy, AI Act implementation, national AI strategy",
  },
  {
    slug: "sweden",
    id: "sweden",
    geoId: "752",
    name: "Sweden",
    region: "eu",
    level: "federal",
    focus:
      "Luleå Meta/Facebook hyperscale, cold-climate advantage, green electricity policy, Norrbotten county expansion, AI governance stance",
  },
  {
    slug: "finland",
    id: "finland",
    geoId: "246",
    name: "Finland",
    region: "eu",
    level: "federal",
    focus:
      "Google Hamina, Microsoft Helsinki/Espoo regions, district heat recovery from data centers, national AI program, EU AI Act implementation",
  },
  {
    slug: "spain",
    id: "spain",
    geoId: "724",
    name: "Spain",
    region: "eu",
    level: "federal",
    focus:
      "Barcelona Supercomputing Center, emerging AI regulator AESIA, Madrid data center boom, Aragon water concerns, AI Act national enforcement",
  },
  {
    slug: "italy",
    id: "italy",
    geoId: "380",
    name: "Italy",
    region: "eu",
    level: "federal",
    focus:
      "AI Act implementation, AgID governance, Rome/Milan data center buildout, G7 AI code of conduct leadership, Garante privacy enforcement",
  },
  {
    slug: "poland",
    id: "poland",
    geoId: "616",
    name: "Poland",
    region: "eu",
    level: "federal",
    focus:
      "Warsaw data center hub growth, Microsoft Polish Digital Valley, coal-grid transition concerns, AI Act national implementation",
  },
  // ─── Asia ───
  {
    slug: "singapore",
    id: "singapore",
    geoId: "702",
    name: "Singapore",
    region: "asia",
    level: "federal",
    focus:
      "2019 moratorium lifted in 2022, Green Data Centre Roadmap, PUE 1.3 mandate, Model AI Governance Framework, IMDA's AI Verify",
  },
  {
    slug: "india",
    id: "india",
    geoId: "356",
    name: "India",
    region: "asia",
    level: "federal",
    focus:
      "Digital India Act drafts, IndiaAI mission, hyperscale buildout in Mumbai/Hyderabad/Chennai, data center parity rules, MeitY AI advisory",
  },
  {
    slug: "taiwan",
    id: "taiwan",
    geoId: "158",
    name: "Taiwan",
    region: "asia",
    level: "federal",
    focus:
      "TSMC semiconductor policy, data sovereignty laws, AI basic act, Taipei AI governance debate, energy grid constraints",
  },
  {
    slug: "indonesia",
    id: "indonesia",
    geoId: "360",
    name: "Indonesia",
    region: "asia",
    level: "federal",
    focus:
      "Batam and Jakarta data center hubs, Nusantara capital project, PDP Law (data protection), MCI AI ethics circular, sovereign AI push",
  },
  {
    slug: "australia",
    id: "australia",
    geoId: "36",
    name: "Australia",
    region: "asia",
    level: "federal",
    focus:
      "AI Ethics Framework, voluntary AI guardrails, Sydney data center corridor, Privacy Act reform, eSafety Commissioner's online content rules",
  },
  // ─── Canadian provinces ───
  {
    slug: "ontario",
    id: "ontario",
    geoId: "ontario",
    name: "Ontario",
    region: "na",
    level: "state",
    focus:
      "Toronto data center corridor, IESO grid capacity, Ontario AI Strategy, Trustworthy AI Framework, energy policy for hyperscale",
  },
  {
    slug: "quebec",
    id: "quebec",
    geoId: "quebec",
    name: "Québec",
    region: "na",
    level: "state",
    focus:
      "Hydro-Québec data center attraction, Mila AI research hub, Law 25 privacy, Beauharnois data center complex, green hydro branding",
  },
  {
    slug: "british-columbia",
    id: "british-columbia",
    geoId: "british-columbia",
    name: "British Columbia",
    region: "na",
    level: "state",
    focus:
      "Vancouver tech hub, BC Hydro data center connection policy, environmental assessment processes, municipal data center zoning debates",
  },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseJsonBlock(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const firstObj = candidate.indexOf("{");
  const lastObj = candidate.lastIndexOf("}");
  if (firstObj >= 0 && lastObj > firstObj) {
    return JSON.parse(candidate.slice(firstObj, lastObj + 1));
  }
  throw new Error("no JSON object found");
}

function extractText(msg: Anthropic.Messages.Message): string {
  const parts: string[] = [];
  for (const block of msg.content) {
    if (block.type === "text") parts.push(block.text);
  }
  return parts.join("\n");
}

async function researchEntity(
  anthropic: Anthropic,
  spec: EntitySpec,
): Promise<unknown> {
  const prompt = `Research ${spec.name}'s stance on AI regulation and data center policy as of April 2026.

Context focus: ${spec.focus}

Return a SINGLE JSON object (no prose, no markdown fences) with this exact shape:

{
  "id": "${spec.id}",
  "geoId": "${spec.geoId}",
  "name": "${spec.name}",
  "region": "${spec.region}",
  "level": "${spec.level}",
  "stance": "restrictive" | "concerning" | "review" | "favorable" | "none",
  "contextBlurb": "3-4 sentence plain-language summary",
  "legislation": [
    {
      "id": "${spec.id}-<slug>",
      "billCode": "<official number or abbreviation>",
      "title": "<official title>",
      "summary": "2-sentence plain-language description",
      "stage": "Filed" | "Committee" | "Floor" | "Enacted" | "Carried Over" | "Dead",
      "stance": "restrictive" | "concerning" | "review" | "favorable" | "none",
      "impactTags": [],
      "category": "data-center-siting" | "data-center-energy" | "ai-governance" | "synthetic-media" | "ai-healthcare" | "ai-workforce" | "ai-education" | "ai-government" | "data-privacy" | "ai-criminal-justice",
      "updatedDate": "YYYY-MM-DD",
      "partyOrigin": "B",
      "sourceUrl": "https://..."
    }
  ],
  "keyFigures": [
    {
      "id": "${spec.id}-<lastname>",
      "name": "<real full name>",
      "role": "<official title>",
      "party": "<party abbreviation>",
      "stance": "restrictive" | "concerning" | "review" | "favorable" | "none",
      "quote": "<real public quote if you can verify it, else omit>"
    }
  ],
  "news": [
    {
      "id": "${spec.id}-news-1",
      "headline": "<exact article headline>",
      "source": "<publication name>",
      "date": "YYYY-MM-DD",
      "url": "https://..."
    }
  ]
}

CRITICAL RULES:
- 2-3 legislation entries, covering BOTH AI and data center topics where relevant
- 2-3 key figures (politicians, regulators, or ministers)
- 3-4 news items from real sources (≤12 months old)
- All URLs must resolve — use web_search to verify
- Never fabricate bill numbers; omit the billCode if you can't find one
- For quotes, use ONLY verifiable published statements; omit otherwise
- Use the "stance" field consistently: "restrictive" = active bans/moratoriums, "concerning" = strict regulations with broad impact, "review" = under discussion, "favorable" = innovation-friendly/incentives, "none" = no meaningful activity`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });
  const text = extractText(msg);
  return parseJsonBlock(text);
}

function regenerateIndex() {
  // After writing JSON files, rewrite lib/international-researched.ts so
  // Next.js picks up the new entities on next build. Only includes files
  // that actually exist + parse.
  const imports: string[] = [];
  const registers: string[] = [];
  let counter = 0;
  for (const spec of TARGETS) {
    const path = join(OUT_DIR, `${spec.slug}.json`);
    if (!existsSync(path)) continue;
    try {
      const content = JSON.parse(readFileSync(path, "utf8"));
      if (!content?.id || !Array.isArray(content?.legislation)) continue;
      const varName = `e${counter++}`;
      imports.push(`import ${varName} from "@/data/international/${spec.slug}.json";`);
      registers.push(`register(${varName});`);
    } catch {
      // skip invalid files
    }
  }

  const src = `import type { Entity, ImpactTag, Legislation } from "@/types";

/**
 * Auto-generated by scripts/sync/international.ts. Do not edit by hand.
 * Entries come from data/international/*.json. Regenerated after every
 * successful sync run.
 *
 * Claude-researched payloads are sanitized because the model sometimes
 * invents impactTags outside our enum — we filter those out rather than
 * let the UI crash on unknown keys.
 */

${imports.join("\n")}

const VALID_IMPACT_TAGS = new Set<ImpactTag>([
  "water-consumption",
  "carbon-emissions",
  "protected-land",
  "environmental-review",
  "renewable-energy",
  "grid-capacity",
  "energy-rates",
  "water-infrastructure",
  "noise-vibration",
  "local-zoning",
  "local-control",
  "residential-proximity",
  "property-values",
  "tax-incentives",
  "job-creation",
  "economic-development",
  "nda-transparency",
  "algorithmic-transparency",
  "ai-safety",
  "deepfake-regulation",
  "ai-in-healthcare",
  "ai-in-employment",
  "ai-in-education",
  "child-safety",
  "data-privacy",
]);

function sanitizeLegislation(l: Legislation): Legislation {
  return {
    ...l,
    impactTags: (l.impactTags ?? []).filter((t): t is ImpactTag =>
      VALID_IMPACT_TAGS.has(t as ImpactTag),
    ),
  };
}

function sanitizeEntity(e: Entity): Entity {
  return {
    ...e,
    legislation: (e.legislation ?? []).map(sanitizeLegislation),
    keyFigures: e.keyFigures ?? [],
    news: e.news ?? [],
  };
}

const modules: Entity[] = [];
function register(mod: unknown) {
  if (mod && typeof mod === "object" && "id" in (mod as Record<string, unknown>)) {
    modules.push(sanitizeEntity(mod as Entity));
  }
}
${registers.join("\n")}

export const RESEARCHED_INTERNATIONAL: Entity[] = modules;
`;
  const target = join(ROOT, "lib/international-researched.ts");
  writeFileSync(target, src);
  console.log(`[intl] regenerated lib/international-researched.ts (${imports.length} entities)`);
}

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("[intl] ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const anthropic = new Anthropic({ apiKey: key });
  mkdirSync(OUT_DIR, { recursive: true });

  const force = process.env.INTL_FORCE_REFRESH === "1";
  const todo = TARGETS.filter((spec) => {
    const path = join(OUT_DIR, `${spec.slug}.json`);
    if (force) return true;
    if (!existsSync(path)) return true;
    try {
      const existing = JSON.parse(readFileSync(path, "utf8")) as {
        legislation?: unknown[];
      };
      return !existing?.legislation || (existing.legislation as unknown[]).length === 0;
    } catch {
      return true;
    }
  }).slice(0, MAX === Infinity ? undefined : MAX);

  console.log(
    `[intl] ${todo.length} entities to research (of ${TARGETS.length} total)`,
  );
  for (const spec of todo) {
    console.log(`[intl]   ${spec.name} (${spec.region})`);
    try {
      const entity = await researchEntity(anthropic, spec);
      const path = join(OUT_DIR, `${spec.slug}.json`);
      writeFileSync(path, JSON.stringify(entity, null, 2));
      const legCount =
        ((entity as { legislation?: unknown[] }).legislation ?? []).length;
      const newsCount = ((entity as { news?: unknown[] }).news ?? []).length;
      console.log(`[intl]     → ${legCount} bills · ${newsCount} news`);
    } catch (e) {
      console.warn(`[intl]   ${spec.name} failed:`, (e as Error).message);
    }
  }
  regenerateIndex();
  console.log(`[intl] done`);
}

// Keep slugify referenced so tsc is happy in case we stop using it.
void slugify;

main().catch((e) => {
  console.error("[intl] fatal:", e.message);
  process.exit(1);
});
