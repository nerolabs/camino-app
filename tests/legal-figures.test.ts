import { describe, it, expect } from 'vitest';
import { CATALOG } from '@/core/engine-controller';
import { LEGAL_FIGURES } from '@/core/legal-figures';

// C6 (council fix): the national legal figures live in ONE registry. The engine reads `.value`;
// the obligation titles cite `.eur`. Before this, €28,800 was an engine constant AND hand-typed
// prose with nothing testing they agreed — a budget-law change had to be caught in N places.
// This is the guard: the prose must match the registry, and (via the i18n digit-lint) every
// translation must match the English prose — so all five locales trace back to one source.

const titleOf = (id: string) => CATALOG.find(o => o.id === id)!.title;
const stampOf = (id: string) => CATALOG.find(o => o.id === id)!.verified_at;

describe('legal-figures registry (C6)', () => {
  it('each figure is a well-formed euro amount whose display string matches its value', () => {
    for (const f of Object.values(LEGAL_FIGURES)) {
      expect(f.eur).toBe('€' + f.value.toLocaleString('en-US'));
      expect(f.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.source_url).toMatch(/^https:\/\//);
    }
  });

  it('the catalog prose cites the registry figures verbatim (drift guard)', () => {
    for (const id of ['nlv-income-proof', 'nlv-income-check']) {
      expect(titleOf(id)).toContain(LEGAL_FIGURES.nlvIncomeBase.eur);
      expect(titleOf(id)).toContain(LEGAL_FIGURES.nlvIncomePerDependent.eur);
    }
    expect(titleOf('modelo-720')).toContain(LEGAL_FIGURES.modelo720Threshold.eur);
    expect(titleOf('wealth-tax')).toContain(LEGAL_FIGURES.wealthTaxAllowance.eur);
  });

  it('steps that turn on a figure stamp their verified_at FROM the registry (stamps stop overstating)', () => {
    expect(stampOf('modelo-720')).toBe(LEGAL_FIGURES.modelo720Threshold.verified_at);
    expect(stampOf('wealth-tax')).toBe(LEGAL_FIGURES.wealthTaxAllowance.verified_at);
    expect(stampOf('nlv-income-proof')).toBe(LEGAL_FIGURES.nlvIncomeBase.verified_at);
    expect(stampOf('nlv-income-check')).toBe(LEGAL_FIGURES.nlvIncomeBase.verified_at);
  });
});
