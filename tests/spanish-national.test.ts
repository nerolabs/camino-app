import { describe, it, expect } from 'vitest';
import { derive, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

// Build-37 shred regression (2026-07-12, found by Cristina's dual-citizen profile): a
// Spanish passport holder was offered "Register in the Central Register of FOREIGN
// Nationals" (EX-18). A Spanish national is not a foreign national — the step's own title
// said so; the condition now enforces it via the is_spanish_national derivation.

const base: Profile = {
  arrival_date: '2027-03-01', speaks_spanish: 'Fluent or native',
  work_situation: 'student', intends_long_stay: true,
} as unknown as Profile;

const planIds = (nationalities: string[]) => {
  const p = { ...base, nationalities } as Profile;
  derive(p);
  return new Set(buildPlan(p).map(o => o.id));
};

describe('Spanish nationals vs the EU foreigner registration', () => {
  it('a dual US/ES citizen does NOT get the foreign-national registration', () => {
    const ids = planIds(['US', 'ES']);
    expect(ids.has('eu-registration-certificate')).toBe(false);
    // ...and, as an EU citizen, no visa cluster either
    expect(ids.has('choose-visa-type')).toBe(false);
    expect(ids.has('nie')).toBe(false); // Spanish citizens carry a DNI, not a NIE
  });

  it('a non-Spanish EU citizen still gets it (the fix must not over-remove)', () => {
    const ids = planIds(['DE']);
    expect(ids.has('eu-registration-certificate')).toBe(true);
  });

  it('mixed household: the non-EU family member gets the EX-19 family card', () => {
    // The user's own household shape (build-37 shred): Spanish + American passports,
    // married couple → the American spouse needs the tarjeta de familiar.
    const p = { ...base, nationalities: ['US', 'ES'], has_spouse_or_partner: true,
                partner_is_married: true, non_eu_family_member: true } as Profile;
    derive(p);
    const ids = new Set(buildPlan(p).map(o => o.id));
    expect(ids.has('eu-family-member-card')).toBe(true);
    expect(ids.has('eu-registration-certificate')).toBe(false); // still not for the Spanish spouse
  });

  it('solo dual citizen: mixed passports but nobody needs the card', () => {
    const p = { ...base, nationalities: ['US', 'ES'], has_spouse_or_partner: false,
                non_eu_family_member: false } as Profile;
    derive(p);
    expect(new Set(buildPlan(p).map(o => o.id)).has('eu-family-member-card')).toBe(false);
  });

  it('DE + US couple: BOTH registrations — EX-18 for the German, EX-19 for the American', () => {
    const p = { ...base, nationalities: ['DE', 'US'], has_spouse_or_partner: true,
                partner_is_married: true, non_eu_family_member: true } as Profile;
    derive(p);
    const ids = new Set(buildPlan(p).map(o => o.id));
    expect(ids.has('eu-registration-certificate')).toBe(true);
    expect(ids.has('eu-family-member-card')).toBe(true);
  });

  it('derivation: is_spanish_national is passport-based', () => {
    const es = { ...base, nationalities: ['US', 'ES'] } as Profile;
    derive(es);
    expect((es as Record<string, unknown>).is_spanish_national).toBe(true);
    const de = { ...base, nationalities: ['DE'] } as Profile;
    derive(de);
    expect((de as Record<string, unknown>).is_spanish_national).toBe(false);
  });
});
