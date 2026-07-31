import { describe, it, expect } from 'vitest';
import {
  taxResidencyFirstYear, daysLeftInArrivalYear, schoolWindowRisk, simulateArrival, compareArrivals,
} from '../core/timeline';
import { derive } from '../core/interview-controller';

// A derived long-stay non-EU family profile — the shape buildPlan expects.
function baseProfile(extra: Record<string, unknown> = {}) {
  const p: Record<string, unknown> = {
    nationalities: ['US'], intends_long_stay: true, work_situation: 'retired',
    annual_income_eur_band: '€60k+', has_spouse_or_partner: false, has_children: true,
    has_spanish_address: false, owns_or_drives: true, wants_citizenship: false, ...extra,
  };
  derive(p);
  return p;
}

describe('taxResidencyFirstYear — the 183-day pivot', () => {
  it('arriving with ≥183 days left → resident that year; fewer → next year', () => {
    expect(taxResidencyFirstYear('2027-03-01')).toBe(2027);
    expect(taxResidencyFirstYear('2027-09-01')).toBe(2028);
  });
  it('pins the exact pivot: 2 July in a non-leap year', () => {
    expect(daysLeftInArrivalYear('2027-07-02')).toBe(183);
    expect(taxResidencyFirstYear('2027-07-02')).toBe(2027);
    expect(taxResidencyFirstYear('2027-07-03')).toBe(2028);
  });
  it('shifts the pivot by a day in a leap year (2028)', () => {
    expect(taxResidencyFirstYear('2028-07-02')).toBe(2028); // 183 days left
    expect(taxResidencyFirstYear('2028-07-03')).toBe(2029); // 182 days left
  });
});

describe('schoolWindowRisk — a flag, never a fabricated date', () => {
  it('spring arrival is the ordinary window; off-season is off-cycle', () => {
    expect(schoolWindowRisk('2027-04-15')).toBe('ordinary');
    expect(schoolWindowRisk('2027-09-01')).toBe('off_cycle');
    expect(schoolWindowRisk('2027-01-10')).toBe('off_cycle');
  });
});

describe('simulateArrival — re-runs the real engine, arrival shifted', () => {
  it('produces the tax year, a sorted milestone list, and the school flag when kids are present', () => {
    const s = simulateArrival(baseProfile(), '2027-09-01');
    expect(s.taxYear).toBe(2028);
    expect(s.schoolRisk).toBe('off_cycle');
    // arrival + the day-183 marker are always present
    expect(s.milestones.find(m => m.key === 'arrival')).toBeTruthy();
    const taxDay = s.milestones.find(m => m.key === 'tax_resident')!;
    expect(taxDay.due.getFullYear()).toBe(2028); // 2027-09-01 + 182d lands in 2028
    // milestones are sorted ascending by due date
    const dues = s.milestones.map(m => m.due.getTime());
    expect(dues).toEqual([...dues].sort((a, b) => a - b));
  });

  it('has no school flag when there are no children in the plan', () => {
    const s = simulateArrival(baseProfile({ has_children: false }), '2027-09-01');
    expect(s.schoolRisk).toBeNull();
    expect(s.milestones.some(m => m.key === 'school')).toBe(false);
  });

  it('the same profile lands a different tax year for a spring vs autumn arrival', () => {
    const p = baseProfile();
    expect(simulateArrival(p, '2027-03-01').taxYear).toBe(2027);
    expect(simulateArrival(p, '2027-09-01').taxYear).toBe(2028);
  });
});

describe('compareArrivals — the pivot detector', () => {
  it('flags a tax-year pivot when candidates straddle early July', () => {
    const c = compareArrivals(baseProfile(), ['2027-03-01', '2027-09-01']);
    expect(c.taxYearPivot).toBe(true);
    expect(c.scenarios).toHaveLength(2);
  });
  it('no pivot when all candidates share a tax year', () => {
    const c = compareArrivals(baseProfile(), ['2027-03-01', '2027-04-01', '2027-05-01']);
    expect(c.taxYearPivot).toBe(false);
  });
});
