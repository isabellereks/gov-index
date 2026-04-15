/**
 * Targeted blurb refresher: regenerate the contextBlurb for the named
 * state files (slugs matching their JSON filenames), grounded in the
 * current legislation list.
 *
 * Overwrites hand-written prose, so it's --force-only. Run when a
 * blurb has gone clearly stale relative to the bills it's supposed to
 * summarize and you've decided the regenerated version is better.
 *
 * Run:
 *   npx tsx scripts/cleanup/refresh-blurbs.ts --force south-dakota texas
 *
 * Prints a diff per state.
 */

import "../env.js";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const STATES_DIR = join(ROOT, "data/legislation/states");
const FEDERAL_PATH = join(ROOT, "data/legislation/federal.json");

const MODEL = "claude-sonnet-4-6";

interface Bill {
  billCode: string;
  title: string;
  category: string;
  stage: string;
  impactTags: string[];
}

interface StateFile {
  state: string;
  stance?: string;
  contextBlurb: string;
  legislation: Bill[];
}

const client = new Anthropic();

function buildPrompt(data: StateFile): string {
  const lines = data.legislation
    .map(
      (b) =>
        `  ${b.billCode}: ${b.title} [${b.category}, stage=${b.stage}, tags: ${(b.impactTags ?? []).join(", ") || "none"}]`,
    )
    .join("\n");
  return `Write a 2–3 sentence context blurb for ${data.state}'s AI and data center policy landscape. This appears in a side panel when a user clicks the state on a map.

The state's current stance is: ${data.stance ?? "unknown"}
Bills:
${lines}

Hard rules:
- Do NOT contradict the bill list. If any bills are stage=Enacted, the blurb must NOT claim "no enacted law" / "nothing has passed" / similar.
- Do NOT lead with "${data.state} has no enacted X" when there are substantial bills in Filed/Committee/Floor — that buries the actual story. LEAD with what IS happening (what's being debated, who's pushing it, what's distinctive). Lack of enacted laws may be mentioned, but it shouldn't be the opening frame.
- Do NOT start with "${data.state} has X bills" — the user can already see them.
- DO mention specific bill codes when they're significant (moratoriums, landmark legislation, enacted laws).
- DO explain what makes this state DISTINCTIVE.
- 2–3 sentences max. Plain factual prose.

Return ONLY the blurb text, no quotes or formatting.`;
}

async function refresh(slug: string) {
  // "federal" is a special slug — same shape, different file location.
  // Lets you say `refresh-blurbs --force federal` when Congress moves.
  const path =
    slug === "federal" ? FEDERAL_PATH : join(STATES_DIR, `${slug}.json`);
  const data = JSON.parse(readFileSync(path, "utf8")) as StateFile;
  if (!data.state) data.state = slug === "federal" ? "the US federal government" : slug;
  const before = data.contextBlurb;
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 320,
    messages: [{ role: "user", content: buildPrompt(data) }],
  });
  const blurb = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();
  if (!blurb) {
    console.warn(`  ${slug}: empty response, skipping`);
    return;
  }
  data.contextBlurb = blurb;
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`\n=== ${data.state} ===\nBEFORE: ${before}\nAFTER:  ${blurb}`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slugs = args.filter((a) => !a.startsWith("--"));
  if (!force) {
    console.error(
      "refresh-blurbs overwrites hand-written prose. Re-run with --force if you're sure.\n" +
        "  usage: tsx scripts/cleanup/refresh-blurbs.ts --force <slug> [<slug>...]",
    );
    process.exit(1);
  }
  if (slugs.length === 0) {
    console.error("usage: tsx scripts/cleanup/refresh-blurbs.ts --force <slug> [<slug>...]");
    process.exit(1);
  }
  for (const slug of slugs) {
    try {
      await refresh(slug);
    } catch (err) {
      console.error(`  ${slug} failed:`, (err as Error).message);
    }
  }

  // The map's side panel reads from lib/placeholder-data.ts (generated),
  // not from the JSON sources we just wrote. Rebuild it so the refresh
  // actually shows up at runtime — easy to forget otherwise.
  console.log("\nRebuilding placeholder-data.ts…");
  execSync("npx tsx scripts/build-placeholder.ts", { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
