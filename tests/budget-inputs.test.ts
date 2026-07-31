import { describe, it, expect } from 'vitest';
import { profileToBudgetInputs, resolveRegionItpPct, isSelfEmployed, isBuying } from '../core/budget-inputs';
import { buildBudget } from '../core/budget';

describe('resolveRegionItpPct — pins ITP to a verified flat rate only', () => {
  it('returns the verified flat rate for flat-rate regions', () => {
    expect(resolveRegionItpPct('andalucia')).toBe(7);
    expect(resolveRegionItpPct('madrid')).toBe(6);
    expect(resolveRegionItpPct('comunidad-valenciana')).toBe(9);
  });
  it('does NOT pin bracketed regions (returns null → engine uses the sourced range)', () => {
    expect(resolveRegionItpPct('cataluna')).toBeNull();   // 10–13% brackets
  });
  it('returns null for not_sure / unknown / non-string', () => {
    expect(resolveRegionItpPct('not_sure')).toBeNull();
    expect(resolveRegionItpPct('narnia')).toBeNull();
    expect(resolveRegionItpPct(undefined)).toBeNull();
    expect(resolveRegionItpPct(42)).toBeNull();
  });
});

describe('gate helpers', () => {
  it('isBuying is true only for owns_property_in_spain === true', () => {
    expect(isBuying({ owns_property_in_spain: true })).toBe(true);
    expect(isBuying({ owns_property_in_spain: false })).toBe(false);
    expect(isBuying({})).toBe(false);
  });
  it('isSelfEmployed covers self_employment + business_owner only', () => {
    expect(isSelfEmployed({ work_situation: 'self_employment' })).toBe(true);
    expect(isSelfEmployed({ work_situation: 'business_owner' })).toBe(true);
    expect(isSelfEmployed({ work_situation: 'employed_remote' })).toBe(false);
    expect(isSelfEmployed({})).toBe(false);
  });
});

describe('profileToBudgetInputs — maps saved profile fields, safely', () => {
  it('maps home price, region ITP, and user budgets', () => {
    const inputs = profileToBudgetInputs({
      region: 'andalucia',
      owns_property_in_spain: true,
      home_price_eur: 240_000,
      cadastral_value_eur: 120_000,
      budget_estimates: { 'scout-where-to-live': 900, 'nlv-health-insurance': 60 },
    });
    expect(inputs.homePriceEur).toBe(240_000);
    expect(inputs.cadastralValueEur).toBe(120_000);
    expect(inputs.regionItpPct).toBe(7);
    expect(inputs.userBudgets).toEqual({ 'scout-where-to-live': 900, 'nlv-health-insurance': 60 });
  });

  it('omits everything a bare profile lacks (migration-safe — no fabricated inputs)', () => {
    const inputs = profileToBudgetInputs({ nationalities: ['US'] });
    expect(inputs.homePriceEur).toBeUndefined();
    expect(inputs.cadastralValueEur).toBeUndefined();
    expect(inputs.regionItpPct).toBeUndefined();
    expect(inputs.userBudgets).toBeUndefined();
  });

  it('ignores junk values (negative / non-numeric price, array/garbage budgets)', () => {
    const inputs = profileToBudgetInputs({
      region: 'not_sure',
      home_price_eur: -5,
      cadastral_value_eur: 'lots',
      budget_estimates: ['nope'],
    });
    expect(inputs.homePriceEur).toBeUndefined();
    expect(inputs.cadastralValueEur).toBeUndefined();
    expect(inputs.regionItpPct).toBeUndefined();
    expect(inputs.userBudgets).toBeUndefined();
  });

  it('end-to-end: an Andalucía buyer profile prices ITP at the verified 7%', () => {
    const profile = { region: 'andalucia', owns_property_in_spain: true, home_price_eur: 240_000 };
    const b = buildBudget([{ id: 'property-transfer-tax', title: 'ITP' }], profileToBudgetInputs(profile));
    const itp = b.sourcedLines.find(l => l.id === 'property-transfer-tax')!;
    expect(itp.low).toBe(16_800);
    expect(itp.high).toBe(16_800);
  });
});
