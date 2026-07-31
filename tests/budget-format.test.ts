import { describe, it, expect } from 'vitest';
import { formatEur, formatRange, lineCostDisplay, budgetHeadline } from '../lib/budgetFormat';
import { buildBudget } from '../core/budget';
import type { BudgetLine } from '../core/budget';

describe('formatEur', () => {
  it('keeps cents on small statutory fees, groups thousands, drops cents on round sums', () => {
    expect(formatEur(16.08)).toBe('€16.08');
    expect(formatEur(9.84)).toBe('€9.84');
    expect(formatEur(16_800)).toBe('€16,800');
    expect(formatEur(25.92)).toBe('€25.92');
    expect(formatEur(0)).toBe('€0');
    expect(formatEur(1_146)).toBe('€1,146');
  });
});

describe('formatRange', () => {
  it('collapses to one figure when pinned, else shows a range', () => {
    expect(formatRange(16_800, 16_800)).toBe('€16,800');
    expect(formatRange(14_400, 31_200)).toBe('€14,400–€31,200');
  });
});

describe('lineCostDisplay', () => {
  const base: BudgetLine = {
    id: 'x', title: 'x', kind: 'soft', display: '6–13% of price',
    low: null, high: null, recurring: null, sourced: true, verified: false, confidence: 'med',
  };
  it('shows the computed euro when present, else the honest display string', () => {
    expect(lineCostDisplay({ ...base, low: 16_800, high: 16_800 })).toBe('€16,800');
    expect(lineCostDisplay(base)).toBe('6–13% of price');            // uncomputed soft
    expect(lineCostDisplay({ ...base, kind: 'personal', display: 'your call' })).toBe('your call');
  });
});

describe('budgetHeadline', () => {
  it('summarizes an Andalucía-buyer plan: sourced range + firm portion + no stray recurring', () => {
    const b = buildBudget(
      [{ id: 'residencia', title: 't' }, { id: 'nie', title: 't' }, { id: 'property-transfer-tax', title: 't' }],
      { homePriceEur: 240_000, regionItpPct: 7 },
    );
    const h = budgetHeadline(b);
    expect(h.firm).toBe('€25.92');            // TIE + NIE (small → cents kept)
    expect(h.total).toBe('€16,826');          // 25.92 + pinned ITP 16,800, rounded whole on a large sum
    expect(h.hasRange).toBe(false);           // everything pinned/firm
    expect(h.monthly).toBeNull();
    expect(h.annual).toBeNull();
  });

  it('surfaces recurring buckets when present', () => {
    const b = buildBudget(
      [{ id: 'convenio-especial', title: 't' }, { id: 'ibi-property-tax', title: 't' }],
      { cadastralValueEur: 120_000 },
    );
    const h = budgetHeadline(b);
    expect(h.monthly).toBe('€60');                 // convenio
    expect(h.annual).toBe('€480–€1,320');          // IBI 0.4–1.1%
  });
});
