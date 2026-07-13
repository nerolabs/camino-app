/**
 * Server-side proxy to the Anthropic Messages API.
 *
 * The Anthropic key lives ONLY on the server (process.env.ANTHROPIC_API_KEY) and
 * never reaches the client — this replaces the old client-side SDK call that shipped
 * the key in the browser bundle. Runs on EAS Hosting (Cloudflare Workers), so it uses
 * only Web APIs (fetch), no Node modules.
 *
 * Contract: POST { mode, params, messages } -> { text }.
 *
 * C2a LOCKDOWN (council fix, 2026-07-13): the route NO LONGER accepts a caller-supplied
 * `system` string (nor `model`/`max_tokens`). The client sends a `mode` + typed `params`;
 * the SERVER builds the system prompt + picks the model/token cap (lib/lolaPrompts.ts). A
 * stolen URL is then only good for our five Lola personas, never general-purpose Claude.
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
import { corsPreflight, isAllowedOrigin, volumeGuard } from '@/lib/apiGuard';
import { buildLolaRequest } from '@/lib/lolaPrompts';
import { sessionGate } from '@/lib/session';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Payload limits — generous for real use, tight enough to stop abuse.
const MAX_TOKENS_CAP = 1024;
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 24_000; // summed length of all message contents + system

// In-memory per-IP limit (per isolate, free backstop). The DURABLE limits live in
// lib/apiGuard.ts volumeGuard — see LOLA_IP_PER_MINUTE / LOLA_GLOBAL_PER_DAY below.
const RATE_LIMIT = Number(process.env.LOLA_RATE_LIMIT ?? 60);
const RATE_WINDOW_MS = 60_000;

// Durable volume limits (Supabase-backed, cross-isolate). A full interview is ~2 calls
// per answer spaced by typing time — a real user stays far under 30/min; 2000/day is
// ~60 complete interviews of headroom.
const IP_PER_MINUTE = Number(process.env.LOLA_IP_PER_MINUTE ?? 30);
const GLOBAL_PER_DAY = Number(process.env.LOLA_GLOBAL_PER_DAY ?? 2000);

// Reject only when we have a positive signal (Origin or Referer) that the request came
// from a DIFFERENT site. NOTE: on EAS Hosting the platform rewrites Origin to our own
// hostname, so this never fires there (verified live 2026-07-04) — it's a real check on
// other runtimes and harmless where it isn't. The strict OPTIONS handler below is what
// actually shuts foreign browsers out on EAS.
function requestOriginRejected(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) return !isAllowedOrigin(origin);
  const referer = request.headers.get('referer');
  if (referer) return !isAllowedOrigin(referer);
  return false;
}

// Handling OPTIONS ourselves opts out of EAS Hosting's default permissive CORS
// (Allow-Origin: * + credentials), which would otherwise let any website use this
// endpoint from its visitors' browsers.
export function OPTIONS(request: Request): Response {
  return corsPreflight(request);
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
    // C2b: require a valid Turnstile-derived session token (where Turnstile is configured), before
    // we parse or process anything from an unauthenticated caller.
    const gated = await sessionGate(request);
    if (gated) return gated;

    const body = (await request.json()) as {
      mode?: string; params?: unknown; messages?: Message[];
    };

    // ── Validate message shape ───────────────────────────────────────────
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }
    if (body.messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'too many messages' }, { status: 400 });
    }
    let messageChars = 0;
    for (const m of body.messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
        return Response.json({ error: 'invalid message' }, { status: 400 });
      }
      messageChars += m.content.length;
    }

    // ── Build the prompt SERVER-SIDE from mode + params (C2a) ─────────────
    // The caller can no longer supply `system`; an unknown mode or catalog-unknown slot 400s.
    const built = buildLolaRequest(body.mode ?? '', body.params);
    if ('error' in built) {
      return Response.json({ error: built.error }, { status: 400 });
    }

    // Size cap over the BUILT system (which absorbs any caller free-text in params) + messages,
    // so transcript-stuffing still can't blow past the per-request budget.
    if (built.system.length + messageChars > MAX_TOTAL_CHARS) {
      return Response.json({ error: 'payload too large' }, { status: 413 });
    }

    // Durable volume limits — AFTER validation so malformed junk can't burn the budget.
    const limited = await volumeGuard('lola', request, {
      ipPerMinute: IP_PER_MINUTE, globalPerDay: GLOBAL_PER_DAY,
    });
    if (limited) return limited;

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // Misconfiguration, not a client error — the secret isn't set on the server.
      console.error('ANTHROPIC_API_KEY is not set');
      return Response.json({ error: 'server not configured' }, { status: 500 });
    }

    const upstreamStart = Date.now();
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: built.model,
        max_tokens: Math.min(built.max_tokens, MAX_TOKENS_CAP),
        system: built.system,
        messages: body.messages,
      }),
    });
    // A turn normally answers in 1–4s. Anything past 10s is a user staring at a spinner —
    // page it (user directive 2026-07-04): one Sentry event per slow turn, with the timing.
    const upstreamMs = Date.now() - upstreamStart;
    if (upstreamMs > 10_000) {
      await captureServerError(new Error('lola upstream slow (>10s)'), {
        route: '/api/lola', extra: { ms: upstreamMs, mode: body.mode, model: built.model, status: res.status },
      });
    }

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
