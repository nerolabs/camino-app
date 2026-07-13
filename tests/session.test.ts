import { describe, it, expect, afterEach } from 'vitest';
import { mintSession, verifySession, sessionGate, SESSION_TTL_MS, mintChallenge, verifyChallenge } from '@/lib/session';

// C2b: short-lived HMAC session tokens minted after a Turnstile solve, required on the paid
// routes. These pin the token crypto and the server gate's enforce/fail-open behavior.

const SECRET = 'test-signing-secret';
const req = (headers?: Record<string, string>) =>
  new Request('https://getcamino.app/api/lola', { method: 'POST', headers });

describe('mint/verify session tokens', () => {
  it('mints a token that verifies with the same secret before expiry', async () => {
    const now = 1_000_000;
    const tok = await mintSession(SECRET, now);
    expect(await verifySession(SECRET, tok, now + 1_000)).toBe(true);
  });

  it('rejects an expired token', async () => {
    const now = 1_000_000;
    const tok = await mintSession(SECRET, now);
    expect(await verifySession(SECRET, tok, now + SESSION_TTL_MS + 1)).toBe(false);
  });

  it('rejects a token signed with a different secret', async () => {
    const tok = await mintSession(SECRET, 1_000_000);
    expect(await verifySession('other-secret', tok, 1_000_001)).toBe(false);
  });

  it('rejects a tampered signature or a bumped expiry', async () => {
    const now = 1_000_000;
    const tok = await mintSession(SECRET, now);
    const [exp, sig] = tok.split('.');
    expect(await verifySession(SECRET, `${exp}.${'0'.repeat(sig.length)}`, now + 1)).toBe(false);
    expect(await verifySession(SECRET, `${Number(exp) + 1}.${sig}`, now + 1)).toBe(false); // exp not covered by sig
  });

  it('rejects null and garbage', async () => {
    expect(await verifySession(SECRET, null)).toBe(false);
    expect(await verifySession(SECRET, undefined)).toBe(false);
    expect(await verifySession(SECRET, 'nonsense')).toBe(false);
    expect(await verifySession(SECRET, '99999999')).toBe(false); // no dot
  });
});

describe('App Attest challenge (C2b native)', () => {
  it('mints a challenge that verifies with the same secret before expiry', async () => {
    const now = 5_000_000;
    const c = await mintChallenge(SECRET, now);
    expect(c.split('.')).toHaveLength(3); // exp.random.sig
    expect(await verifyChallenge(SECRET, c, now + 1_000)).toBe(true);
  });
  it('rejects an expired, tampered, wrong-secret, or malformed challenge', async () => {
    const now = 5_000_000;
    const c = await mintChallenge(SECRET, now);
    expect(await verifyChallenge(SECRET, c, now + 6 * 60_000)).toBe(false);   // expired (5-min TTL)
    expect(await verifyChallenge('other', c, now + 1_000)).toBe(false);        // wrong secret
    const [exp, rand] = c.split('.');
    expect(await verifyChallenge(SECRET, `${exp}.${rand}.deadbeef`, now + 1_000)).toBe(false); // tampered sig
    expect(await verifyChallenge(SECRET, 'not-a-challenge', now)).toBe(false);
    expect(await verifyChallenge(SECRET, null, now)).toBe(false);
  });
});

describe('sessionGate (server enforcement)', () => {
  const saved = { site: process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY, cron: process.env.CRON_SECRET };
  afterEach(() => {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = saved.site;
    process.env.CRON_SECRET = saved.cron;
  });

  it('is OPEN when Turnstile is not configured (local dev)', async () => {
    delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
    expect(await sessionGate(req())).toBeNull();
  });

  it('401s a request with no/invalid token when configured', async () => {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = 'set';
    process.env.CRON_SECRET = SECRET;
    expect((await sessionGate(req()))?.status).toBe(401);
    expect((await sessionGate(req({ 'x-camino-session': 'bogus' })))?.status).toBe(401);
  });

  it('passes a request carrying a valid token when configured', async () => {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = 'set';
    process.env.CRON_SECRET = SECRET;
    const tok = await mintSession(SECRET);
    expect(await sessionGate(req({ 'x-camino-session': tok }))).toBeNull();
  });

  it('fails OPEN if the signing secret is missing (misconfig, not a lockout)', async () => {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = 'set';
    delete process.env.CRON_SECRET;
    expect(await sessionGate(req())).toBeNull();
  });
});
