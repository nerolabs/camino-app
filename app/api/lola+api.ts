/**
 * Server-side proxy to the Anthropic Messages API.
 *
 * The Anthropic key lives ONLY on the server (process.env.ANTHROPIC_API_KEY) and
 * never reaches the client — this replaces the old client-side SDK call that shipped
 * the key in the browser bundle. Runs on EAS Hosting (Cloudflare Workers), so it uses
 * only Web APIs (fetch), no Node modules.
 *
 * Contract: POST { system?, messages, model?, max_tokens? } -> { text }.
 *
 * Hardening (so this can't be abused as a free Claude endpoint). These are layered and
 * fail-open so they never block legitimate users:
 *  - Payload caps: bounded message count + total input size + max_tokens. Always enforced
 *    (verified live) — this is the real per-request cost limiter.
 *  - Origin/Referer allowlist: rejects browser requests that positively identify as coming
 *    from another site. On the EAS Hosting (Cloudflare Workers) runtime the Origin header is
 *    not forwarded to the handler, so this is a no-op there and a real check elsewhere.
 *  - Per-IP rate limit: best-effort fixed window, and only when the runtime gives us a
 *    client IP (otherwise skipped, so users never share one bucket). Per-isolate on Workers,
 *    so it caps sustained single-source abuse rather than being a global exact counter.
 *    A hard global limit would need Cloudflare KV / a WAF rate-limit rule (future).
 */

import { captureServerError } from '@/lib/sentryServer';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// Payload limits — generous for real use, tight enough to stop abuse.
const MAX_TOKENS_CAP = 1024;
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 24_000; // summed length of all message contents + system

// Rate limit: requests per IP per window. A full interview is ~2 calls per answer
// spaced by typing time, so a real user stays well under this; a hammering script won't.
const RATE_LIMIT = Number(process.env.LOLA_RATE_LIMIT ?? 60);
const RATE_WINDOW_MS = 60_000;

// Origins allowed to call this route. Extra origins can be added via ALLOWED_ORIGINS
// (comma-separated). Requests with NO Origin header (native apps, some same-origin
// cases) are allowed through and rely on the rate limit + payload caps.
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

// Accepts either an Origin (https://host) or a Referer (https://host/path) and checks
// the normalized origin, so both header shapes work.
function isAllowed(value: string): boolean {
  try {
    const url = new URL(value);
    if (ALLOWED_ORIGINS.has(url.origin)) return true;
    // Per-deploy EAS Hosting origins (camino--<id>.expo.app) are all OUR deployments —
    // allowing them keeps pre-production verification on unique deployment URLs working
    // (found 2026-07-04: the interview 403'd when tested on a fresh deploy URL).
    if (/^camino--[a-z0-9]+\.expo\.app$/.test(url.hostname) && url.protocol === 'https:') return true;
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'; // any localhost port for dev
  } catch {
    return false;
  }
}

// Reject only when we have a positive signal (Origin or Referer) that the request came
// from a DIFFERENT site. When neither header is present — which is the case on the EAS
// Hosting / Cloudflare Workers runtime, and for native apps — we allow and rely on the
// payload caps + rate limit. (So this blocks casual cross-origin browser abuse where the
// runtime forwards the header, and is a harmless no-op where it doesn't.)
function requestOriginRejected(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) return !isAllowed(origin);
  const referer = request.headers.get('referer');
  if (referer) return !isAllowed(referer);
  return false;
}

// Best-effort per-IP fixed-window limiter. NOTE: on Cloudflare Workers each isolate has
// its own memory, so this caps sustained abuse from a single source per isolate rather
// than being a globally exact counter — good enough as one layer alongside origin/payload
// checks. A globally exact limit would need Cloudflare KV / a rate-limiting rule.
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  // If the runtime doesn't forward a client IP, DON'T rate-limit — otherwise every
  // request shares one 'unknown' bucket and legit users would throttle each other.
  if (ip === 'unknown') return false;
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now >= rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (hits.size > 5_000) for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k); // opportunistic cleanup
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}

function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? 'unknown';
}

// Per-isolate daily budget — a coarse cost-stop that works even when the runtime hides client IPs
// (where the per-IP limiter must fail open). Each Workers isolate counts separately, so this is a
// cost ceiling, not an exact global limit; the true global control is a WAF/KV rate rule (tracked
// as a pre-launch item). 5000/day per isolate is far beyond legitimate traffic at this stage.
const DAILY_BUDGET = Number(process.env.LOLA_DAILY_BUDGET ?? 5000);
let budget = { day: '', count: 0 };
function budgetExceeded(): boolean {
  const day = new Date().toISOString().slice(0, 10);
  if (budget.day !== day) budget = { day, count: 0 };
  budget.count += 1;
  return budget.count > DAILY_BUDGET;
}

type Message = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    if (requestOriginRejected(request)) {
      return Response.json({ error: 'forbidden origin' }, { status: 403 });
    }
    if (rateLimited(clientIp(request))) {
      return Response.json({ error: 'rate limit exceeded' }, { status: 429 });
    }
    if (budgetExceeded()) {
      return Response.json({ error: 'daily capacity reached' }, { status: 429 });
    }

    const body = (await request.json()) as {
      system?: string; messages?: Message[]; model?: string; max_tokens?: number;
    };

    // ── Validate payload shape + size ────────────────────────────────────
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }
    if (body.messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'too many messages' }, { status: 400 });
    }
    let totalChars = (body.system ?? '').length;
    for (const m of body.messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
        return Response.json({ error: 'invalid message' }, { status: 400 });
      }
      totalChars += m.content.length;
    }
    if (totalChars > MAX_TOTAL_CHARS) {
      return Response.json({ error: 'payload too large' }, { status: 413 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // Misconfiguration, not a client error — the secret isn't set on the server.
      console.error('ANTHROPIC_API_KEY is not set');
      return Response.json({ error: 'server not configured' }, { status: 500 });
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        max_tokens: Math.min(Number(body.max_tokens) || 512, MAX_TOKENS_CAP),
        ...(body.system ? { system: body.system } : {}),
        messages: body.messages,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Anthropic upstream error', res.status, detail);
      await captureServerError(new Error(`Anthropic upstream ${res.status}`), {
        route: '/api/lola', extra: { status: res.status, detail: detail.slice(0, 500) },
      });
      return Response.json({ error: 'upstream error' }, { status: 502 });
    }

    const data = (await res.json()) as { content?: { text?: string }[] };
    return Response.json({ text: data.content?.[0]?.text ?? '' });
  } catch (e) {
    console.error('lola route error', e);
    await captureServerError(e, { route: '/api/lola', method: 'POST' });
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
