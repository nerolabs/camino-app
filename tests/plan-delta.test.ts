/**
 * Plan-delta primitive (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 * Locks the diff every living-roadmap surface renders from: added / removed / changed / after.
 */
import { describe, it, expect } from 'vitest';
import { buildPlan, type Objective } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';
import { diffPlans, summarizeDelta } from '../core/plan-delta';
import { TEST_PERSONAS } from '../core/test-personas';

function planFor(name: string): Objective[] {
  const persona = TEST_PERSONAS.find(p => p.name.startsWith(name));
  if (!persona) throw new Error(`no persona starting with "${name}"`);
  const profile: Profile = { ...persona.answers };
  derive(profile);
  return buildPlan(profile);
}
const idSet = (plan: Objective[]) => new Set(plan.map(o => o.id));

describe('diffPlans', () => {
  it('is empty when the plan is unchanged', () => {
    const plan = planFor('Susan');
    const d = diffPlans(plan, plan);
    expect(d.added).toEqual([]);
    expect(d.removed).toEqual([]);
    expect(d.changed).toEqual([]);
    expect(d.after).toBe(plan);
  });

  it('reports added and removed by objective id', () => {
    const before = planFor('Minimal'); // EU, fewest obligations
    const after = planFor('Susan');     // US retiree, NLV + citizenship → many more
    const beforeIds = idSet(before);
    const afterIds = idSet(after);
    const d = diffPlans(before, after);

    // added = in after, not before
    expect(new Set(d.added.map(o => o.id)))
      .toEqual(new Set([...afterIds].filter(id => !beforeIds.has(id))));
    // removed = in before, not after
    expect(new Set(d.removed.map(o => o.id)))
      .toEqual(new Set([...beforeIds].filter(id => !afterIds.has(id))));
    // a US retiree aiming for citizenship gains steps the minimal EU mover never had
    expect(d.added.length).toBeGreaterThan(0);
    expect(d.after).toBe(after);
  });

  it('preserves the topo order of `after` in the added list', () => {
    const before = planFor('Minimal');
    const after = planFor('Susan');
    const d = diffPlans(before, after);
    const addedOrder = d.added.map(o => o.id);
    const afterOrder = after.map(o => o.id).filter(id => addedOrder.includes(id));
    expect(addedOrder).toEqual(afterOrder);
  });

  it('detects a timing change when the arrival date moves (same applicability)', () => {
    const persona = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!;
    const a: Profile = { ...persona.answers };
    derive(a);
    const before = buildPlan(a);

    const b: Profile = { ...persona.answers, arrival_date: '2027-09-01' };
    derive(b);
    const after = buildPlan(b);

    const d = diffPlans(before, after);
    // moving only the arrival date changes deadlines, not which obligations apply
    expect(d.added).toEqual([]);
    expect(d.removed).toEqual([]);
    expect(d.changed.length).toBeGreaterThan(0);
    expect(d.changed.some(c => c.fields.includes('timing'))).toBe(true);
    // every change points at a real, still-present objective
    for (const c of d.changed) expect(c.objective.id).toBe(c.id);
  });

  it('ignores done/completedOn churn unless opted in', () => {
    const persona = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!;
    const base: Profile = { ...persona.answers };
    derive(base);
    const before = buildPlan(base);
    const firstId = before[0].id;

    const withProgress: Profile = { ...persona.answers, progress: { [firstId]: { state: 'done', completedOn: '2026-01-01' } } };
    derive(withProgress);
    const after = buildPlan(withProgress);

    // default: a completion is not a "changed" step for interview animations…
    const marked = diffPlans(before, after).changed.find(c => c.id === firstId);
    expect(marked?.fields.includes('done')).not.toBe(true);
    // …unless the caller opts in (plan page)
    const optedIn = diffPlans(before, after, { include: ['done'] }).changed.find(c => c.id === firstId);
    expect(optedIn?.fields).toContain('done');
  });

  it('summarizeDelta counts each bucket', () => {
    const d = diffPlans(planFor('Minimal'), planFor('Susan'));
    expect(summarizeDelta(d)).toEqual({
      added: d.added.length, removed: d.removed.length, changed: d.changed.length,
    });
  });
});
