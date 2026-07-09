/**
 * language-classes advisory gating (interview redesign, Phase 1 — see docs/INTERVIEW-REDESIGN.md).
 * The speaks_spanish opener pays off: low Spanish → a "start learning" step; fluent → none.
 * Advisory-only — it never touches the passport-based DELE exemption (see engine.test.ts).
 */
import { describe, it, expect } from 'vitest';
import { buildPlan } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';

function planIds(answers: Profile): Set<string> {
  const p = { ...answers };
  derive(p);
  return new Set(buildPlan(p).map(o => o.id));
}

// A minimal profile that yields a real plan; only speaks_spanish varies across the cases.
const base: Profile = {
  nationalities: ['US'], work_situation: 'retired', intends_long_stay: true,
  arrival_date: '2026-09-01', has_spanish_address: true, annual_income_eur_band: '€34k–€60k',
};

describe('language-classes advisory', () => {
  it('applies when Spanish is "None yet" or "A little"', () => {
    expect(planIds({ ...base, speaks_spanish: 'None yet' })).toContain('language-classes');
    expect(planIds({ ...base, speaks_spanish: 'A little' })).toContain('language-classes');
  });

  it('does not apply for "Conversational" or "Fluent or native"', () => {
    expect(planIds({ ...base, speaks_spanish: 'Conversational' })).not.toContain('language-classes');
    expect(planIds({ ...base, speaks_spanish: 'Fluent or native' })).not.toContain('language-classes');
  });

  it('does not apply when the Spanish level is unknown (unanswered)', () => {
    expect(planIds(base)).not.toContain('language-classes');
  });
});
