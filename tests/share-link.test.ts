import { describe, it, expect } from 'vitest';
import { encodeShare, decodeShare, shareUrl } from '../lib/shareLink';
import { derive, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

// The share link is stateless: payload = profile (invariant 4 made literal). Pin the
// codec contract — lossless roundtrip for facts, notes never ride, junk never throws.

const PROFILE: Profile = {
  nationalities: ['US', 'CA'],
  arrival_date: '2027-01-15',
  work_situation: 'remote_employee',
  has_pets: true,
  region: 'andalucia',
  income_band: 'b40_60k',
  progress: { empadronamiento: { state: 'done', completedOn: '2026-05-01' } },
} as unknown as Profile;

describe('share link codec', () => {
  it('roundtrips a profile losslessly (including progress) and the plan matches', () => {
    const decoded = decodeShare(encodeShare(PROFILE))!;
    expect(decoded).toEqual(PROFILE);
    const a = { ...PROFILE }; derive(a);
    const b = { ...decoded }; derive(b);
    expect(buildPlan(b).map(o => o.id)).toEqual(buildPlan(a).map(o => o.id));
  });

  it('strips free-text notes on encode AND on decode (defense in depth)', () => {
    const withNotes = { ...PROFILE, notes: 'our dog Luna, and my mother visits often' } as Profile;
    expect(decodeShare(encodeShare(withNotes))).toEqual(PROFILE);
    // A hand-crafted payload that smuggles notes in still loses them on decode.
    const smuggled = encodeShare(PROFILE).length && (() => {
      const raw = JSON.stringify({ ...PROFILE, notes: 'smuggled' });
      const bytes = new TextEncoder().encode(raw);
      // re-encode through the public API by decoding a manual base64url of the raw JSON
      const b64 = Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return b64;
    })();
    expect(decodeShare(smuggled as string)).toEqual(PROFILE);
  });

  it('survives unicode values', () => {
    const p = { ...PROFILE, region: 'andalucia', partner_name: 'Señora Müller — Cádiz' } as unknown as Profile;
    expect(decodeShare(encodeShare(p))).toEqual(p);
  });

  it('junk is a null, never a throw', () => {
    for (const bad of [undefined, null, '', '!!!', 'not-base64url??', 'AAAA', encodeShare(PROFILE).slice(0, 10), 'x'.repeat(20_000)]) {
      expect(() => decodeShare(bad as string)).not.toThrow();
      expect(decodeShare(bad as string)).toBeNull();
    }
    // arrays and scalars are not profiles
    const arr = Buffer.from(JSON.stringify([1, 2])).toString('base64url');
    expect(decodeShare(arr)).toBeNull();
  });

  it('shareUrl points at /shared with the payload in the # fragment (C4 — never sent to the server)', () => {
    const url = shareUrl('https://getcamino.app', PROFILE);
    expect(url.startsWith('https://getcamino.app/shared#d=')).toBe(true);
    expect(new URL(url).search).toBe(''); // nothing in the query string
    const hash = new URL(url).hash.replace(/^#/, '');
    expect(decodeShare(new URLSearchParams(hash).get('d'))).toEqual(PROFILE);
  });
});
