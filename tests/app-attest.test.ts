import { describe, it, expect } from 'vitest';
import { decodeCbor, parseAuthData, expectedNonce, b64ToBytes, verifyAttestation } from '@/lib/appAttest';
import { DEVICE_ATTESTATION as DA } from './fixtures/appAttestDeviceVector';

// C2b native (App Attest). Two layers: the DEVICE-INDEPENDENT pieces (CBOR decoder, authData
// parser, nonce derivation, safe-default rejection), and the full end-to-end verification against
// a REAL device attestation captured from build 39 (fixtures/appAttestDeviceVector.ts) — including
// the x5c chain-to-Apple-root. This is what proves native is safe to enable.

describe('CBOR decoder (App Attest attestation object shape)', () => {
  it('decodes a map with ints, text, arrays, and byte strings', () => {
    // { "a": 1, "b": [2, 3], "c": h'FF00' }
    const bytes = new Uint8Array([0xa3, 0x61, 0x61, 0x01, 0x61, 0x62, 0x82, 0x02, 0x03, 0x61, 0x63, 0x42, 0xff, 0x00]);
    const out = decodeCbor(bytes) as { a: number; b: number[]; c: Uint8Array };
    expect(out.a).toBe(1);
    expect(out.b).toEqual([2, 3]);
    expect([...out.c]).toEqual([0xff, 0x00]);
  });
});

describe('parseAuthData', () => {
  it('slices rpIdHash / counter / aaguid / credentialId at the right offsets', () => {
    const rp = new Uint8Array(32).fill(0x11);
    const aaguid = new Uint8Array(16); aaguid.set(new TextEncoder().encode('appattest'));
    const credId = new Uint8Array([1, 2, 3, 4]);
    const ad = new Uint8Array(55 + credId.length);
    ad.set(rp, 0);
    ad[32] = 0x40;                 // flags
    ad[36] = 0;                    // counter = 0
    ad.set(aaguid, 37);
    ad[53] = 0x00; ad[54] = 0x04;  // credIdLen = 4
    ad.set(credId, 55);
    const p = parseAuthData(ad);
    expect([...p.rpIdHash]).toEqual([...rp]);
    expect(p.counter).toBe(0);
    expect([...p.aaguid]).toEqual([...aaguid]);
    expect([...p.credentialId]).toEqual([1, 2, 3, 4]);
  });
});

describe('expectedNonce', () => {
  it('is deterministic: SHA256(authData || SHA256(challenge))', async () => {
    const ad = new Uint8Array([1, 2, 3]);
    const a = await expectedNonce(ad, 'challenge-abc');
    const b = await expectedNonce(ad, 'challenge-abc');
    const c = await expectedNonce(ad, 'challenge-xyz');
    expect([...a]).toEqual([...b]);
    expect([...a]).not.toEqual([...c]);
    expect(a.length).toBe(32);
  });
});

describe('b64ToBytes', () => {
  it('decodes standard and url-safe base64', () => {
    expect([...b64ToBytes('AQID')]).toEqual([1, 2, 3]);
    expect([...b64ToBytes('_-8')]).toEqual([...b64ToBytes('/+8=')]);
  });
});

describe('verifyAttestation — safe default', () => {
  it('rejects a garbage attestation (never throws)', async () => {
    const r = await verifyAttestation({ attestationB64: 'bm90LWNib3I', keyIdB64: 'AQID', challenge: 'x', appId: 'T.b' });
    expect(r.ok).toBe(false);
  });
});

describe('verifyAttestation — real device vector (end-to-end)', () => {
  const good = { attestationB64: DA.attestationB64, keyIdB64: DA.keyId, challenge: DA.challenge, appId: DA.appId };

  it('accepts a genuine device attestation and returns the leaf P-256 public key', async () => {
    const r = await verifyAttestation(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // SPKI DER for an EC P-256 key is 91 bytes (26-byte prefix + 65-byte point).
      expect(r.publicKeyDer.length).toBe(91);
    }
  });

  it('rejects when the challenge differs (nonce binding fails)', async () => {
    const r = await verifyAttestation({ ...good, challenge: DA.challenge.replace(/.$/, '0') });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('nonce mismatch');
  });

  it('rejects when the appId differs (rpIdHash fails)', async () => {
    const r = await verifyAttestation({ ...good, appId: 'WRONGTEAM.com.nerolabs.camino' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('rpIdHash mismatch');
  });

  it('rejects when the claimed keyId is not the attested credentialId', async () => {
    const r = await verifyAttestation({ ...good, keyIdB64: 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('keyId mismatch');
  });

  it('rejects a tampered certificate chain (leaf byte flipped)', async () => {
    // Corrupt one byte deep in the CBOR (inside the leaf cert) → chain signature no longer verifies.
    const bytes = b64ToBytes(DA.attestationB64);
    bytes[400] ^= 0xff;
    const b64 = btoa(String.fromCharCode(...bytes));
    const r = await verifyAttestation({ ...good, attestationB64: b64 });
    expect(r.ok).toBe(false);
  });
});
