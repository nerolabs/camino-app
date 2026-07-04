/**
 * Guide prose honesty contract (invariant 3, mechanically enforced):
 *  - full coverage: every catalog obligation has prose; no orphaned prose ids.
 *  - digit-lint: any number in the prose must already appear in that obligation's own
 *    title — the prose may restate catalog facts but can never introduce new figures,
 *    thresholds, or deadlines. Specifics live behind the official source link.
 */
import { describe, it, expect } from 'vitest';
import { CATALOG } from '../core/engine-controller';
import { GUIDE_PROSE } from '../core/guide-prose';

const digitRuns = (s: string) => (s.match(/\d+/g) ?? []);

describe('guide prose', () => {
  it('covers every catalog obligation, and nothing else', () => {
    const catalogIds = new Set(CATALOG.map(o => o.id));
    const proseIds = new Set(Object.keys(GUIDE_PROSE));
    expect([...catalogIds].filter(id => !proseIds.has(id))).toEqual([]);
    expect([...proseIds].filter(id => !catalogIds.has(id))).toEqual([]);
  });

  it('is substantive prose (no stubs)', () => {
    for (const [id, text] of Object.entries(GUIDE_PROSE)) {
      expect(text.length, id).toBeGreaterThan(120);
    }
  });

  it('never introduces a number the obligation title does not carry (digit-lint)', () => {
    for (const o of CATALOG) {
      const titleDigits = new Set(digitRuns(o.title));
      for (const run of digitRuns(GUIDE_PROSE[o.id] ?? '')) {
        expect(titleDigits.has(run), `${o.id}: prose contains "${run}" not present in its title`).toBe(true);
      }
    }
  });
});
