/**
 * Apple App Attest attestation verification (council fix C2b — native security, build 39).
 *
 * The iOS app produces an attestation object via @expo/app-integrity (Secure-Enclave key,
 * hardware-backed); the server verifies it here and, on success, mints the SAME HMAC session
 * token web gets from a Turnstile solve. This is the non-spoofable native equivalent of Turnstile.
 *
 * ⚠️ FLAG-GATED OFF until validated on a real device (App Store / TestFlight build 39). The full
 * X.509 chain-to-Apple-root validation and the end-to-end flow can only be exercised against real
 * device attestations, so `sessionGate`/the native route only trust this when
 * NATIVE_ATTESTATION_ENABLED is set — otherwise native stays gated (401), the current safe state.
 * Do NOT enable the flag until a device attestation round-trips green.
 *
 * Verification steps (Apple, "Validating apps that connect to your server"):
 *  1. Decode the CBOR attestation object → { fmt:'apple-appattest', attStmt:{ x5c }, authData }.
 *  2. Verify the x5c chain (leaf → Apple App Attestation CA → Apple App Attest Root CA).
 *  3. clientDataHash = SHA256(challenge); nonce = SHA256(authData || clientDataHash); confirm the
 *     leaf cert's App-Attest extension (1.2.840.113635.100.8.2) contains that nonce.
 *  4. authData.rpIdHash === SHA256("<teamId>.<bundleId>"); counter === 0; aaguid is appattest[develop].
 *  5. credentialId === keyId. Then the leaf's public key is this instance's App Attest key.
 *
 * Web Crypto only (Workers runtime); minimal hand-rolled CBOR/DER (no deps in the server bundle,
 * same discipline as lib/emailTokens.ts).
 */

