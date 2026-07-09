/**
 * Weighted interview completeness (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 * Locks the roadmap-anchored "% complete" that replaces the raw question counter.
 */
import { describe, it, expect } from 'vitest';
import { derive, SLOTS, type Profile } from '../core/interview-controller';
import { SLOT_WEIGHT, interviewCompleteness } from '../core/completeness';
import { TEST_PERSONAS } from '../core/test-personas';

describe('SLOT_WEIGHT', () => {
  it('gives every slot at least the floor of 1', () => {
    for (const s of SLOTS) expect(SLOT_WEIGHT[s.field]).toBeGreaterThanOrEqual(1);
  });

  it('weights high-leverage questions above trivia', () => {
    // nationalities → is_eu → visa_type, and work_situation → visa_type, gate large swaths of
    // the catalog; has_pets gates at most the pet-import step.
    expect(SLOT_WEIGHT['nationalities']).toBeGreaterThan(SLOT_WEIGHT['has_pets']);
    expect(SLOT_WEIGHT['work_situation']).toBeGreaterThan(SLOT_WEIGHT['has_pets']);
    expect(SLOT_WEIGHT['intends_long_stay']).toBeGreaterThan(SLOT_WEIGHT['has_pets']);
  });
});

describe('interviewCompleteness', () => {
  it('is 0 for an empty profile and 1 for a fully answered one', () => {
    expect(interviewCompleteness({}).pct).toBe(0);
    expect(interviewCompleteness({}).answeredWeight).toBe(0);

    const persona = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!;
    const full: Profile = { ...persona.answers };
    derive(full);
    const c = interviewCompleteness(full);
    expect(c.remaining).toBe(0);
    expect(c.pct).toBe(1);
  });

  it('answeredWeight only ever grows as answers are added (monotonic)', () => {
    // Raw pct is intentionally NOT monotonic (opening a heavier branch can dip it — that's why
    // the UI clamps). But an answered slot is always applicable, so answeredWeight can only rise.
    const persona = TEST_PERSONAS.find(p => p.name.startsWith('Sofia'))!;
    const p: Profile = {};
    let prev = 0;
    for (const [field, value] of Object.entries(persona.answers)) {
      p[field] = value;
      derive(p);
      const w = interviewCompleteness(p).answeredWeight;
      expect(w).toBeGreaterThanOrEqual(prev);
      prev = w;
    }
    expect(prev).toBeGreaterThan(0);
  });

  it('a partial profile sits strictly between empty and full', () => {
    const persona = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!;
    const partial: Profile = { nationalities: persona.answers.nationalities };
    derive(partial);
    const pct = interviewCompleteness(partial).pct;
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(1);
  });
});
