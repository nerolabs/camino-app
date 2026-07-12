/**
 * Shared abuse guards for the API routes that cost money or reach a human inbox
 * (/api/lola — LLM spend; /api/feedback — team-inbox flooding + Resend quota).
 * /api/tts retired with Lola's spoken voice, 2026-07-11. Server-only.
 *
 * Layers (each independent, each fail-open so legitimate users are never locked out):
 *
 *  1. Strict CORS — exporting an OPTIONS handler opts us out of EAS Hosting's default
 *     permissive CORS (`Allow-Origin: *` + credentials). Note the platform REWRITES the
 *     Origin header to whichever of OUR hostnames the request hit (verified live
 *     2026-07-04), so the echo below is always one of our own origins — a foreign page's
 *     preflight therefore never matches its own origin and the browser blocks it. On
 *     runtimes that forward the real Origin (local dev), this is a genuine allowlist.
 *     CORS cannot stop non-preflighted requests (curl, native, media tags) — that's what
 *     the volume guard is for.
 *
 *  2. Durable volume counters (Supabase `bump_counter` RPC, scripts/sql/api-counters.sql):
 *     a global per-route daily budget that survives isolate churn and redeploys — the
 *     in-memory counters demonstrably don't (70-request burst, zero 429s, 2026-07-04) —
 *     plus a per-IP per-minute limit whenever the runtime exposes a client IP. One
 *     roundtrip per request (both bumps run in parallel), ~50–100ms against LLM/TTS calls
 *     that take seconds. Supabase down/slow (>1.5s) → fail open and log; availability
 *     beats protection at this scale. The blast radius stays bounded by provider spend
 *     caps (Anthropic Console limit, ElevenLabs plan quota).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Origins allowed to call the paid routes. Extra origins via ALLOWED_ORIGINS (comma-separated).
const DEFAULT_ORIGINS = [
  'https://getcamino.app',
  'https://www.getcamino.app',
  'https://camino.expo.app',
  'https://camino--staging.expo.app',
];
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean),
]);

// Accepts an Origin (https://host) or Referer (https://host/path); checks the normalized origin.
export function isAllowedOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    if (ALLOWED_ORIGINS.has(url.origin)) return true;
    // Per-deploy EAS Hosting origins (camino--<id>.expo.app) are all OUR deployments —
    // they keep pre-production verification on unique deployment URLs working.
    if (/^camino--[a-z0-9]+\.expo\.app$/.test(url.hostname) && url.protocol === 'https:') return true;
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'; // any localhost port for dev
  } catch {
    return false;
  }
}

// Strict preflight: allowed origins get a normal CORS grant; anything else gets 204 with
// NO Allow-Origin header, which browsers treat as a denial. Never blocks same-origin web
// (browsers don't preflight same-origin) or native (no preflight at all).
export function corsPreflight(request: Request): Response {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = { Vary: 'Origin', 'Access-Control-Max-Age': '3600' };
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'content-type';
  }
  return new Response(null, { status: 204, headers });
}

// Client IP, if the runtime exposes one. Logged once per isolate so production traffic
// settles what EAS actually forwards (docs say X-Real-IP/X-Forwarded-For; verify in logs).
let loggedIpHeaders = false;
export function clientIp(request: Request): string | null {
  const real = request.headers.get('x-real-ip');
  const cf = request.headers.get('cf-connecting-ip');
  const xff = request.headers.get('x-forwarded-for');
  if (!loggedIpHeaders) {
    loggedIpHeaders = true;
    console.log(`[apiGuard] ip-header presence: x-real-ip=${!!real} cf-connecting-ip=${!!cf} x-forwarded-for=${!!xff}`);
  }
  return real ?? cf ?? xff?.split(',')[0].trim() ?? null;
}

// Atomically bump a counter bucket in Supabase; returns the new count, or null on ANY
// failure (missing config, timeout, non-200) — callers treat null as "no signal", fail open.
async function bumpCounter(bucket: string, windowSeconds: number): Promise<number | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bump_counter`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        apikey: SERVICE_KEY,
        authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ p_bucket: bucket, p_window_seconds: windowSeconds }),
    });
    if (!res.ok) { console.error(`[apiGuard] bump_counter ${res.status} for ${bucket}`); return null; }
    const n: unknown = await res.json();
    return typeof n === 'number' ? n : null;
  } catch (e) {
    console.error(`[apiGuard] bump_counter unreachable for ${bucket}:`, e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * The durable volume check. Call AFTER payload validation so malformed junk can't burn the
 * budget — only requests that would actually reach the paid upstream count against it.
 * Returns a 429 Response to send, or null to proceed.
 */
export async function volumeGuard(
  route: 'lola' | 'feedback',
  request: Request,
  limits: { ipPerMinute: number; globalPerDay: number },
): Promise<Response | null> {
  const now = new Date().toISOString();
  const ip = clientIp(request);
  const [global, perIp] = await Promise.all([
    bumpCounter(`${route}:d:${now.slice(0, 10)}`, 26 * 3600),          // calendar day, 26h window
    ip ? bumpCounter(`${route}:ip:${ip}:m:${now.slice(0, 16)}`, 120)   // calendar minute, 2min window
       : Promise.resolve(null),
  ]);
  if (perIp !== null && perIp > limits.ipPerMinute) {
    console.log(`[apiGuard] per-IP limit tripped: ${route} ip=${ip} count=${perIp}`);
    return Response.json({ error: 'rate limit exceeded' }, { status: 429 });
  }
  if (global !== null && global > limits.globalPerDay) {
    console.log(`[apiGuard] GLOBAL daily budget tripped: ${route} count=${global}`);
    return Response.json({ error: 'daily capacity reached' }, { status: 429 });
  }
  return null;
}
