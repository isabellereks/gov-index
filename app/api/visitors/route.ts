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

// 65 minutes. Wider than a typical "active now" window because we've
// pulled the client heartbeat cadence down to once per hour to stay
// inside Vercel's free-tier edge-request budget. A session that
// heartbeats on the hour needs to survive until its next beat; the
// extra 5 min absorbs jitter + cold-start lag.
//
// Trade-off: "now" effectively means "active in the last hour". Fine
// for a high-level pulse; not suitable if we ever want minute-to-minute
// presence.
const WINDOW_MS = 65 * 60 * 1000;
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

    // Fold the count read into the heartbeat — a single round-trip
    // returns both "you're registered" and the live total. Halves edge
    // requests vs. the old POST-then-GET protocol, and keeps the client
    // polling to a single call per hour.
    //
    // We always scan here (vs the old opportunistic GC) because we're
    // already holding the hash in memory for the count; collecting
    // expired entries on the way through is free.
    const all = (await kv.hgetall<Record<string, number>>(KEY)) ?? {};
    const expired: string[] = [];
    let active = 0;
    for (const [id, t] of Object.entries(all)) {
      if (now - Number(t) > WINDOW_MS) expired.push(id);
      else active += 1;
    }
    if (expired.length > 0) {
      // Fire and forget — don't block the response on GC.
      kv.hdel(KEY, ...expired).catch(() => {});
    }
    return NextResponse.json({ ok: true, count: active });
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
