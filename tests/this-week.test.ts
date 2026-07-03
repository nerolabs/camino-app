/**
 * "This week" selector — pure attention filter over a built plan.
 * Date semantics must mirror isOverdue: date-level, due-today gets grace (it's "this week").
 */
import { describe, it, expect } from 'vitest';
import { thisWeek } from '../core/this-week';
import type { Objective } from '../core/engine-controller';

const TODAY = new Date('2026-07-03T15:00:00Z');
const day = (offset: number) => new Date(2026, 6, 3 + offset); // local-midnight days around TODAY

function obj(id: string, timing: Objective['timing'], done = false): Objective {
  return {
    id, title: `Title of ${id}`, category: 'admin', severity: 'required',
    source: 'official', source_url: 'https://example.gob.es', depends_on: [],
    timing, phase: 'first_weeks', done, completedOn: null,
  };
}
const scheduled = (due: Date): Objective['timing'] =>
  ({ state: 'scheduled', start: new Date(due.getTime() - 14 * 86_400_000), due, estimated: false });

describe('thisWeek', () => {
  it('buckets overdue / due-soon / beyond correctly, with due-today grace', () => {
    const plan = [
      obj('overdue', scheduled(day(-1))),
      obj('due-today', scheduled(day(0))),
      obj('due-in-7', scheduled(day(7))),
      obj('due-in-8', scheduled(day(8))),
    ];
    const w = thisWeek(plan, TODAY);
    expect(w.overdue.map(o => o.id)).toEqual(['overdue']);
    expect(w.dueSoon.map(o => o.id)).toEqual(['due-today', 'due-in-7']);
    expect(w.nextUp?.id).toBe('due-in-8');
  });

  it('excludes done items everywhere and never dates pending_anchor items', () => {
    const plan = [
      obj('done-overdue', scheduled(day(-3)), true),
      obj('anchor-wait', { state: 'pending_anchor', anchor: 'residency_established' }),
      obj('recurring-soon', { state: 'recurring', nextDue: day(5) }),
    ];
    const w = thisWeek(plan, TODAY);
    expect(w.overdue).toEqual([]);
    expect(w.dueSoon.map(o => o.id)).toEqual(['recurring-soon']);
    expect(w.nextUp).toBeNull(); // pending_anchor must not be offered as "next up"
  });

  it('preserves the plan\'s dependency-safe order inside buckets (never re-sorts)', () => {
    const plan = [
      obj('first-in-plan', scheduled(day(6))),
      obj('second-in-plan', scheduled(day(2))), // earlier date, later in plan order
    ];
    const w = thisWeek(plan, TODAY);
    expect(w.dueSoon.map(o => o.id)).toEqual(['first-in-plan', 'second-in-plan']);
  });

  it('nextUp is the earliest dated step beyond the window', () => {
    const plan = [
      obj('far', scheduled(day(40))),
      obj('near', scheduled(day(9))),
    ];
    const w = thisWeek(plan, TODAY);
    expect(w.overdue).toEqual([]);
    expect(w.dueSoon).toEqual([]);
    expect(w.nextUp?.id).toBe('near');
  });
});
