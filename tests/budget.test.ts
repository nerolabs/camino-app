import { describe, it, expect } from 'vitest';
import { buildBudget, priceLine } from '../core/budget';
import { OBLIGATION_COSTS } from '../core/obligation-costs';
import { CATALOG } from '../core/engine-controller';

// Minimal plan rows — the budget engine only needs {id, title}.
const row = (id: string) => ({ id, title: id });

describe('buildBudget — the sourced (firm + soft) spine', () => {
  it('sums firm fees exactly into the one-time move cost', () => {
    const b = buildBudget([row('residencia'), row('nie')]);
    expect(b.moveCost.firm).toBe(25.92);      // 16.08 + 9.84
    expect(b.moveCost.low).toBe(25.92);
    expect(b.moveCost.high).toBe(25.92);
  });

  it('prices a soft cost as a RANGE from the user home price, and pins it with a region rate', () => {
    const range = buildBudget([row('property-transfer-tax')], { homePriceEur: 240_000 });
    const itp = range.sourcedLines.find(l => l.id === 'property-transfer-tax')!;
    expect(itp.low).toBe(14_400);   // 6%
    expect(itp.high).toBe(31_200);  // 13%

    const pinned = buildBudget([row('property-transfer-tax')], { homePriceEur: 240_000, regionItpPct: 7 });
    const itp2 = pinned.sourcedLines.find(l => l.id === 'property-transfer-tax')!;
    expect(itp2.low).toBe(16_800);
    expect(itp2.high).toBe(16_800);
  });

  it('leaves a soft cost uncomputed (no fabricated euro) when the user base is missing', () => {
    const b = buildBudget([row('property-transfer-tax')]); // no homePriceEur
    const itp = b.sourcedLines.find(l => l.id === 'property-transfer-tax')!;
    expect(itp.low).toBeNull();
    expect(itp.high).toBeNull();
    expect(itp.display).toBe('6–13% of price'); // still shown on the line
    expect(b.moveCost.high).toBe(0);            // excluded from the total
  });
});

describe('buildBudget — recurring vs one-time bucketing', () => {
  it('keeps monthly/annual obligations out of the one-time move headline', () => {
    const b = buildBudget([row('residencia'), row('convenio-especial'), row('ibi-property-tax')], { cadastralValueEur: 120_000 });
    expect(b.moveCost.low).toBe(16.08);            // only the TIE card
    expect(b.monthly.low).toBe(60);                // convenio especial €60/mo
    expect(b.annual.low).toBe(480);                // IBI 0.4% of 120k
    expect(b.annual.high).toBe(1_320);             // IBI 1.1% of 120k
  });
});

describe('buildBudget — personal layer stays the user’s', () => {
  it('never sums personal items into the sourced total; carries the user’s own figure', () => {
    const b = buildBudget(
      [row('scout-where-to-live'), row('nlv-health-insurance')],
      { userBudgets: { 'scout-where-to-live': 900, 'nlv-health-insurance': 60 } },
    );
    expect(b.moveCost.high).toBe(0);               // nothing sourced
    expect(b.personal.lines.every(l => !l.sourced && l.low === null)).toBe(true);
    expect(b.personal.userOneTime).toBe(900);      // scouting is one-time
    expect(b.personal.userMonthly).toBe(60);       // insurance is monthly
  });

  it('offers a typical band only where one exists (Flavor B), none for a scouting trip (Flavor A)', () => {
    const scout = priceLine('scout-where-to-live', 'x', {})!;
    const ins = priceLine('nlv-health-insurance', 'x', {})!;
    expect(scout.typicalEur).toBeUndefined();
    expect(ins.typicalEur).toEqual([46, 74]);
  });
});

describe('buildBudget — free (no-cost) steps', () => {
  it('collects steps with no cost entry as free, not €0 lines', () => {
    const b = buildBudget([row('empadronamiento'), row('digital-certificate'), row('residencia')]);
    expect(b.free.count).toBe(2);
    expect(b.free.ids).toContain('empadronamiento');
    expect(b.sourcedLines).toHaveLength(1);        // only residencia is priced
  });
});

describe('OBLIGATION_COSTS — registry integrity', () => {
  const entries = Object.entries(OBLIGATION_COSTS);

  it('every cost id is a real obligation in the catalog (no orphans/typos)', () => {
    const ids = new Set(CATALOG.map(o => o.id));
    const orphans = entries.filter(([id]) => !ids.has(id)).map(([id]) => id);
    expect(orphans).toEqual([]);
  });

  it('firm entries carry an exact euro + official source + verified_at', () => {
    for (const [id, c] of entries.filter(([, c]) => c.kind === 'firm')) {
      expect(typeof c.eur, id).toBe('number');
      expect(c.source_url, id).toBeTruthy();
      expect(c.verified_at, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('soft entries carry a base + a rate + a source', () => {
    for (const [id, c] of entries.filter(([, c]) => c.kind === 'soft')) {
      expect(c.base, id).toBeTruthy();
      expect(c.pct != null || c.pctRange != null, id).toBe(true);
      expect(c.source_url, id).toBeTruthy();
    }
  });

  it('personal entries assert NO euro and NO official source (Camino states nothing of its own)', () => {
    for (const [id, c] of entries.filter(([, c]) => c.kind === 'personal')) {
      expect(c.eur, id).toBeUndefined();
      expect(c.source_url, id).toBeUndefined();
    }
  });

  it('a verified entry always has an official source + verified_at (can’t be verified without one)', () => {
    for (const [id, c] of entries.filter(([, c]) => c.verified)) {
      expect(c.source_url, id).toBeTruthy();
      expect(c.verified_at, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('personal entries are never marked verified (Camino asserts nothing of its own to verify)', () => {
    for (const [id, c] of entries.filter(([, c]) => c.kind === 'personal')) {
      expect(c.verified, id).toBe(false);
    }
  });

  it('the nationality-specific consulate visa fee stays unverified (not one euro)', () => {
    expect(OBLIGATION_COSTS['consulate-appointment'].verified).toBe(false);
  });

  it('the firm statutory tasas were verified in the pass (every confidence value is valid)', () => {
    expect(entries.some(([, c]) => c.verified)).toBe(true);         // the pass did flip some
    expect(OBLIGATION_COSTS['residencia'].verified).toBe(true);      // TIE tasa, BOE-confirmed
    expect(entries.every(([, c]) => ['high', 'med', 'low'].includes(c.confidence))).toBe(true);
  });
});
