import { describe, it, expect } from 'vitest';
import { changeHint } from '../lib/plan-coach';
import type { Objective } from '../core/engine-controller';

// changeHint gives the "something changed?" box a placeholder relevant to the OPEN step's
// category (build finding: a property-only example on a visa step read as a non-sequitur). Pure
// map; the example strings are localization targets, so pin the category→hint contract.

const stub = (category: string): Objective =>
  ({ category, id: 'x', title: 't', severity: 'info' } as unknown as Objective);

describe('changeHint', () => {
  it('returns a category-specific example for known categories', () => {
    expect(changeHint(stub('property'))).toMatch(/rent instead of buy/i);
    expect(changeHint(stub('visa'))).toMatch(/digital-nomad visa/i);
    expect(changeHint(stub('family'))).toMatch(/married/i);
    expect(changeHint(stub('residency'))).toMatch(/TIE/);
  });

  it('falls back to a generic example for an unmapped category', () => {
    expect(changeHint(stub('unknown-category'))).toMatch(/next spring/i);
  });
});
