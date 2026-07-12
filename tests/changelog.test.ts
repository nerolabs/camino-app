import { describe, it, expect } from 'vitest';
import { CHANGELOG, DEFAULT_VERIFIED, verifiedOn, changelogIds, catalogIds } from '../core/changelog';
import { CATALOG } from '../core/engine-controller';

// The public changelog is a trust surface — it must stay structurally honest:
// real catalog ids, real ISO dates, newest first, and stamps that never predate
// the record they summarize.

describe('regulatory changelog', () => {
  it('every referenced id exists in the catalog', () => {
    const ids = catalogIds();
    for (const id of changelogIds()) expect(ids.has(id), `changelog references unknown id ${id}`).toBe(true);
  });

  it('entries carry ISO dates, newest first, none in the future', () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    let prev = '9999-12-31';
    for (const e of CHANGELOG) {
      expect(e.date).toMatch(iso);
      expect(e.date <= prev, `entry ${e.title} out of order`).toBe(true);
      expect(e.details.length).toBeGreaterThan(0);
      prev = e.date;
    }
  });

  it('verified stamps: default applies, overrides win, and no stamp predates the founding pass', () => {
    const consulate = CATALOG.find(o => o.id === 'consulate-appointment')!;
    expect(verifiedOn(consulate)).toBe('2026-07-12');
    const untouched = CATALOG.find(o => o.id === 'nie')!; // empadronamiento got its own stamp in audit A1
    expect(verifiedOn(untouched)).toBe(DEFAULT_VERIFIED);
    for (const o of CATALOG) expect(verifiedOn(o) >= '2026-06-30').toBe(true);
  });

  it('every touched-since-default item declares its own verified_at', () => {
    // The 2026-07-12 consulate rewrite and the 2026-07-10 additions must not silently
    // claim the catalog-wide default.
    for (const id of ['consulate-appointment', 'nlv-income-check', 'dnv-income-check', 'language-classes',
                      'property-transfer-tax', 'wealth-tax']) {
      const o = CATALOG.find(x => x.id === id)!;
      expect(o.verified_at, `${id} should carry an explicit verified_at`).toBeTruthy();
    }
  });
});
