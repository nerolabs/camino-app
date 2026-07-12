import { describe, it, expect } from 'vitest';
import { derive, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

// Regressions from the 2026-07-12 engine audit (docs/audits/2026-07-12-engine-audit.md).
// The class-level rules live in scripts/audit-matrix.ts (177 profiles); these pin the
// specific findings so a future condition edit can't silently reintroduce them.

const mover = (over: Partial<Profile>): Set<string> => {
  const p: Profile = {
    speaks_spanish: 'A little', nationalities: ['US'], work_situation: 'retired',
    annual_income_eur_band: '€34k–€60k', intends_long_stay: true, arrival_date: '2027-03-01',
    has_spanish_address: false, region: 'not_sure', owns_or_drives: false, has_pets: false,
    owns_property_in_spain: false, foreign_assets_eur_band: 'under €50k',
    previously_ex_spanish_colony_nationality: false, wants_citizenship: false,
    has_spouse_or_partner: false, has_children: false,
    ...over,
  } as Profile;
  derive(p);
  return new Set(buildPlan(p).map(o => o.id));
};

describe('audit A1 — padrón/health card: applicability is long-stay, timing is the address', () => {
  it('a long-stay mover WITHOUT an address still gets empadronamiento (+ downstream firming)', () => {
    const ids = mover({});
    expect(ids.has('empadronamiento')).toBe(true);
  });

  it('the health card follows long-stay (with the NLV private-cover carve-out intact)', () => {
    expect(mover({ work_situation: 'employed_remote', employer_country_is_foreign: true }).has('tarjeta-sanitaria')).toBe(true); // DNV
    expect(mover({}).has('tarjeta-sanitaria')).toBe(false); // NLV keeps private insurance
  });

  it('short-stay EU carries NO required steps — no padrón, no card, no tax cluster (advisories may remain)', () => {
    const p: Profile = {
      speaks_spanish: 'A little', nationalities: ['DE'], work_situation: 'employed_remote',
      employer_country_is_foreign: true, intends_long_stay: false, has_spanish_address: true,
      arrival_date: '2027-03-01', region: 'not_sure', owns_or_drives: false, has_pets: false,
      owns_property_in_spain: false, foreign_assets_eur_band: 'under €50k',
      annual_income_eur_band: '€34k–€60k', previously_ex_spanish_colony_nationality: false,
      wants_citizenship: false, has_spouse_or_partner: false, has_children: false,
    } as Profile;
    derive(p);
    const plan = buildPlan(p);
    for (const id of ['empadronamiento', 'tarjeta-sanitaria', 'modelo-100', 'modelo-030'])
      expect(plan.some(o => o.id === id), `short stay must not require ${id}`).toBe(false);
    for (const o of plan) expect(o.source, `${o.id} should be advisory for a short stay`).toBe('recommendation');
  });
});

describe('audit A2 — job seekers are never routed to the "no work" visa', () => {
  it('job_seeker derives no visa_type and gets NO NLV-cluster steps', () => {
    const p: Profile = { nationalities: ['US'], work_situation: 'job_seeker', intends_long_stay: true } as Profile;
    derive(p);
    expect((p as Record<string, unknown>).visa_type).toBeNull();
    const ids = mover({ work_situation: 'job_seeker' });
    expect([...ids].some(i => i.startsWith('nlv-'))).toBe(false);
    expect(ids.has('choose-visa-type')).toBe(true); // the honest generic entry point stays
  });
});
