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
  it('needs MORE than 183 days present (≥184 left) → that year; otherwise next year', () => {
    expect(taxResidencyFirstYear('2027-03-01')).toBe(2027);
    expect(taxResidencyFirstYear('2027-09-01')).toBe(2028);
  });
  // The rule is >183 days (LIRPF art. 9), so exactly 183 days present is NOT enough. 1 July is the
  // last arrival that leaves 184 days; 2 July leaves 183 → next year. (Regression: was off by one —
  // the old `>=183` wrongly made a 2 July arrival resident on exactly 183 days.)
  it('pins the exact pivot: 1 July qualifies, 2 July does not (non-leap)', () => {
    expect(daysLeftInArrivalYear('2027-07-01')).toBe(184);
    expect(taxResidencyFirstYear('2027-07-01')).toBe(2027);
    expect(daysLeftInArrivalYear('2027-07-02')).toBe(183); // exactly 183 — not MORE than 183
    expect(taxResidencyFirstYear('2027-07-02')).toBe(2028);
  });
  it('holds the same 1 July pivot in a leap year (2028 — the leap day is before July)', () => {
    expect(taxResidencyFirstYear('2028-07-01')).toBe(2028); // 184 days left
    expect(taxResidencyFirstYear('2028-07-02')).toBe(2029); // 183 days left → next year
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

  // Regression (2026-07-31 review): milestone dates are built as UTC midnight (new Date('YYYY-MM-DD'))
  // and the view formats them with timeZone:'UTC'. This pins the construction so the day rendered is
  // exactly the picked day — the old mix (UTC-built dates through a local formatter) showed a 1 Jul
  // arrival as "Jun 30" for any viewer west of Greenwich, contradicting the tax card on the same screen.
  it('milestone dates carry the picked calendar day in UTC — no off-by-one drift', () => {
    const s = simulateArrival(baseProfile(), '2027-07-01');
    const arrival = s.milestones.find(m => m.key === 'arrival')!;
    expect(arrival.due.getUTCFullYear()).toBe(2027);
    expect(arrival.due.getUTCMonth()).toBe(6); // July, 0-indexed
    expect(arrival.due.getUTCDate()).toBe(1);
    const tax = s.milestones.find(m => m.key === 'tax_resident')!;
    expect(Math.round((tax.due.getTime() - arrival.due.getTime()) / 86_400_000)).toBe(182);
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
