import { ENTITIES } from "./placeholder-data";
import type { NaView, ViewTarget } from "@/types";

export type SearchKind = "country" | "state" | "bloc" | "bill";

export interface SearchItem {
  id: string;
  kind: SearchKind;
  label: string;
  sublabel?: string;
  target: ViewTarget;
  /** Lowercased searchable text — name + content. */
  haystack: string;
}

const KIND_LABEL: Record<SearchKind, string> = {
  country: "Country",
  state: "State",
  bloc: "Region",
  bill: "Legislation",
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const entity of ENTITIES) {
    const naView: NaView = entity.level === "state" ? "states" : "countries";
    const target: ViewTarget = {
      region: entity.region,
      naView,
      // Overview entities navigate to "no selection" so the panel falls back
      // to the regional default.
      selectedGeoId: entity.isOverview ? null : entity.geoId,
    };

    const kind: SearchKind =
      entity.level === "state"
        ? "state"
        : entity.level === "bloc"
          ? "bloc"
          : "country";

    items.push({
      id: `entity-${entity.id}`,
      kind,
      label: entity.name,
      sublabel: KIND_LABEL[kind],
      target,
      haystack: `${entity.name} ${entity.contextBlurb}`.toLowerCase(),
    });

    for (const bill of entity.legislation) {
      items.push({
        id: `bill-${bill.id}`,
        kind: "bill",
        label: bill.title,
        sublabel: `${bill.billCode} · ${entity.name}`,
        target,
        haystack:
          `${bill.billCode} ${bill.title} ${bill.summary} ${bill.tags.join(" ")} ${entity.name}`.toLowerCase(),
      });
    }
  }

  return items;
}

const INDEX = buildIndex();

/**
 * Token-weighted scoring search.
 *
 * Weights: country/state/bloc name match >> bill title match > sublabel >
 * haystack body. Multi-word queries score per token; an item must match at
 * least one token to be returned. Country names get a strong boost so a query
 * like "china policy on deepfakes" surfaces China at the top even if no bill
 * mentions deepfakes — and when a deepfake bill is later added, that bill's
 * "deepfakes" body match will rank it near the top automatically.
 */
export function search(query: string, limit = 8): SearchItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  type Scored = { item: SearchItem; score: number };
  const scored: Scored[] = [];

  for (const item of INDEX) {
    const labelLower = item.label.toLowerCase();
    const sublabelLower = item.sublabel?.toLowerCase() ?? "";
    let score = 0;
    let matched = false;

    for (const t of tokens) {
      if (labelLower.includes(t)) {
        const isEntity =
          item.kind === "country" || item.kind === "state" || item.kind === "bloc";
        score += isEntity ? 100 : 30;
        if (labelLower.startsWith(t)) score += 25;
        if (labelLower === t) score += 50;
        matched = true;
        continue;
      }
      if (sublabelLower.includes(t)) {
        score += 10;
        matched = true;
        continue;
      }
      if (item.haystack.includes(t)) {
        score += 3;
        matched = true;
      }
    }

    if (matched) scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