const enc = new TextEncoder();
const sha256 = async (b: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', b as BufferSource));

const concat = (...as: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(as.reduce((n, a) => n + a.length, 0));
  let o = 0; for (const a of as) { out.set(a, o); o += a.length; }
  return out;
};
const eq = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── Minimal CBOR decoder (enough for the App Attest attestation object) ───────────
type Cbor = number | string | Uint8Array | Cbor[] | { [k: string]: Cbor };
export function decodeCbor(buf: Uint8Array): Cbor {
  let p = 0;
  const readLen = (ai: number): number => {
    if (ai < 24) return ai;
    if (ai === 24) return buf[p++];
    if (ai === 25) { const v = (buf[p] << 8) | buf[p + 1]; p += 2; return v; }
    if (ai === 26) { const v = (buf[p] * 2 ** 24) + (buf[p + 1] << 16) + (buf[p + 2] << 8) + buf[p + 3]; p += 4; return v; }
    throw new Error('cbor: unsupported length');
  };
  const read = (): Cbor => {
    const b = buf[p++]; const major = b >> 5; const ai = b & 0x1f;
    switch (major) {
      case 0: return readLen(ai);                             // uint
      case 1: return -1 - readLen(ai);                        // negative int
      case 2: { const n = readLen(ai); const v = buf.subarray(p, p + n); p += n; return v; } // bytes
      case 3: { const n = readLen(ai); const v = new TextDecoder().decode(buf.subarray(p, p + n)); p += n; return v; } // text
      case 4: { const n = readLen(ai); const a: Cbor[] = []; for (let i = 0; i < n; i++) a.push(read()); return a; } // array
      case 5: { const n = readLen(ai); const o: { [k: string]: Cbor } = {}; for (let i = 0; i < n; i++) { const k = read() as string; o[k] = read(); } return o; } // map
      default: throw new Error(`cbor: major ${major} unsupported`);
    }
  };
  return read();
}

export type AuthData = { rpIdHash: Uint8Array; counter: number; aaguid: Uint8Array; credentialId: Uint8Array };
export function parseAuthData(authData: Uint8Array): AuthData {
  // rpIdHash(32) | flags(1) | counter(4) | aaguid(16) | credIdLen(2) | credId | pubkey(COSE)…
  const rpIdHash = authData.subarray(0, 32);
  const counter = (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36];
  const aaguid = authData.subarray(37, 53);
  const credIdLen = (authData[53] << 8) | authData[54];
  const credentialId = authData.subarray(55, 55 + credIdLen);
  return { rpIdHash, counter, aaguid, credentialId };
}

/** The nonce Apple binds into the attestation: SHA256(authData || SHA256(challenge)). */
export async function expectedNonce(authData: Uint8Array, challenge: string): Promise<Uint8Array> {
  const clientDataHash = await sha256(enc.encode(challenge));
  return sha256(concat(authData, clientDataHash));
}

// aaguid for the two App Attest environments, right-padded to 16 bytes.
const AAGUID = (s: string) => { const a = new Uint8Array(16); a.set(enc.encode(s)); return a; };
const AAGUID_PROD = AAGUID('appattest');
const AAGUID_DEV = AAGUID('appattestdevelop');

export type AttestInput = { attestationB64: string; keyIdB64: string; challenge: string; appId: string };
export type AttestResult = { ok: true; publicKeyDer: Uint8Array } | { ok: false; reason: string };

/**
 * Verify an App Attest attestation. Returns the leaf public key (SPKI DER) on success.
 * NOTE: the x5c chain-to-Apple-root signature validation is the one step that MUST be finished and
 * exercised with real device attestations (build 39) before the NATIVE_ATTESTATION_ENABLED flag is
 * turned on — see verifyChain below. Everything else (structure + hash bindings) is complete here.
 */
export async function verifyAttestation(input: AttestInput): Promise<AttestResult> {
  try {
    const obj = decodeCbor(b64ToBytes(input.attestationB64)) as { fmt?: string; attStmt?: { x5c?: Uint8Array[] }; authData?: Uint8Array };
    if (obj.fmt !== 'apple-appattest') return { ok: false, reason: 'bad fmt' };
    const x5c = obj.attStmt?.x5c;
    const authData = obj.authData;
    if (!Array.isArray(x5c) || x5c.length < 1 || !(authData instanceof Uint8Array)) return { ok: false, reason: 'missing x5c/authData' };

    const ad = parseAuthData(authData);

    // rpIdHash === SHA256(appId)  (appId = "<teamId>.<bundleId>")
    if (!eq(ad.rpIdHash, await sha256(enc.encode(input.appId)))) return { ok: false, reason: 'rpIdHash mismatch' };
    // fresh attestation → counter 0
    if (ad.counter !== 0) return { ok: false, reason: 'counter != 0' };
    // genuine App Attest environment
    if (!eq(ad.aaguid, AAGUID_PROD) && !eq(ad.aaguid, AAGUID_DEV)) return { ok: false, reason: 'bad aaguid' };
    // the attested key is the keyId the client claims
    if (!eq(ad.credentialId, b64ToBytes(input.keyIdB64))) return { ok: false, reason: 'keyId mismatch' };

    // nonce binding: the leaf cert must carry SHA256(authData || SHA256(challenge)) in ext .8.2
    const nonce = await expectedNonce(authData, input.challenge);
    const leaf = x5c[0];
    const extNonce = extractAppAttestNonce(leaf);
    if (!extNonce || !eq(extNonce, nonce)) return { ok: false, reason: 'nonce mismatch' };

    // chain to Apple's App Attest Root CA — see verifyChain (build-39 completion + device validation)
    const chainOk = await verifyChain(x5c);
    if (!chainOk) return { ok: false, reason: 'chain not verified' };

    return { ok: true, publicKeyDer: extractSpki(leaf) };
  } catch (e) {
    return { ok: false, reason: `parse error: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

// ── DER helpers (minimal, App-Attest-shaped) ─────────────────────────────────────
// The leaf's App Attest nonce lives in extension OID 1.2.840.113635.100.8.2 as
// SEQUENCE { [1] EXPLICIT OCTET STRING(SHA-256) }. We locate the OID bytes and read the
// trailing 32-byte digest. Kept deliberately small; hardened + tested against device vectors in
// build 39 (this is why the whole native path is flag-gated OFF until then).
const APP_ATTEST_OID = new Uint8Array([0x06, 0x0a, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x08, 0x02]);
function extractAppAttestNonce(cert: Uint8Array): Uint8Array | null {
  const i = indexOf(cert, APP_ATTEST_OID);
  if (i < 0) return null;
  // after the OID comes an OCTET STRING wrapping the extnValue; the last 32 bytes are the digest.
  const tail = cert.subarray(i + APP_ATTEST_OID.length);
  // find the final 0x04 0x20 (OCTET STRING, len 32) marker
  for (let j = 0; j + 34 <= tail.length; j++) {
    if (tail[j] === 0x04 && tail[j + 1] === 0x20) {
      const cand = tail.subarray(j + 2, j + 34);
      if (cand.length === 32) return cand;
    }
  }
  return null;
}
// Extract the SubjectPublicKeyInfo (SPKI DER) for a P-256 EC key from the cert.
function extractSpki(cert: Uint8Array): Uint8Array {
  // EC P-256 SPKI starts with this fixed prefix (id-ecPublicKey + prime256v1 + BIT STRING(65)).
  const prefix = new Uint8Array([0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00]);
  const i = indexOf(cert, prefix);
  if (i < 0) return new Uint8Array();
  return cert.subarray(i, i + prefix.length + 65);
}
function indexOf(hay: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * Validate the x5c chain up to Apple's App Attest Root CA.
 * BUILD-39 COMPLETION: full ASN.1 tbs/signature extraction + Web Crypto ECDSA verify against the
 * Apple App Attest Root CA public key, exercised with a REAL device attestation. Until then this
 * returns false, so verifyAttestation never succeeds and native stays gated (safe default).
 */
async function verifyChain(_x5c: Uint8Array[]): Promise<boolean> {
  // Intentionally not yet trusted — completed + validated on-device in build 39. See module header.
  return false;
}
