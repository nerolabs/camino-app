import { describe, it, expect } from 'vitest';
import { derive, isSlotApplicable, SLOTS, type Profile } from '../core/interview-controller';
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

describe('audit A9 — the residence-visa cluster is long-stay only', () => {
  it('a short-stay American gets NO visa roadmap (and no padrón/tax cluster)', () => {
    const ids = mover({ intends_long_stay: false });
    for (const id of ['choose-visa-type', 'consulate-appointment', 'criminal-background-check',
                      'apostille-documents', 'residencia', 'nie', 'empadronamiento', 'modelo-100'])
      expect(ids.has(id), `short stay must not include ${id}`).toBe(false);
  });

  it('a short-stay non-EU PROPERTY BUYER still gets the NIE + property cluster', () => {
    const ids = mover({ intends_long_stay: false, owns_property_in_spain: true, property_purchase: '2026-11-01' });
    expect(ids.has('nie')).toBe(true);            // can't buy without it
    expect(ids.has('completion-deed-notary')).toBe(true);
    expect(ids.has('nonresident-property-tax')).toBe(true); // IRNR: owner but not tax resident
    expect(ids.has('choose-visa-type')).toBe(false); // still no residence visa
  });
});

describe('audit A10 — EU short-stay property buyers need a NIE too', () => {
  it('a German buying a holiday home gets the NIE; a Spanish national never does', () => {
    const de = mover({ nationalities: ['DE'], intends_long_stay: false,
                       owns_property_in_spain: true, property_purchase: '2026-11-01' });
    expect(de.has('nie')).toBe(true);
    const es = mover({ nationalities: ['ES'], intends_long_stay: false,
                       owns_property_in_spain: true, property_purchase: '2026-11-01' });
    expect(es.has('nie')).toBe(false); // DNI holders
  });

  it('a long-stay EU mover does NOT get a separate NIE step (EX-18 assigns it)', () => {
    expect(mover({ nationalities: ['DE'] }).has('nie')).toBe(false);
  });
});

describe('audit A12 — EU licences stay valid; mixed households keep the DGT path', () => {
  it('a pure-EU driver gets no DGT step', () => {
    const ids = mover({ nationalities: ['DE'], owns_or_drives: true });
    expect(ids.has('dgt-exchange') || ids.has('dgt-exam')).toBe(false);
  });
  it('the mixed household with a non-EU driver keeps it', () => {
    const ids = mover({ nationalities: ['US', 'ES'], owns_or_drives: true,
                        has_spouse_or_partner: true, partner_is_married: true, non_eu_family_member: true });
    expect(ids.has('dgt-exchange') || ids.has('dgt-exam')).toBe(true);
  });
});

describe('audit A14 — EU citizens naturalise by residence like everyone else', () => {
  it('a German long-stay who wants citizenship sees the 10-year track + CCSE + DELE', () => {
    const ids = mover({ nationalities: ['DE'], wants_citizenship: true });
    expect(ids.has('citizenship-track-standard')).toBe(true);
    expect(ids.has('ccse-exam')).toBe(true);
    expect(ids.has('dele-a2-exam')).toBe(true); // German isn't Spanish-speaking-national
  });
});

describe('audit B6 — corporate tax only for Spanish companies', () => {
  it('a business owner with a Spanish company files Modelo 200; a foreign-company owner does not', () => {
    const withEs = mover({ work_situation: 'business_owner', has_spanish_company: true });
    expect(withEs.has('modelo-200')).toBe(true);
    const foreign = mover({ work_situation: 'business_owner', has_spanish_company: false });
    expect(foreign.has('modelo-200')).toBe(false);
    // not_sure never earns a penalty item on a guess
    const unsure = mover({ work_situation: 'business_owner', has_spanish_company: 'not_sure' as unknown as boolean });
    expect(unsure.has('modelo-200')).toBe(false);
  });
  it('the clarifier is asked only of business owners', () => {
    const SLOT = SLOTS.find(s => s.field === 'has_spanish_company')!;
    const owner = { nationalities: ['US'], work_situation: 'business_owner', intends_long_stay: true } as Profile;
    derive(owner);
    expect(isSlotApplicable(SLOT, owner)).toBe(true);
    const retiree = { nationalities: ['US'], work_situation: 'retired', intends_long_stay: true } as Profile;
    derive(retiree);
    expect(isSlotApplicable(SLOT, retiree)).toBe(false);
  });
});

describe('income question earns its place (user-noticed, 2026-07-13)', () => {
  const INCOME = SLOTS.find(s => s.field === 'annual_income_eur_band')!;
  const applicable = (over: Partial<Profile>) => {
    const p: Profile = { nationalities: ['US'], work_situation: 'retired', intends_long_stay: true, ...over } as Profile;
    derive(p);
    return isSlotApplicable(INCOME, p);
  };
  it('asked exactly on the routes that read it (NLV, DNV)', () => {
    expect(applicable({})).toBe(true); // retired → NLV
    expect(applicable({ work_situation: 'employed_remote', employer_country_is_foreign: true })).toBe(true); // DNV
  });
  it('never asked when no route can use it', () => {
    expect(applicable({ nationalities: ['DE'] })).toBe(false);            // EU
    expect(applicable({ work_situation: 'student' })).toBe(false);        // student route
    expect(applicable({ work_situation: 'job_seeker' })).toBe(false);     // no route (A2)
    expect(applicable({ work_situation: 'business_owner' })).toBe(false); // self-employment route
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
