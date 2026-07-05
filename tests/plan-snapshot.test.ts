import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildPlan, type Objective } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';
import { TEST_PERSONAS } from '../core/test-personas';

// LOCALIZATION GUARD (2026-07-05). The engine takes NO locale and must stay that way: translation
// is a presentation layer that never changes WHICH steps apply, their ORDER, phase, severity, or
// timing shape. This test freezes the structural fingerprint of every persona's plan — a snapshot
// of `id | phase | severity | timingState`, in order — WITHOUT the display strings. When the
// localization surgery (extracting titles into per-locale catalogs, wrapping components) lands, a
// green run here is the proof it didn't touch behavior. Any drift fails loudly with a diff.
//
// Clock is frozen so timing states are deterministic (personas carry fixed arrival dates).

const FROZEN = new Date('2026-06-01T12:00:00Z');
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(FROZEN); });
afterAll(() => { vi.useRealTimers(); });

function fingerprint(plan: Objective[]): string[] {
  // Deliberately excludes titles/dates (localizable / clock-relative); includes only the
  // structural facts localization must never change.
  return plan.map(o => `${o.id} | ${o.phase} | ${o.severity} | ${o.timing.state}`);
}

describe('plan structure is frozen (localization must not change engine behavior)', () => {
  for (const persona of TEST_PERSONAS) {
    it(`${persona.name} — structural fingerprint`, () => {
      const p: Profile = { ...persona.answers };
      derive(p);
      expect(fingerprint(buildPlan(p))).toMatchSnapshot();
    });
  }

  it('every persona plan is non-empty and has no duplicate steps', () => {
    for (const persona of TEST_PERSONAS) {
      const p: Profile = { ...persona.answers };
      derive(p);
      const plan = buildPlan(p);
      expect(plan.length, persona.name).toBeGreaterThan(0);
      const ids = plan.map(o => o.id);
      expect(new Set(ids).size, `${persona.name} has duplicate ids`).toBe(ids.length);
    }
  });
});
