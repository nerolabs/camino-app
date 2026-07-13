/**
 * Apple App Attest attestation verification (council fix C2b — native security, build 39).
 *
 * The iOS app produces an attestation object via @expo/app-integrity (Secure-Enclave key,
 * hardware-backed); the server verifies it here and, on success, mints the SAME HMAC session
 * token web gets from a Turnstile solve. This is the non-spoofable native equivalent of Turnstile.
 *
 * Verification (structure + hash bindings + X.509 chain-to-Apple-root) is COMPLETE and exercised
 * end-to-end against a real build-39 device attestation (tests/app-attest.test.ts). The native
 * route stays gated behind NATIVE_ATTESTATION_ENABLED so the flip to live is one explicit env
 * change after the deploy carrying this verifier — otherwise native reports not-enabled (safe).
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
 * All steps are implemented: CBOR/structure, rpIdHash/counter/aaguid/keyId, the nonce binding, and
 * the x5c chain-to-Apple-root (verifyChain below). Exercised against a real device vector in tests.
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
// The leaf's App Attest nonce lives in extension OID 1.2.840.113635.100.8.2 (encoded 06 09 …) as
// OCTET STRING { SEQUENCE { [1] OCTET STRING(SHA-256) } }. We locate the OID bytes and read the
// trailing 32-byte digest. Verified against a real device vector (tests/app-attest.test.ts).
const APP_ATTEST_OID = new Uint8Array([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x08, 0x02]);
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

// ── x5c chain validation (Web Crypto ECDSA, no deps) ─────────────────────────────
// Apple sends a 2-cert chain: leaf → "Apple App Attestation CA 1" (intermediate). The root
// ("Apple App Attestation Root CA") is NOT in the chain — it's the trust anchor we pin below as a
// SPKI constant (P-384 public key, from Apple's published root). A forged chain fails at the top
// link because the intermediate must be signed by THIS key. (Public value, not a secret.)
const APPLE_ROOT_SPKI = b64ToBytes(
  'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdhNbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9auYen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41',
);

// Minimal DER TLV reader. Returns the element's value span and its total end (short & long form len).
type Tlv = { tag: number; vStart: number; vEnd: number; start: number; end: number };
function tlv(buf: Uint8Array, start: number): Tlv {
  const tag = buf[start];
  let p = start + 1;
  let len = buf[p++];
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | buf[p++];
  }
  return { tag, vStart: p, vEnd: p + len, start, end: p + len };
}

const OID_ECDSA_SHA256 = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02];
const OID_ECDSA_SHA384 = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x03];
const OID_P256 = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];
const OID_P384 = [0x2b, 0x81, 0x04, 0x00, 0x22];
function oidAt(buf: Uint8Array, off: number, oid: number[]): boolean {
  for (let i = 0; i < oid.length; i++) if (buf[off + i] !== oid[i]) return false;
  return true;
}
function findOid(buf: Uint8Array, from: number, to: number, oid: number[]): number {
  for (let i = from; i + oid.length <= to; i++) if (oidAt(buf, i, oid)) return i;
  return -1;
}

type ParsedCert = { tbs: Uint8Array; sigHash: 'SHA-256' | 'SHA-384'; sigDer: Uint8Array; spki: Uint8Array; curve: 'P-256' | 'P-384' };
function parseCert(der: Uint8Array): ParsedCert {
  const outer = tlv(der, 0);                    // Certificate SEQUENCE
  const tbsEl = tlv(der, outer.vStart);         // tbsCertificate SEQUENCE
  const tbs = der.subarray(tbsEl.start, tbsEl.end);
  const sigAlg = tlv(der, tbsEl.end);           // signatureAlgorithm
  const sigVal = tlv(der, sigAlg.end);          // signatureValue BIT STRING

  let sigHash: 'SHA-256' | 'SHA-384';
  if (findOid(der, sigAlg.vStart, sigAlg.vEnd, OID_ECDSA_SHA256) >= 0) sigHash = 'SHA-256';
  else if (findOid(der, sigAlg.vStart, sigAlg.vEnd, OID_ECDSA_SHA384) >= 0) sigHash = 'SHA-384';
  else throw new Error('unknown sig alg');

  // BIT STRING content minus the leading "unused bits" byte → DER-encoded ECDSA signature.
  const sigDer = der.subarray(sigVal.vStart + 1, sigVal.vEnd);

  // Walk tbs fields to the SubjectPublicKeyInfo: [0]version?, serial, algid, issuer, validity,
  // subject, spki. Skip the 5 fields between the optional version and the SPKI.
  let q = tbsEl.vStart;
  let el = tlv(der, q);
  if (el.tag === 0xa0) { q = el.end; el = tlv(der, q); } // explicit [0] version
  for (let i = 0; i < 5; i++) { q = el.end; el = tlv(der, q); }
  const spki = der.subarray(el.start, el.end);

  let curve: 'P-256' | 'P-384';
  if (findOid(der, el.vStart, el.vEnd, OID_P256) >= 0) curve = 'P-256';
  else if (findOid(der, el.vStart, el.vEnd, OID_P384) >= 0) curve = 'P-384';
  else throw new Error('unknown curve');

  return { tbs, sigHash, sigDer, spki, curve };
}

// DER ECDSA signature SEQUENCE{r,s} → raw r||s, each left-padded to the curve's field size.
function derSigToRaw(sigDer: Uint8Array, size: number): Uint8Array {
  const seq = tlv(sigDer, 0);
  const r = tlv(sigDer, seq.vStart);
  const s = tlv(sigDer, r.end);
  const trim = (t: Tlv): Uint8Array => {
    let a = sigDer.subarray(t.vStart, t.vEnd);
    while (a.length > 1 && a[0] === 0x00) a = a.subarray(1);
    return a;
  };
  const pad = (a: Uint8Array): Uint8Array => { const o = new Uint8Array(size); o.set(a, size - a.length); return o; };
  return concat(pad(trim(r)), pad(trim(s)));
}

const CURVE_SIZE: Record<'P-256' | 'P-384', number> = { 'P-256': 32, 'P-384': 48 };

// True iff `child`'s signature verifies under the parent's SPKI public key.
async function certSignedBy(child: ParsedCert, parentSpki: Uint8Array, parentCurve: 'P-256' | 'P-384'): Promise<boolean> {
  const key = await crypto.subtle.importKey('spki', parentSpki as BufferSource, { name: 'ECDSA', namedCurve: parentCurve }, false, ['verify']);
  const raw = derSigToRaw(child.sigDer, CURVE_SIZE[parentCurve]);
  return crypto.subtle.verify({ name: 'ECDSA', hash: child.sigHash }, key, raw as BufferSource, child.tbs as BufferSource);
}

/**
 * Validate the x5c chain up to Apple's App Attest Root CA (the pinned trust anchor above).
 * leaf ← intermediate ← Apple Root. Verified end-to-end against a real build-39 device attestation
 * (tests/app-attest.test.ts). Anti-replay is enforced separately and more tightly by the signed
 * challenge nonce (5-min TTL, see lib/session.ts verifyChallenge), so cert expiry isn't re-checked
 * here — a fresh attestation always carries a fresh Apple-issued cert bound to that nonce.
 */
async function verifyChain(x5c: Uint8Array[]): Promise<boolean> {
  try {
    if (x5c.length < 2) return false;
    const leaf = parseCert(x5c[0]);
    const inter = parseCert(x5c[1]);
    if (!(await certSignedBy(leaf, inter.spki, inter.curve))) return false;   // leaf ← intermediate
    if (!(await certSignedBy(inter, APPLE_ROOT_SPKI, 'P-384'))) return false; // intermediate ← Apple Root
    return true;
  } catch {
    return false;
  }
}
