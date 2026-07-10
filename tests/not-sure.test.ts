/**
 * "Not sure yet" on uncertainty-prone yes/no questions (user finding 2026-07-10).
 * The sentinel 'not_sure' fails BOTH eq:true and eq:false gates: uncertain answers add nothing
 * to the roadmap, gated follow-ups stay unasked, and the interview still completes.
 */
import { describe, it, expect } from 'vitest';
import { buildPlan } from '../core/engine-controller';
import { SLOTS, nextSlot, derive, type Profile } from '../core/interview-controller';

const base: Profile = {
  arrival_date: '2027-01-15', speaks_spanish: 'A little', nationalities: ['US'],
  work_situation: 'retired', intends_long_stay: true, annual_income_eur_band: '€60k+',
  has_spouse_or_partner: false, has_children: false, has_spanish_address: true,
  region: 'not_sure', owns_or_drives: false, has_pets: false,
  foreign_assets_eur_band: 'under €50k', previously_ex_spanish_colony_nationality: false,
  wants_citizenship: false,
};

describe('not_sure sentinel', () => {
  it('only uncertainty-prone yes/no slots offer it', () => {
    const allowed = SLOTS.filter(s => s.allowNotSure).map(s => s.field).sort();
    expect(allowed).toEqual(['has_pets', 'has_spanish_address', 'intends_long_stay',
      'owns_or_drives', 'owns_property_in_spain', 'wants_citizenship'].sort());
    // hard forks / knowable facts never offer it
    for (const f of ['employer_country_is_foreign', 'has_children', 'partner_is_married'])
      expect(SLOTS.find(s => s.field === f)?.allowNotSure).toBeFalsy();
  });

  it('not_sure on property: no property cluster, and the purchase-date follow-up is never asked', () => {
    const sure: Profile = { ...base, owns_property_in_spain: true, property_purchase: '2027-03-01' };
    derive(sure);
    expect(new Set(buildPlan(sure).map(o => o.id))).toContain('completion-deed-notary');

    const unsure: Profile = { ...base, owns_property_in_spain: 'not_sure' };
    derive(unsure);
    const ids = new Set(buildPlan(unsure).map(o => o.id));
    expect(ids).not.toContain('completion-deed-notary');
    expect(ids).not.toContain('property-transfer-tax');
    expect(nextSlot(unsure)).toBeNull(); // property_purchase (gated on eq:true) is not asked
  });

  it('not_sure counts as answered — the interview still completes', () => {
    const p: Profile = { ...base, owns_property_in_spain: 'not_sure', has_pets: 'not_sure',
      owns_or_drives: 'not_sure' };
    derive(p);
    expect(nextSlot(p)).toBeNull();
    const ids = new Set(buildPlan(p).map(o => o.id));
    expect(ids).not.toContain('pet-import');
    expect(ids).not.toContain('dgt-exchange');
  });
});
