/**
 * Turnstile → session-token exchange (council fix C2b).
 *
 * The web client solves a Cloudflare Turnstile challenge at interview start and POSTs the token
 * here; we siteverify it (server-side, with TURNSTILE_SECRET_KEY) and, on success, mint a
 * short-lived HMAC session token (lib/session.ts) the client then sends on every /api/lola and
 * /api/feedback call. So a stolen endpoint URL can't be driven without first passing a challenge.
 *
 * Runs on EAS Hosting (Workers runtime) — Web APIs only. Fails safe: if Turnstile isn't
 * configured, the paid routes don't enforce sessions either (see lib/session.ts sessionGate), so
 * this route simply reports "not configured" rather than pretending to gate.
 */
import { captureServerError } from '@/lib/sentryServer';
import { corsPreflight, volumeGuard } from '@/lib/apiGuard';
import { mintSession, mintChallenge, verifyChallenge } from '@/lib/session';
import { verifyAttestation } from '@/lib/appAttest';

// Apple App Attest app identity ("<TeamID>.<BundleID>"). Overridable via env for other envs.
const APP_ATTEST_APP_ID = process.env.APP_ATTEST_APP_ID ?? 'VB9CHJM4AN.com.nerolabs.camino';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Cloudflare's public always-pass TEST keys. When the deployed site key IS the test key (staging),
// we verify against the matching test secret — so the E2E gate is deterministic without a real
// challenge — and never need a per-environment real secret. Production carries the real site key
// and therefore uses the real TURNSTILE_SECRET_KEY. These constants are public, not secrets.
const TEST_SITE_KEY = '1x00000000000000000000AA';
const TEST_SECRET = '1x0000000000000000000000000000000AA';

// The siteverify secret that matches the deployed site key (test↔test, real↔real).
function turnstileSecret(): string | undefined {
  if (process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY === TEST_SITE_KEY) return TEST_SECRET;
  return process.env.TURNSTILE_SECRET_KEY;
}

export function OPTIONS(request: Request): Response {
  return corsPreflight(request);
}

function clientIp(request: Request): string | null {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? null;
}

async function siteverify(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set('remoteip', ip);
  const res = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data?.success === true;
}

export async function POST(request: Request) {
  try {
    // Modest per-IP/day guard so this can't be spun to spam Cloudflare's verify endpoint — a
    // real solve is required anyway, so the limits are generous.
    const limited = await volumeGuard('session', request, { ipPerMinute: 30, globalPerDay: 50_000 });
    if (limited) return limited;

    const signingSecret = process.env.CRON_SECRET;
    if (!signingSecret) return Response.json({ error: 'not configured' }, { status: 501 });

    const body = (await request.json()) as {
      kind?: string; token?: unknown; keyId?: unknown; attestation?: unknown; challenge?: unknown;
    };

    // ── Native: issue an App Attest challenge (a signed nonce; no Turnstile needed) ──
    if (body.kind === 'challenge') {
      return Response.json({ challenge: await mintChallenge(signingSecret) });
    }

    // ── Native: verify an App Attest attestation → mint the same session token (C2b) ──
    // FLAG-GATED: until NATIVE_ATTESTATION_ENABLED is set (after on-device validation in build 39),
    // this reports not-enabled and native stays gated — the current safe state.
    if (body.kind === 'attest') {
      const { keyId, attestation, challenge } = body;
      if (typeof keyId !== 'string' || typeof attestation !== 'string' || typeof challenge !== 'string')
        return Response.json({ error: 'keyId, attestation, challenge required' }, { status: 400 });
      if (process.env.NATIVE_ATTESTATION_ENABLED !== '1') {
        // BUILD-39 CAPTURE: attestations are public (not secret). Log the real device attestation so
        // verifyChain can be completed + tested against it, then this capture line + the log are
        // removed and the flag is flipped on. Retrieve via `eas deploy` logs / the hosting dashboard.
        console.log('[appAttest:capture]', JSON.stringify({ keyId, challenge, attestation }));
        return Response.json({ error: 'native attestation not enabled' }, { status: 501 });
      }
      if (!(await verifyChallenge(signingSecret, challenge)))
        return Response.json({ error: 'stale or invalid challenge' }, { status: 403 });
      const r = await verifyAttestation({ attestationB64: attestation, keyIdB64: keyId, challenge, appId: APP_ATTEST_APP_ID });
      if (!r.ok) {
        console.error('[appAttest] verification failed:', r.reason);
        return Response.json({ error: 'attestation failed' }, { status: 403 });
      }
      return Response.json({ session: await mintSession(signingSecret) });
    }

    // ── Web: Cloudflare Turnstile (default) ──
    const secret = turnstileSecret();
    if (!process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || !secret) {
      return Response.json({ error: 'not configured' }, { status: 501 });
    }
    if (typeof body.token !== 'string' || !body.token) {
      return Response.json({ error: 'token is required' }, { status: 400 });
    }
    if (!(await siteverify(secret, body.token, clientIp(request)))) {
      return Response.json({ error: 'challenge failed' }, { status: 403 });
    }
    return Response.json({ session: await mintSession(signingSecret) });
  } catch (e) {
    console.error('session route error', e);
    await captureServerError(e, { route: '/api/session', method: 'POST' });
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
