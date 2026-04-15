import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * Realtime visitor count backed by Vercel KV.
 *
 * Protocol:
 *   POST { sessionId }   → record heartbeat for that session
 *   GET                  → { count } of sessions seen within the window
 *
 * Sessions expire after WINDOW_MS of silence. Expired entries are garbage-
 * collected opportunistically inside POST (amortized), so GET stays cheap.
 *
 * If KV isn't provisioned (no env vars), both routes return 503 and the
 * client falls back to its cosmetic drift. No build-time dependency.
 */

// 5 minutes. Matches the "active now" window used by Vercel Analytics,
// GA realtime, and Plausible. A tighter window (e.g. 90s) under-counts
// anyone who alt-tabs, switches tabs, or briefly pauses between
// heartbeats, which is why our number was reading ~20% of Vercel's.
const WINDOW_MS = 5 * 60 * 1000;
const KEY = "visitors:sessions";

// Edge runtime: faster cold-start than node, and KV works natively.
export const runtime = "edge";
// Never cache the response — live count is the whole point.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function kvConfigured(): boolean {
  return (
    !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
  );
}

export async function POST(req: Request) {
  if (!kvConfigured()) {
    return NextResponse.json(
      { error: "kv-not-configured" },
      { status: 503 },
    );
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
    return NextResponse.json({ error: "invalid-session" }, { status: 400 });
  }

  const now = Date.now();
  try {
    await kv.hset(KEY, { [sessionId]: now });

    // Opportunistic GC — trim stale entries on ~1 in 10 POSTs. Keeps the
    // hash from growing unboundedly without paying a scan on every ping.
    if (Math.random() < 0.1) {
      const all = (await kv.hgetall<Record<string, number>>(KEY)) ?? {};
      const expired: string[] = [];
      for (const [id, t] of Object.entries(all)) {
        if (now - Number(t) > WINDOW_MS) expired.push(id);
      }
      if (expired.length > 0) {
        await kv.hdel(KEY, ...expired);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "kv-error" }, { status: 503 });
  }
}

export async function GET() {
  if (!kvConfigured()) {
    return NextResponse.json(
      { error: "kv-not-configured" },
      { status: 503 },
    );
  }
  try {
    const all = (await kv.hgetall<Record<string, number>>(KEY)) ?? {};
    const now = Date.now();
    let active = 0;
    for (const t of Object.values(all)) {
      if (now - Number(t) <= WINDOW_MS) active += 1;
    }
    return NextResponse.json(
      { count: active },
      {
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "kv-error" }, { status: 503 });
  }
}
