/**
 * Google Play Integrity verification (the Android twin of lib/appAttest.ts — native security C2b).
 *
 * The Android app produces a Play Integrity token via @expo/app-integrity's standard request
 * (`requestIntegrityCheckAsync`); the server decodes it here through Google's Play Integrity API
 * and, on success, mints the SAME HMAC session token web gets from a Turnstile solve. This is the
 * non-spoofable Android equivalent of Turnstile — the App Attest of the Play Store.
 *
 * Unlike App Attest (local X.509 verification), Play Integrity's documented server path is a
 * server-to-Google call: exchange the app's token for a decoded verdict via
 * `{packageName}:decodeIntegrityToken`, authenticated with a Google Cloud service account. So this
 * file has two halves:
 *   1. evaluateVerdict() — PURE: given Google's decoded payload, decide pass/fail. Unit-tested
 *      against Google's documented JSON shape (tests/play-integrity.test.ts).
 *   2. getAccessToken() / verifyIntegrityToken() — the network path (SA-key JWT → OAuth token →
 *      decode call). Exercised for real only once the Play app + service-account key exist; until
 *      then the route stays flag-gated OFF (PLAY_INTEGRITY_ENABLED), exactly like App Attest was.
 *
 * Web Crypto only (Workers runtime): RS256 JWT signing via crypto.subtle, no deps in the server
 * bundle (same discipline as lib/appAttest.ts / lib/emailTokens.ts).
 *
 * Ref: Google Play Integrity — "Standard API requests" + "Decrypt and verify the integrity verdict"
 *   https://developer.android.com/google/play/integrity/standard
 *   https://developer.android.com/google/play/integrity/verdicts
 */

const enc = new TextEncoder();
const b64url = (b: Uint8Array): string =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// ── The decoded verdict shape Google returns (the fields we actually gate on) ─────
export type IntegrityPayload = {
  requestDetails?: { requestPackageName?: string; requestHash?: string; timestampMillis?: string };
  appIntegrity?: { appRecognitionVerdict?: string; packageName?: string };
  deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
  accountDetails?: { appLicensingVerdict?: string };
};

export type VerdictResult = { ok: true } | { ok: false; reason: string };

/**
 * The pure gate: does this decoded verdict prove a genuine Play install on a genuine device that
 * answered OUR challenge? No network, no secrets — just the documented verdict fields.
 *  - requestPackageName is our app (the token was minted for us, not another app),
 *  - requestHash echoes the exact signed challenge we issued (anti-replay binding — the route also
 *    checks the challenge's own HMAC + 5-min freshness),
 *  - appRecognitionVerdict === PLAY_RECOGNIZED (installed/updated by Google Play, unmodified),
 *  - deviceRecognitionVerdict includes MEETS_DEVICE_INTEGRITY (a genuine Android device).
 */
export function evaluateVerdict(
  payload: IntegrityPayload | null | undefined,
  expected: { challenge: string; packageName: string },
): VerdictResult {
  if (!payload || typeof payload !== 'object') return { ok: false, reason: 'malformed verdict' };
  const rd = payload.requestDetails;
  if (!rd) return { ok: false, reason: 'missing requestDetails' };
  if (rd.requestPackageName !== expected.packageName) return { ok: false, reason: 'package mismatch' };
  if (rd.requestHash !== expected.challenge) return { ok: false, reason: 'requestHash mismatch' };
  if (payload.appIntegrity?.appRecognitionVerdict !== 'PLAY_RECOGNIZED')
    return { ok: false, reason: 'app not play-recognized' };
  const device = payload.deviceIntegrity?.deviceRecognitionVerdict;
  if (!Array.isArray(device) || !device.includes('MEETS_DEVICE_INTEGRITY'))
    return { ok: false, reason: 'device integrity not met' };
  return { ok: true };
}

// ── Service-account OAuth (JWT bearer → access token), Web Crypto RS256 ───────────
export type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
const OAUTH_SCOPE = 'https://www.googleapis.com/auth/playintegrity';
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

let tokenCache: { token: string; exp: number } | null = null;

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Mint (and cache for its lifetime) a Google OAuth2 access token from the service-account key. */
export async function getAccessToken(sa: ServiceAccount, now: number = Date.now()): Promise<string> {
  if (tokenCache && tokenCache.exp - 60_000 > now) return tokenCache.token;
  const tokenUri = sa.token_uri ?? DEFAULT_TOKEN_URI;
  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: sa.client_email, scope: OAUTH_SCOPE, aud: tokenUri, iat, exp,
  })));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToPkcs8(sa.private_key) as BufferSource,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput) as BufferSource));
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString(),
  });
  if (!res.ok) throw new Error(`oauth token ${res.status}`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('oauth: no access_token');
  tokenCache = { token: data.access_token, exp: now + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

// Exposed so tests can assert token caching / re-mint behaviour deterministically.
export function _resetTokenCache(): void { tokenCache = null; }

export type IntegrityInput = { token: string; challenge: string; packageName: string; serviceAccount: ServiceAccount };

/**
 * Decode a Play Integrity token via Google's API and gate on its verdict. Returns ok/reason.
 * Fails CLOSED on any error (network, auth, malformed) — a genuine device retries cheaply, and the
 * durable volume caps remain the backstop. The route only calls this when PLAY_INTEGRITY_ENABLED=1.
 */
export async function verifyIntegrityToken(input: IntegrityInput): Promise<VerdictResult> {
  try {
    const accessToken = await getAccessToken(input.serviceAccount);
    const url = `https://playintegrity.googleapis.com/v1/${encodeURIComponent(input.packageName)}:decodeIntegrityToken`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ integrity_token: input.token }),
    });
    if (!res.ok) return { ok: false, reason: `decode ${res.status}` };
    const data = (await res.json()) as { tokenPayloadExternal?: IntegrityPayload };
    return evaluateVerdict(data.tokenPayloadExternal, { challenge: input.challenge, packageName: input.packageName });
  } catch (e) {
    return { ok: false, reason: `verify error: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

/** Parse the SA key JSON from an env var; returns null if unset/malformed (route then reports 501). */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as ServiceAccount;
    if (typeof j.client_email === 'string' && typeof j.private_key === 'string') return j;
    return null;
  } catch {
    return null;
  }
}
