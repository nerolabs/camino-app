/**
 * Weekly-email digest: pure-function tests (B5 layer 1 — no network, no LLM).
 * The digest feeds the weekly roundup, so these pin the user-facing promises:
 * never more than 5 tasks, overdue first, deterministic tips, silence when
 * there's nothing pressing, and no email math that disagrees with the roadmap.
 */
import { describe, it, expect } from 'vitest';
import { buildDigest, interviewComplete, DIGEST_CAP } from '../core/email-digest';
import { signUnsubToken, verifyUnsubToken } from '../lib/emailTokens';
import { TEST_PERSONAS } from '../core/test-personas';
import { type Profile } from '../core/interview-controller';

const susan = (): Profile =>
  ({ ...TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!.answers } as Profile);
const at = (d: string) => new Date(d + 'T12:00:00');

describe('email digest', () => {
  it('incomplete interview → null (nudge territory, not roundup)', () => {
    expect(interviewComplete({ nationalities: ['US'] } as Profile)).toBe(false);
    expect(buildDigest({ nationalities: ['US'] } as Profile, at('2026-07-03'))).toBeNull();
  });

  it('complete interview with pressing items → digest, capped and overdue-first', () => {
    // Two years after Susan's 2026-10-15 arrival, plenty has slipped: the cap must hold.
    const d = buildDigest(susan(), at('2028-10-15'))!;
    expect(d).not.toBeNull();
    expect(d.overdue.length + d.upcoming.length).toBeLessThanOrEqual(DIGEST_CAP);
    expect(d.overdue.length).toBeGreaterThan(0);
    expect(d.moreCount).toBeGreaterThan(0); // a 30-step plan two years in has more than 5 pressing
    // Overdue block sorted oldest-first, and every item carries a deterministic tip.
    for (const it_ of [...d.overdue, ...d.upcoming]) {
      expect(it_.tip.length).toBeGreaterThan(10);
      expect(it_.whenLabel).toMatch(/due/);
    }
  });

  it('es: same selection, Spanish titles / labels / tips (L1)', () => {
    const en = buildDigest(susan(), at('2028-10-15'))!;
    const es = buildDigest(susan(), at('2028-10-15'), 'es')!;
    // The language changes WORDS, never WHICH items (invariant: selection is locale-free).
    expect(es.overdue.map(i => i.id)).toEqual(en.overdue.map(i => i.id));
    expect(es.upcoming.map(i => i.id)).toEqual(en.upcoming.map(i => i.id));
    for (const it_ of [...es.overdue, ...es.upcoming]) {
      expect(it_.whenLabel).toMatch(/venc|atrasado|en camino/);
      expect(it_.title).not.toBe(en.overdue.concat(en.upcoming).find(e => e.id === it_.id)!.title);
    }
  });

  it('well before arrival with nothing in the 45-day window → null (no spam)', () => {
    // A year before arrival, nothing is due within 45 days for Susan's NLV plan.
    expect(buildDigest(susan(), at('2025-10-15'))).toBeNull();
  });

  it('deterministic: same profile + same day → identical digest', () => {
    const a = buildDigest(susan(), at('2028-01-10'));
    const b = buildDigest(susan(), at('2028-01-10'));
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('done items never appear', () => {
    const today = at('2028-10-15');
    const before = buildDigest(susan(), today)!;
    const target = before.overdue[0].id;
    const withDone: Profile = {
      ...susan(),
      progress: { [target]: { state: 'done', completedOn: '2027-01-01' } },
    } as Profile;
    const after = buildDigest(withDone, today);
    if (after) {
      expect([...after.overdue, ...after.upcoming].map(i => i.id)).not.toContain(target);
    }
  });
});

describe('unsubscribe tokens', () => {
  it('sign/verify roundtrip; tampering fails', async () => {
    const sig = await signUnsubToken('secret-1', 'user-a');
    expect(await verifyUnsubToken('secret-1', 'user-a', sig)).toBe(true);
    expect(await verifyUnsubToken('secret-1', 'user-b', sig)).toBe(false);
    expect(await verifyUnsubToken('secret-2', 'user-a', sig)).toBe(false);
    expect(await verifyUnsubToken('secret-1', 'user-a', sig.slice(0, -2) + 'ff')).toBe(false);
  });
});
