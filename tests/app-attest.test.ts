import { describe, it, expect } from 'vitest';
import { decodeCbor, parseAuthData, expectedNonce, b64ToBytes, verifyAttestation } from '@/lib/appAttest';

// C2b native (App Attest). A full attestation can only be produced by a real device, so these
// cover the DEVICE-INDEPENDENT pieces — the CBOR decoder, the authData parser, the nonce
// derivation, and the safe-default rejection (verifyAttestation must FAIL until the chain check is
// finished + device-validated in build 39, so native stays gated).

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
