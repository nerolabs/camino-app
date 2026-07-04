/**
 * Server-side proxy to ElevenLabs text-to-speech — gives Lola a voice.
 *
 * The ElevenLabs key lives ONLY on the server (process.env.ELEVENLABS_API_KEY) and never
 * reaches the client, exactly like app/api/lola+api.ts. Runs on EAS Hosting (Cloudflare
 * Workers) — Web APIs only. Contract: POST { text } -> audio/mpeg.
 *
 * Hardening mirrors /api/lola: origin/referer allowlist, per-IP rate limit, text length cap.
 */

import { captureServerError } from '@/lib/sentryServer';
import { corsPreflight, isAllowedOrigin, volumeGuard } from '@/lib/apiGuard';

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
// Warm, natural accented English needs the multilingual model. Voice is chosen per-account.
const MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2';
const MAX_CHARS = 1000; // an intro or a question — never a wall of text

// In-memory per-IP limit (per isolate, free backstop); durable limits below.
const RATE_LIMIT = Number(process.env.TTS_RATE_LIMIT ?? 60);
const RATE_WINDOW_MS = 60_000;

// Durable volume limits (Supabase-backed, cross-isolate). One TTS call per Lola turn —
// real users make a handful per minute; note CORS can't protect this route's GET (media
// tags skip preflight), so these counters are its primary defense.
const IP_PER_MINUTE = Number(process.env.TTS_IP_PER_MINUTE ?? 20);
const GLOBAL_PER_DAY = Number(process.env.TTS_GLOBAL_PER_DAY ?? 1000);

// See lola+api.ts: never fires on EAS (platform rewrites Origin), real check elsewhere.
function requestOriginRejected(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) return !isAllowedOrigin(origin);
  const referer = request.headers.get('referer');
  if (referer) return !isAllowedOrigin(referer);
  return false;
}

// Opts out of EAS Hosting's default permissive CORS (see lola+api.ts).
export function OPTIONS(request: Request): Response {
  return corsPreflight(request);
}

const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  if (ip === 'unknown') return false;
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now >= rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (hits.size > 5_000) for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
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

// Per-isolate daily budget — coarse cost-stop for ElevenLabs characters even when client IPs are
// hidden (per-IP limiter fails open there). See the same block in lola+api.ts for the rationale.
const DAILY_BUDGET = Number(process.env.TTS_DAILY_BUDGET ?? 2000);
let budget = { day: '', count: 0 };
function budgetExceeded(): boolean {
  const day = new Date().toISOString().slice(0, 10);
  if (budget.day !== day) budget = { day, count: 0 };
  budget.count += 1;
  return budget.count > DAILY_BUDGET;
}

// Synthesize `text` → audio/mpeg. Shared by POST (web sends JSON) and GET (native streams by URL,
// since expo-audio's player fetches a URL rather than a body).
async function ttsResponse(text: string, method: string, request: Request): Promise<Response> {
  if (!text) return Response.json({ error: 'text is required' }, { status: 400 });
  if (text.length > MAX_CHARS) return Response.json({ error: 'text too long' }, { status: 413 });

  // Durable volume limits — AFTER validation so malformed junk can't burn the budget.
  const limited = await volumeGuard('tts', request, {
    ipPerMinute: IP_PER_MINUTE, globalPerDay: GLOBAL_PER_DAY,
  });
  if (limited) return limited;

  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId) {
    console.error('ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID not set');
    return Response.json({ error: 'tts not configured' }, { status: 503 });
  }

  const res = await fetch(`${ELEVEN_BASE}/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    console.error('ElevenLabs error', res.status, detail);
    await captureServerError(new Error(`ElevenLabs upstream ${res.status}`), {
      route: '/api/tts', method, extra: { status: res.status, detail: detail.slice(0, 500) },
    });
    return Response.json({ error: 'tts upstream error' }, { status: 502 });
  }

  // Same text → same audio, so let the browser/CDN cache it hard.
  return new Response(res.body, {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=86400' },
  });
}

// Web client: POST { text }.
export async function POST(request: Request) {
  try {
    if (requestOriginRejected(request)) return Response.json({ error: 'forbidden origin' }, { status: 403 });
    if (rateLimited(clientIp(request))) return Response.json({ error: 'rate limit exceeded' }, { status: 429 });
    if (budgetExceeded()) return Response.json({ error: 'daily capacity reached' }, { status: 429 });
    const body = (await request.json()) as { text?: string };
    return await ttsResponse((body.text ?? '').trim(), 'POST', request);
  } catch (e) {
    console.error('tts route error', e);
    await captureServerError(e, { route: '/api/tts', method: 'POST' });
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}

// Native client: GET /api/tts?text=... (expo-audio plays a URL, not a request body).
export async function GET(request: Request) {
  try {
    if (requestOriginRejected(request)) return Response.json({ error: 'forbidden origin' }, { status: 403 });
    if (rateLimited(clientIp(request))) return Response.json({ error: 'rate limit exceeded' }, { status: 429 });
    if (budgetExceeded()) return Response.json({ error: 'daily capacity reached' }, { status: 429 });
    const text = new URL(request.url).searchParams.get('text') ?? '';
    return await ttsResponse(text.trim(), 'GET', request);
  } catch (e) {
    console.error('tts route error', e);
    await captureServerError(e, { route: '/api/tts', method: 'GET' });
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
