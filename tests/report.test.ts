/**
 * The printable report — pure function of the plan (THESIS piece 4).
 * These tests lock the honesty rules: estimated dates say so, pending-anchor steps
 * stay dateless ("starts once…"), overdue is called out, done is marked.
 */
import { describe, it, expect } from 'vitest';
import { reportHtml } from '../lib/reportHtml';
import type { Objective } from '../core/engine-controller';

const TODAY = new Date('2026-07-03T12:00:00Z');
const day = (offset: number) => new Date(2026, 6, 3 + offset);

function obj(id: string, timing: Objective['timing'], extra: Partial<Objective> = {}): Objective {
  return {
    id, title: `Title of ${id}`, category: 'admin', severity: 'required',
    source: 'official', source_url: 'https://example.gob.es/tramite', depends_on: [],
    timing, phase: 'first_weeks', done: false, completedOn: null, ...extra,
  };
}

describe('reportHtml', () => {
  const plan: Objective[] = [
    obj('hero-step', { state: 'scheduled', start: day(0), due: day(10), estimated: true }),
    obj('overdue-step', { state: 'scheduled', start: day(-30), due: day(-2), estimated: false }),
    obj('anchored-step', { state: 'pending_anchor', anchor: 'residency_established' }),
    obj('done-step', { state: 'scheduled', start: day(-10), due: day(-1), estimated: false },
        { done: true, completedOn: day(-1) }),
  ];
  const html = reportHtml(plan, TODAY);

  it('marks estimated dates as estimated and keeps pending-anchor steps dateless', () => {
    expect(html).toContain('(estimated)');
    expect(html).toContain('Starts once your residency is established');
  });

  it('calls out overdue and completed states honestly', () => {
    expect(html).toContain('Overdue · was due');
    expect(html).toContain('Done ·');
  });

  it('leads with the first not-done step as the hero and prints official sources', () => {
    expect(html.indexOf('YOUR NEXT STEP')).toBeGreaterThan(-1);
    expect(html.indexOf('Title of hero-step')).toBeLessThan(html.indexOf('Title of overdue-step'));
    expect(html).toContain('https://example.gob.es/tramite');
  });

  it('escapes HTML in titles (no injection into the report)', () => {
    const sneaky = reportHtml([obj('x', { state: 'pending_anchor', anchor: 'arrival' }, { title: 'A <script>alert(1)</script> step' })], TODAY);
    expect(sneaky).not.toContain('<script>alert');
    expect(sneaky).toContain('&lt;script&gt;');
  });
});
