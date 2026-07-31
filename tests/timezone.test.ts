// Timezone-drift regression (memory: engine-date-utc-drift, fixed 2026-08-01).
//
// Every engine date is a UTC-midnight instant (profile dates parse as `new Date('YYYY-MM-DD')`
// = UTC midnight; addDays is pure ms math). The display layer must therefore render with
// timeZone:'UTC', or a UTC-midnight date shows a day EARLY for anyone west of Greenwich — a big
// slice of Camino's audience (the Americas). This bug was invisible on the dev box (Europe/Madrid,
// east of UTC) and in CI (UTC), where local === UTC. So this whole file runs pinned to a WESTERN
// timezone; the first test asserts the pin took, so nothing here can pass vacuously.
const ORIGINAL_TZ = process.env.TZ;
process.env.TZ = 'America/Los_Angeles';

import { afterAll, describe, it, expect } from 'vitest';

// Restore the ambient timezone so this file can't leak America/Los_Angeles into sibling test files
// that share the worker (vitest runs files sequentially per worker; this runs before the next one).
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});
import { buildPlan, isOverdue, type Objective } from '../core/engine-controller';
import { derive, type Profile } from '../core/interview-controller';
import { TEST_PERSONAS } from '../core/test-personas';
import { formatTiming, completionLine } from '../lib/plan-format';
import { reportHtml } from '../lib/reportHtml';

const ARRIVAL = '2026-07-01';
function planWithArrival(namePrefix: string): Objective[] {
  const persona = TEST_PERSONAS.find(p => p.name.startsWith(namePrefix))!;
  const p: Profile = { ...persona.answers, arrival_date: ARRIVAL };
  derive(p);
  return buildPlan(p);
}
// A UTC-midnight instant's calendar day, rendered two ways: as the viewer's local day (the drift)
// vs. as the true UTC day (what every surface should show).
const localDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const utcDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

describe('timezone regression harness', () => {
  it('runs pinned to a timezone WEST of UTC — otherwise the drift is invisible and these tests are meaningless', () => {
    // Positive offset = behind UTC (west). Los Angeles is +420 (PDT) / +480 (PST).
    expect(new Date().getTimezoneOffset()).toBeGreaterThan(0);
    // And prove the drift is real here: a UTC-midnight date renders a different day locally.
    expect(localDay(new Date(`${ARRIVAL}`))).not.toBe(utcDay(new Date(`${ARRIVAL}`)));
  });
});

describe('engine builds UTC-midnight dates (the convention every formatter depends on)', () => {
  const plan = planWithArrival('Susan');

  it('scheduled arrival-anchored dues are exact UTC midnight', () => {
    const sched = plan.find(o => o.timing.state === 'scheduled' && !o.timing.estimated);
    expect(sched).toBeTruthy();
    const due = (sched!.timing as { due: Date }).due;
    expect(due.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('recurring deadlines (nextYearlyDeadline) are exact UTC midnight — not local midnight', () => {
    // Modelo 100 recurs in Apr–Jun → the deadline is 30 June. Built local, it would be 30 Jun 00:00
    // LOCAL (= 07:00 UTC) and render as 29 Jun under timeZone:'UTC'. It must be UTC midnight.
    const recurring = plan.find(o => o.timing.state === 'recurring' && o.id === 'modelo-100');
    expect(recurring).toBeTruthy();
    const nextDue = (recurring!.timing as { nextDue: Date }).nextDue;
    expect(nextDue.toISOString()).toMatch(/-06-30T00:00:00\.000Z$/);
  });
});

describe('formatters render the UTC calendar day (no westward drift)', () => {
  const plan = planWithArrival('Susan');
  const sched = plan.find(o => o.timing.state === 'scheduled' && !o.timing.estimated)!;
  const due = (sched.timing as { due: Date }).due;

  it('formatTiming shows the real due day, not the day before', () => {
    const out = formatTiming(sched);
    expect(out).toContain(utcDay(due));
    expect(out).not.toContain(localDay(due)); // the drifted (a-day-early) render must be gone
  });

  it('completionLine shows the real completion day', () => {
    const on = new Date(`${ARRIVAL}`); // UTC midnight
    const out = completionLine({ ...sched, completedOn: on });
    expect(out).toContain(utcDay(on));
    expect(out).not.toContain(localDay(on));
  });

  it('reportHtml (PDF) shows the real due day', () => {
    const html = reportHtml(plan, new Date(`${ARRIVAL}`), 'en');
    expect(html).toContain(utcDay(due));
    expect(html).not.toContain(localDay(due));
  });
});

describe('isOverdue compares against UTC midnight of the local calendar day', () => {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const base = { id: 'x', title: 't', category: 'admin', severity: 'required', source: 'official',
    depends_on: [], phase: 'first_weeks', done: false, completedOn: null } as unknown as Objective;

  it('a step due TODAY is not overdue (was flagged a day early west of UTC before the fix)', () => {
    const due = new Date(todayUTC); // UTC midnight of today
    expect(isOverdue({ ...base, timing: { state: 'scheduled', start: due, due, estimated: false } })).toBe(false);
  });

  it('a step due YESTERDAY is overdue', () => {
    const due = new Date(todayUTC.getTime() - 86_400_000);
    expect(isOverdue({ ...base, timing: { state: 'scheduled', start: due, due, estimated: false } })).toBe(true);
  });
});
