/**
 * Short-lived, signed "a human solved the challenge" session tokens (council fix C2b).
 *
 * The interview mints one of these on the client after a Cloudflare Turnstile solve (via
 * /api/session, which siteverifies the Turnstile token), then sends it on every /api/lola and
 * /api/feedback call. The server checks the HMAC + expiry — so a stolen endpoint URL is useless
 * without first passing a real challenge, which is what stops the automated/curl budget-drain
 * abuse C2a couldn't (C2a stopped arbitrary prompts; this stops arbitrary volume).
 *
 * Token format: `<expiryMs>.<hmacHex>`, keyed by CRON_SECRET (already a server secret). No
 * per-user binding — it only asserts "a challenge was solved recently"; the durable volume
 * counters still bound how much one solved token can do. Web Crypto only (Workers + Node + vitest).
 */
import { hmacHex } from '@/lib/emailTokens';

export const SESSION_TTL_MS = 30 * 60_000; // 30 minutes — one interview's worth, then re-solve

export async function mintSession(secret: string, now: number = Date.now()): Promise<string> {
  const exp = now + SESSION_TTL_MS;
  const sig = await hmacHex(secret, `session:${exp}`);
  return `${exp}.${sig}`;
}

export async function verifySession(
  secret: string, token: string | null | undefined, now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp <= now) return false; // expired or malformed
  const expected = await hmacHex(secret, `session:${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0; // constant-time compare
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// ── App Attest challenge (C2b native) ────────────────────────────────────────
// A short-lived HMAC-signed nonce, so we need no DB to prevent replay: the client embeds it in
// its attestation and sends it back; the server checks the signature + freshness, then binds it
// into the App Attest nonce derivation. Format: `<expiryMs>.<randomHex>.<hmacHex>`.
const CHALLENGE_TTL_MS = 5 * 60_000;

export async function mintChallenge(secret: string, now: number = Date.now()): Promise<string> {
  const exp = now + CHALLENGE_TTL_MS;
  const rand = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  const sig = await hmacHex(secret, `challenge:${exp}:${rand}`);
  return `${exp}.${rand}.${sig}`;
}

export async function verifyChallenge(secret: string, challenge: string | null | undefined, now: number = Date.now()): Promise<boolean> {
  if (!challenge) return false;
  const parts = challenge.split('.');
  if (parts.length !== 3) return false;
  const [expS, rand, sig] = parts;
  const exp = Number(expS);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = await hmacHex(secret, `challenge:${exp}:${rand}`);
  if (expected.length !== sig.length) return false;
  let d = 0;
  for (let i = 0; i < expected.length; i++) d |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return d === 0;
}

/**
 * Server gate for the paid routes. Returns a 401 Response to send, or null to proceed.
 *  - Enforced only where Turnstile is configured (TURNSTILE_SECRET_KEY set) — so local dev with
 *    no keys stays open, while staging/production enforce.
 *  - Fails OPEN if the signing secret is somehow missing (a misconfig should not lock out every
 *    user; the durable volume caps + provider spend caps remain the hard backstop).
 * The token travels in the `x-camino-session` header.
 */
export async function sessionGate(request: Request): Promise<Response | null> {
  if (!process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY) return null; // feature off where unconfigured (local dev)
  const secret = process.env.CRON_SECRET;
  if (!secret) return null; // can't verify → fail open
  const token = request.headers.get('x-camino-session');
  if (await verifySession(secret, token)) return null;
  return Response.json({ error: 'challenge required' }, { status: 401 });
}
