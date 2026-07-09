/**
 * Plan-delta primitive (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 *
 * The single abstraction every "living roadmap" surface renders from. `buildPlan(profile)` is
 * already pure and recomputed on every interview answer; this diffs consecutive plans so the UI
 * can show what an answer DID: web animates the two-pane roadmap, mobile shows "+6 steps", and
 * resume shows "you've built N steps so far". Presentation diverges; this logic never does.
 *
 * Pure, keyed by objective id. Compares a stable projection (serialized timing, phase, severity,
 * title, regional) so Date identity never causes a false "changed". `done`/`completedOn` churn is
 * ignored by default — no completions happen mid-interview — but the plan page can opt back in.
 */
import type { Objective, Resolved } from './engine-controller';

export type ObjectiveField = 'timing' | 'severity' | 'phase' | 'title' | 'regional' | 'done';

export type PlanChange = {
  id: string;
  objective: Objective;        // the AFTER version
  fields: ObjectiveField[];    // which salient fields differ
};

export type PlanDelta = {
  added: Objective[];          // ids present in `after`, not `before`
  removed: Objective[];        // ids present in `before`, not `after`
  changed: PlanChange[];       // same id, a salient field differs
  after: Objective[];          // full current plan, already topo-sorted by buildPlan
};

// A stable, comparable string for a resolved timing — avoids Date identity false positives.
function timingKey(t: Resolved): string {
  switch (t.state) {
    case 'scheduled':      return `s:${t.start.getTime()}:${t.due.getTime()}:${t.estimated}`;
    case 'pending_anchor': return `p:${t.anchor}`;
    case 'recurring':      return `r:${t.nextDue.getTime()}`;
  }
}

function changedFields(a: Objective, b: Objective, includeDone: boolean): ObjectiveField[] {
  const f: ObjectiveField[] = [];
  if (timingKey(a.timing) !== timingKey(b.timing)) f.push('timing');
  if (a.severity !== b.severity)                    f.push('severity');
  if (a.phase !== b.phase)                          f.push('phase');
  if (a.title !== b.title)                          f.push('title');
  if (!!a.regional !== !!b.regional)                f.push('regional');
  if (includeDone && a.done !== b.done)             f.push('done');
  return f;
}

export function diffPlans(
  before: Objective[],
  after: Objective[],
  opts: { include?: ObjectiveField[] } = {},
): PlanDelta {
  const includeDone = opts.include?.includes('done') ?? false;
  const beforeById = new Map(before.map(o => [o.id, o]));
  const afterById = new Map(after.map(o => [o.id, o]));

  const added: Objective[] = [];
  const changed: PlanChange[] = [];
  for (const o of after) {                    // iterate `after` to keep topo order
    const prev = beforeById.get(o.id);
    if (!prev) { added.push(o); continue; }
    const fields = changedFields(prev, o, includeDone);
    if (fields.length) changed.push({ id: o.id, objective: o, fields });
  }
  const removed = before.filter(o => !afterById.has(o.id));

  return { added, removed, changed, after };
}

// Convenience for the mobile "+N steps / updated M / removed K" summary line.
export function summarizeDelta(d: PlanDelta): { added: number; removed: number; changed: number } {
  return { added: d.added.length, removed: d.removed.length, changed: d.changed.length };
}
