import { describe, it, expect, vi, beforeEach } from 'vitest';

const askAnthropic = vi.fn();
vi.mock('@/lib/lola', () => ({ askAnthropic: (...a: unknown[]) => askAnthropic(...a) }));

import { changeHint, distillFinalNote, parseProfileChange } from '../lib/plan-coach';
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

// The final-note distillation (2026-07-12) shares the plan-coach extractor: typed profile
// fields only, fenced-JSON tolerated, ANY failure → { error } so the caller fails open and
// the raw note is still kept. Both callers ride the same contract — pin it.

describe('distillFinalNote / parseProfileChange', () => {
  beforeEach(() => vi.clearAllMocks());

  it('distills a note into typed field changes (fenced JSON tolerated)', async () => {
    askAnthropic.mockResolvedValue('```json\n{"changes": {"has_pets": true}}\n```');
    const res = await distillFinalNote('oh and our dog Luna is coming too');
    expect(res).toEqual({ changes: { has_pets: true } });
    // The situational framing differs from the per-step flow — the extractor must know
    // this is a post-interview note, not a step update.
    const [{ system }] = askAnthropic.mock.calls[0] as [{ system: string }];
    expect(system).toContain('finished the interview');
    expect(system).toContain('anything else I should know');
  });

  it('an unmappable note yields empty changes, never invented fields', async () => {
    askAnthropic.mockResolvedValue('{"changes": {}}');
    const res = await distillFinalNote('wish us luck!');
    expect(res).toEqual({ changes: {} });
  });

  it('extraction failure returns { error } — callers fail open and keep the note', async () => {
    askAnthropic.mockResolvedValue('sorry, no JSON here');
    expect(await distillFinalNote('the dog comes too')).toEqual({ error: true });
    askAnthropic.mockRejectedValue(new Error('network'));
    expect(await distillFinalNote('the dog comes too')).toEqual({ error: true });
  });

  it('the per-step flow still frames around the open step', async () => {
    askAnthropic.mockResolvedValue('{"changes": {"owns_property_in_spain": false}}');
    const res = await parseProfileChange('we decided to rent', 'Pay the property transfer tax');
    expect(res).toEqual({ changes: { owns_property_in_spain: false } });
    const [{ system }] = askAnthropic.mock.calls[0] as [{ system: string }];
    expect(system).toContain('Pay the property transfer tax');
  });
});
