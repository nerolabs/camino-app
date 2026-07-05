import { describe, it, expect } from 'vitest';
import { buildPlan, type Objective } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';
import { TEST_PERSONAS } from '../core/test-personas';
import {
  plansDiffer, diffSummary, completionLine,
  PHASE_ORDER, PHASE_LABELS, SEV_LABEL,
} from '../lib/plan-format';

// Display-layer formatters — now unit-testable via the react-native stub. These strings
// (diff narration, completion lines, phase/severity labels) are prime LOCALIZATION targets, so
// pinning their logic protects the "living plan" honesty as those strings get extracted.

function planFor(namePrefix: string): Objective[] {
  const persona = TEST_PERSONAS.find(p => p.name.startsWith(namePrefix))!;
  const p: Profile = { ...persona.answers };
  derive(p);
  return buildPlan(p);
}

describe('plansDiffer — the honesty gate behind "I remodelled your plan"', () => {
  const plan = planFor('Susan');

  it('is false when nothing changed (a no-op re-plan)', () => {
    expect(plansDiffer(plan, plan)).toBe(false);
    expect(plansDiffer(plan, [...plan])).toBe(false);
  });

  it('is true when steps are added or removed', () => {
    expect(plansDiffer(plan, plan.slice(1))).toBe(true);   // one removed
    expect(plansDiffer(plan.slice(1), plan)).toBe(true);   // one added
  });

  it('is true when a scheduled due date shifts', () => {
    const scheduledIdx = plan.findIndex(o => o.timing.state === 'scheduled');
    const shifted = plan.map((o, i) =>
      i === scheduledIdx && o.timing.state === 'scheduled'
        ? { ...o, timing: { ...o.timing, due: new Date(o.timing.due.getTime() + 5 * 86_400_000) } }
        : o,
    );
    expect(plansDiffer(plan, shifted)).toBe(true);
  });
});

describe('diffSummary', () => {
  const plan = planFor('Susan');

  it('says nothing changed on a no-op', () => {
    expect(diffSummary(plan, plan)).toBe('Nothing in your plan needed to change.');
  });

  it('narrates additions with a capitalized sentence', () => {
    const s = diffSummary(plan.slice(1), plan); // one added back
    expect(s).toMatch(/^Added 1 step/);
    expect(s.endsWith('.')).toBe(true);
  });
});

describe('completionLine', () => {
  const plan = planFor('Susan');
  const scheduled = plan.find(o => o.timing.state === 'scheduled')! as Extract<Objective, unknown>;

  it('reports on-time / late / early against the scheduled due date', () => {
    const due = (scheduled.timing as { due: Date }).due;
    const onTime = { ...scheduled, completedOn: new Date(due) };
    const late = { ...scheduled, completedOn: new Date(due.getTime() + 3 * 86_400_000) };
    const early = { ...scheduled, completedOn: new Date(due.getTime() - 2 * 86_400_000) };
    expect(completionLine(onTime)).toContain('on time');
    expect(completionLine(late)).toContain('3 days late');
    expect(completionLine(early)).toContain('2 days early');
  });
});

describe('label maps stay complete (localization completeness)', () => {
  it('every phase has an order slot and a label', () => {
    expect(PHASE_ORDER.length).toBe(4);
    for (const phase of PHASE_ORDER) expect(PHASE_LABELS[phase]).toBeTruthy();
  });

  it('every severity has a label', () => {
    for (const sev of ['penalty', 'required', 'recommended', 'info']) {
      expect(SEV_LABEL[sev]).toBeTruthy();
    }
  });
});
