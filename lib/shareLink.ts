/**
 * Read-only roadmap share links (TODO 24, 2026-07-12) — stateless by design.
 *
 * The link's payload IS the profile (base64url JSON in a query param): the plan is a pure
 * function of the profile (invariant 4), so sharing the profile shares the roadmap — no
 * database row, no token service, works identically on web and native, and both
 * environments honor each other's links. Crafting a link by hand is equivalent to
 * answering the interview, so there is nothing to sign or forge.
 *
 * Privacy: `notes` (free text) is stripped — a share link carries facts the engine reads,
 * never prose. The share dialog warns that the link encodes interview answers.
 *
 * Trade-off, on record: links are long (~0.5–2 KB) and can't be revoked. If shares earn
 * short pretty URLs later, add a token table and keep this codec as the payload format.
 */
import type { Profile } from '@/core/interview-controller';

// Minimal UTF-8-safe base64url (no atob/btoa — identical behavior on Hermes, browsers,
// Workers, and Node/vitest).
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const REV: Record<string, number> = Object.fromEntries([...ALPHA].map((c, i) => [c, i]));

function toB64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    out += ALPHA[a >> 2] + ALPHA[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) out += ALPHA[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) out += ALPHA[c & 63];
  }
  return out;
}

function fromB64url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9\-_]*$/.test(s)) return null;
  const out: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const n = [...s.slice(i, i + 4)].map(c => REV[c]);
    if (n.some(v => v === undefined)) return null;
    out.push((n[0] << 2) | (n[1] >> 4));
    if (n.length > 2) out.push(((n[1] & 15) << 4) | (n[2] >> 2));
    if (n.length > 3) out.push(((n[2] & 3) << 6) | n[3]);
  }
  return new Uint8Array(out);
}

/** Profile → URL-safe payload. Free-text `notes` never rides a link. */
export function encodeShare(profile: Profile): string {
  const { notes: _notes, ...facts } = profile as Record<string, unknown>;
  return toB64url(new TextEncoder().encode(JSON.stringify(facts)));
}

/** Payload → profile, or null for anything malformed. Tolerant: bad input is a UX state
 *  ("ask the sender to copy the link again"), never a crash. */
export function decodeShare(d: string | undefined | null): Profile | null {
  if (!d || d.length > 16_384) return null; // sane cap: nobody's profile is 16 KB
  try {
    const bytes = fromB64url(d);
    if (!bytes) return null;
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const { notes: _notes, ...facts } = parsed as Record<string, unknown>;
    return facts as Profile;
  } catch {
    return null;
  }
}

/** The full URL to put on the clipboard / share sheet.
 *  C4 (council fix): the payload rides a `#fragment`, NOT a `?query`. A fragment is never sent
 *  to the server, so the profile (which can include exact figures like foreign_assets_eur) stays
 *  out of server logs, the browser's address-bar history sync, and messenger link-preview fetchers.
 *  /shared reads it from `location.hash`, with a `?d=` fallback for links shared before this. */
export function shareUrl(origin: string, profile: Profile): string {
  return `${origin}/shared#d=${encodeShare(profile)}`;
}
