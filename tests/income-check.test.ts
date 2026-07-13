/**
 * Income-vs-threshold advisories (2026-07-10 interview audit: the income question previously
 * gated nothing). Conservative by design: they fire only when even the TOP of the income band
 * is below the household's threshold, so borderline bands are never scare-mongered.
 */
import { describe, it, expect } from 'vitest';
import { buildPlan } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';

function planIds(answers: Profile): Set<string> {
  const p = { ...answers };
  derive(p);
  return new Set(buildPlan(p).map(o => o.id));
}

const nlvBase: Profile = {
  nationalities: ['US'], work_situation: 'retired', intends_long_stay: true,
  arrival_date: '2026-09-01', has_spanish_address: true, speaks_spanish: 'A little',
};

describe('income threshold checks', () => {
  it('NLV: fires when even the band top is below the household threshold', () => {
    // couple + child → threshold 28,800 + 2×7,200 = 43,200; band top 34k < 43,200 → warn
    const ids = planIds({ ...nlvBase, has_spouse_or_partner: true, partner_is_married: true,
      has_children: true, annual_income_eur_band: '€28k–€34k' });
    expect(ids).toContain('nlv-income-check');
  });

  it('NLV: silent when the band could reach the threshold (borderline is not a warning)', () => {
    // single → threshold 28,800; band €20k–€28k top is 28k < 28.8k → still warns…
    expect(planIds({ ...nlvBase, has_spouse_or_partner: false, has_children: false,
      annual_income_eur_band: '€20k–€28k' })).toContain('nlv-income-check');
    // …but €28k–€34k (top 34k ≥ 28.8k) does not, and €60k+ never does
    expect(planIds({ ...nlvBase, has_spouse_or_partner: false, has_children: false,
      annual_income_eur_band: '€28k–€34k' })).not.toContain('nlv-income-check');
    expect(planIds({ ...nlvBase, has_spouse_or_partner: false, has_children: false,
      annual_income_eur_band: '€60k+' })).not.toContain('nlv-income-check');
  });

  it('C7: the real dependent count raises the threshold — a big family is no longer understated', () => {
    const bigFamily: Profile = { ...nlvBase, has_spouse_or_partner: true, partner_is_married: true, has_children: true };
    // couple + 4 kids → threshold 28,800 + 5×7,200 = 64,800; band top 60k < 64,800 → warns
    expect(planIds({ ...bigFamily, children_count: '4+', annual_income_eur_band: '€34k–€60k' }))
      .toContain('nlv-income-check');
    // the SAME household without a count falls back to 1 dependent → threshold 43,200; 60k clears
    // it → no warning. That gap (silent for a big family) is exactly what C7 closes.
    expect(planIds({ ...bigFamily, annual_income_eur_band: '€34k–€60k' }))
      .not.toContain('nlv-income-check');
  });

  it('DNV: fires below the remote-income threshold, silent above', () => {
    const dnvBase: Profile = { ...nlvBase, work_situation: 'employed_remote', employer_country_is_foreign: true };
    // single → threshold 34,000; band top 28k < 34k → warn
    expect(planIds({ ...dnvBase, has_spouse_or_partner: false, has_children: false,
      annual_income_eur_band: '€20k–€28k' })).toContain('dnv-income-check');
    expect(planIds({ ...dnvBase, has_spouse_or_partner: false, has_children: false,
      annual_income_eur_band: '€34k–€60k' })).not.toContain('dnv-income-check');
  });

  it('silent when income is unanswered (no derivation, no gate)', () => {
    expect(planIds({ ...nlvBase, has_spouse_or_partner: false, has_children: false }))
      .not.toContain('nlv-income-check');
  });
});
