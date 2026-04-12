/**
 * Non-destructive headline rewriter for data/news/summaries.json.
 *
 * Walks every headline (regional keyDevelopments + per-entity news), batches
 * the long ones through Claude with a strict "5-10 words" rule, and writes
 * back ONLY the `headline` field. Every id/source/date/url/relatedEntity is
 * preserved exactly. Items that already pass the length cutoff are skipped.
 *
 * Run: npx tsx scripts/sync/shorten-headlines.ts
 * Env: HEADLINE_MAX_CHARS (default 80) — only headlines longer than this are
 *      sent to Claude. Pass `HEADLINE_MAX_CHARS=0` to rewrite everything.
 */

import "../env.js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const NEWS_PATH = join(ROOT, "data/news/summaries.json");

const MODEL = "claude-sonnet-4-6";
const MAX_CHARS = Number(process.env.HEADLINE_MAX_CHARS ?? 80);
const BATCH_SIZE = 15;

interface NewsItem {
  id?: string;
  headline: string;
  source: string;
  date: string;
  url: string;
  relatedEntity?: string;
}

interface NewsFile {
  generatedAt: string;
  regional: Record<string, { summary: string; keyDevelopments: NewsItem[] }>;
  entities: Record<string, { news: NewsItem[] }>;
}

interface PendingRef {
  original: string;
  apply: (shortened: string) => void;
}

function collectPending(data: NewsFile): PendingRef[] {
  const pending: PendingRef[] = [];

  for (const region of Object.values(data.regional)) {
    for (const item of region.keyDevelopments) {
      if (item.headline.length > MAX_CHARS) {
        pending.push({
          original: item.headline,
          apply: (s) => {
            item.headline = s;
          },
        });
      }
    }
  }

  for (const entity of Object.values(data.entities)) {
    for (const item of entity.news) {
      if (item.headline.length > MAX_CHARS) {
        pending.push({
          original: item.headline,
          apply: (s) => {
            item.headline = s;
          },
        });
      }
    }
  }

  return pending;
}

function extractText(msg: Anthropic.Messages.Message): string {
  return msg.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parseJsonArray(text: string): string[] {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const first = candidate.indexOf("[");
  const last = candidate.lastIndexOf("]");
  if (first < 0 || last < 0) throw new Error("no JSON array in response");
  return JSON.parse(candidate.slice(first, last + 1));
}

async function shortenBatch(
  anthropic: Anthropic,
  originals: string[],
): Promise<string[]> {
  const numbered = originals.map((h, i) => `${i + 1}. ${h}`).join("\n");
  const prompt = `Rewrite each of the following news headlines to be SHORT and SIMPLE.

Rules (strict):
- 5-10 words ideal, 12 words MAX
- Subject + verb + object only
- No subordinate clauses, no dates, no dollar amounts
- Keep proper names, state names, and bill codes when essential
- No "Source: Title" colon prefixes
- Plain Title Case, no quotes around the headline
- Preserve the underlying fact — don't editorialize or change meaning

Examples of good shortened headlines:
- "Sanders, AOC Introduce AI Data Center Moratorium"
- "Trump WH Releases National AI Framework"
- "Maine Passes First Statewide DC Moratorium"
- "Texas SB 1308 Extends Data Center Tax Exemption"
- "Virginia HB 1515 Moratorium Killed in Committee"

Return ONLY a JSON array of ${originals.length} shortened headlines, in the same order, no prose, no markdown:

["headline 1", "headline 2", ...]

Headlines to shorten:
${numbered}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = extractText(msg);
  const arr = parseJsonArray(text);
  if (!Array.isArray(arr) || arr.length !== originals.length) {
    throw new Error(
      `expected ${originals.length} items, got ${Array.isArray(arr) ? arr.length : "non-array"}`,
    );
  }
  return arr.map((s) => String(s).trim());
}

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("[shorten] ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const anthropic = new Anthropic({ apiKey: key });

  const data = JSON.parse(readFileSync(NEWS_PATH, "utf8")) as NewsFile;
  const pending = collectPending(data);
  console.log(
    `[shorten] ${pending.length} headlines > ${MAX_CHARS} chars to rewrite (batch size ${BATCH_SIZE})`,
  );

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
    console.log(
      `[shorten] batch ${batchNum}/${totalBatches} · ${batch.length} headlines`,
    );

    try {
      const shortened = await shortenBatch(
        anthropic,
        batch.map((p) => p.original),
      );
      batch.forEach((p, idx) => {
        const s = shortened[idx];
        if (s && s.length > 0 && s.length < p.original.length) {
          p.apply(s);
        } else {
          console.warn(
            `[shorten]   skipped (no improvement): ${p.original.slice(0, 60)}…`,
          );
        }
      });
      // Persist after every batch so a mid-run crash doesn't lose progress.
      writeFileSync(NEWS_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn(`[shorten] batch ${batchNum} failed:`, (e as Error).message);
    }
  }

  console.log(`[shorten] done → data/news/summaries.json`);
}

main().catch((e) => {
  console.error("[shorten] fatal:", e.message);
  process.exit(1);
});
