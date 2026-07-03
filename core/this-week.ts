/**
 * "This week" — the attention filter over a built plan: what's overdue, what's due in the
 * next 7 days, and (when the week is clear) the next dated step so the empty state can say
 * something true and useful.
 *
 * Pure and deterministic (a selector over buildPlan's output — invariant 4). Date semantics
 * mirror isOverdue: date-level comparison, due-today counts as this week, not overdue.
 * Bucket order preserves the plan's dependency-safe ordering (invariant 1) — items are
 * filtered, never re-sorted.
 */
import { isOverdue, type Objective } from './engine-controller';

export type ThisWeek = {
  overdue: Objective[];
  dueSoon: Objective[];          // due within [today .. today+7], date-level, incl. recurring
  nextUp: Objective | null;      // earliest dated pending step beyond the window (may be null)
};

const DAY_MS = 86_400_000;

function dueDate(o: Objective): Date | null {
  if (o.timing.state === 'scheduled') return o.timing.due;
  if (o.timing.state === 'recurring') return o.timing.nextDue;
  return null; // pending_anchor: undated by design — never fabricate a date for it
}

export function thisWeek(objectives: Objective[], today: Date = new Date()): ThisWeek {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfWindow = startOfToday + 8 * DAY_MS; // exclusive bound → today+7 inclusive

  const pending = objectives.filter(o => !o.done);
  const overdue = pending.filter(o => isOverdue(o, today));
  const dueSoon = pending.filter(o => {
    if (isOverdue(o, today)) return false;
    const d = dueDate(o);
    return d !== null && d.getTime() >= startOfToday && d.getTime() < endOfWindow;
  });

  let nextUp: Objective | null = null;
  for (const o of pending) {
    const d = dueDate(o);
    if (d === null || d.getTime() < endOfWindow) continue;
    if (!nextUp || d.getTime() < dueDate(nextUp)!.getTime()) nextUp = o;
  }

  return { overdue, dueSoon, nextUp };
}
