import { describe, it, expect, vi, afterEach } from 'vitest';
import { evaluateVerdict, parseServiceAccount, getAccessToken, _resetTokenCache, type IntegrityPayload } from '@/lib/playIntegrity';

// C2b native (Play Integrity — the Android twin of App Attest). The security-critical core is the
// PURE evaluateVerdict(): given Google's decoded verdict, does it prove a genuine Play install on a
// genuine device that answered OUR challenge? Tested against Google's documented verdict shape.
// getAccessToken() (SA-key JWT → OAuth) is exercised with a generated RSA key + mocked token
// endpoint so the JWT-signing + caching path is covered without network.

const PKG = 'com.aelaboratories.getcamino';
const CHALLENGE = '1700000000000.abc123.deadbeefcafe';

// A genuine verdict as documented at developer.android.com/google/play/integrity/verdicts.
const goodPayload = (): IntegrityPayload => ({
  requestDetails: { requestPackageName: PKG, requestHash: CHALLENGE, timestampMillis: '1700000000000' },
  appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED', packageName: PKG },
  deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_DEVICE_INTEGRITY', 'MEETS_BASIC_INTEGRITY'] },
  accountDetails: { appLicensingVerdict: 'LICENSED' },
});

describe('evaluateVerdict — genuine Play install', () => {
  it('accepts a documented genuine verdict', () => {
    expect(evaluateVerdict(goodPayload(), { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: true });
  });
});

describe('evaluateVerdict — rejections (safe default)', () => {
  it('rejects a verdict minted for a different app (package mismatch)', () => {
    const p = goodPayload(); p.requestDetails!.requestPackageName = 'com.evil.clone';
    expect(evaluateVerdict(p, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'package mismatch' });
  });

  it('rejects a replayed verdict that answers a different challenge (requestHash mismatch)', () => {
    const p = goodPayload(); p.requestDetails!.requestHash = 'some.other.nonce';
    expect(evaluateVerdict(p, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'requestHash mismatch' });
  });

  it('rejects an app not recognized by Play (sideloaded / modified)', () => {
    const p = goodPayload(); p.appIntegrity!.appRecognitionVerdict = 'UNRECOGNIZED_VERSION';
    expect(evaluateVerdict(p, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'app not play-recognized' });
  });

  it('rejects a device that fails integrity (emulator / rooted)', () => {
    const p = goodPayload(); p.deviceIntegrity!.deviceRecognitionVerdict = ['MEETS_BASIC_INTEGRITY'];
    expect(evaluateVerdict(p, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'device integrity not met' });
  });

  it('rejects a verdict with an empty device verdict array', () => {
    const p = goodPayload(); p.deviceIntegrity!.deviceRecognitionVerdict = [];
    expect(evaluateVerdict(p, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'device integrity not met' });
  });

  it('rejects a payload missing requestDetails, and null/garbage', () => {
    expect(evaluateVerdict({}, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'missing requestDetails' });
    expect(evaluateVerdict(null, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'malformed verdict' });
    expect(evaluateVerdict(undefined, { challenge: CHALLENGE, packageName: PKG })).toEqual({ ok: false, reason: 'malformed verdict' });
  });
});

describe('parseServiceAccount', () => {
  it('parses a well-formed service-account key', () => {
    const raw = JSON.stringify({ client_email: 'sa@proj.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----' });
    expect(parseServiceAccount(raw)?.client_email).toBe('sa@proj.iam.gserviceaccount.com');
  });
  it('returns null for unset, malformed, or incomplete keys', () => {
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount('not json')).toBeNull();
    expect(parseServiceAccount(JSON.stringify({ client_email: 'a@b.c' }))).toBeNull(); // no private_key
    expect(parseServiceAccount(JSON.stringify({ private_key: 'x' }))).toBeNull();       // no client_email
  });
});

describe('getAccessToken — JWT signing + caching', () => {
  afterEach(() => { _resetTokenCache(); vi.unstubAllGlobals(); });

  async function makeServiceAccount() {
    const pair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true, ['sign', 'verify'],
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
    const b64 = btoa(String.fromCharCode(...pkcs8));
    const pem = `-----BEGIN PRIVATE KEY-----\n${b64.replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----`;
    return { client_email: 'sa@proj.iam.gserviceaccount.com', private_key: pem, token_uri: 'https://oauth2.example/token' };
  }

  it('mints a token once and caches it across calls', async () => {
    const sa = await makeServiceAccount();
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ access_token: 'tok-1', expires_in: 3600 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const t1 = await getAccessToken(sa);
    const t2 = await getAccessToken(sa);
    expect(t1).toBe('tok-1');
    expect(t2).toBe('tok-1');
    expect(fetchMock).toHaveBeenCalledTimes(1); // second call served from cache

    // A well-formed JWT bearer assertion was sent (three dot-separated segments).
    const body = String(fetchMock.mock.calls[0][1]?.body);
    const assertion = new URLSearchParams(body).get('assertion');
    expect(assertion?.split('.')).toHaveLength(3);
  });

  it('re-mints after the cache is cleared', async () => {
    const sa = await makeServiceAccount();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ access_token: 'tok-2', expires_in: 3600 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await getAccessToken(sa);
    _resetTokenCache();
    await getAccessToken(sa);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
