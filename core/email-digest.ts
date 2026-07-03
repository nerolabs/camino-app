import { buildPlan, isOverdue, type Objective } from './engine-controller';
import { derive, nextSlot, type Profile } from './interview-controller';

/**
 * Weekly-roundup digest: a pure function of the profile (invariant 4 applies to email too).
 *
 * Selection rules (user spec, 2026-07-03):
 *  - overdue items first (oldest due date first), then upcoming ones (soonest first),
 *  - upcoming = scheduled, not done, due within the next UPCOMING_WINDOW_DAYS,
 *  - NEVER more than DIGEST_CAP items in total,
 *  - every item carries a helpful, deterministic tip (from the catalog's own category/severity —
 *    no LLM anywhere near this),
 *  - nothing pressing → null → no email that week. A roundup with nothing to say is spam.
 *
 * This module is imported by the /api/email/weekly server route, so it must stay free of
 * react-native imports (Cloudflare Workers runtime).
 */

export const DIGEST_CAP = 5;
export const UPCOMING_WINDOW_DAYS = 45;

export type DigestItem = {
  id: string;
  title: string;
  overdue: boolean;
  whenLabel: string;      // "was due 12 Jun" | "due 28 Jul"
  tip: string;
  source_url?: string;    // official source, when the obligation has one
};

export type Digest = {
  overdue: DigestItem[];
  upcoming: DigestItem[];
  moreCount: number;      // pressing items beyond the cap (so the email can say "…and N more")
  totalOpen: number;      // all not-done items on the whole roadmap
};

// One practical, always-true-by-construction nudge per category. Recommendation voice —
// process advice, never invented facts (costs, laws, dates live in the catalog + sources).
const CATEGORY_TIP: Record<Objective['category'], string> = {
  visa:      'Consulate appointments book out weeks ahead — secure the slot first, then assemble the paperwork.',
  residency: 'Book the cita previa now — appointment slots are the real bottleneck, not the paperwork.',
  tax:       'If in doubt, a gestor can prepare this in a day — cheap insurance against a mis-filing.',
  health:    'Sort this before you need it — coverage gaps are the expensive kind of surprise.',
  mobility:  'Start early: exams, appointments and offices here all run on waiting lists.',
  banking:   'Bring every document on the list — incomplete applications get rejected on the spot.',
  family:    'Family paperwork often needs certified (sworn) translations — check before the appointment.',
  property:  'Don’t sign or transfer anything before the checks clear — this step protects the purchase.',
  admin:     'A short errand once your documents are ready — book the cita previa and tick it off.',
};

function tipFor(o: Objective): string {
  const base = CATEGORY_TIP[o.category];
  return o.severity === 'penalty'
    ? `${base} Missing it can trigger a financial penalty.`
    : base;
}

const shortDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export function interviewComplete(raw: Profile): boolean {
  const p: Profile = { ...raw };
  derive(p);
  return nextSlot(p) === null;
}

export function buildDigest(raw: Profile, today: Date = new Date()): Digest | null {
  const p: Profile = { ...raw };
  derive(p);
  if (nextSlot(p) !== null) return null; // interview incomplete — nudge territory, not roundup

  const plan = buildPlan(p);
  const horizon = new Date(today.getTime() + UPCOMING_WINDOW_DAYS * 86_400_000);

  const overdueAll = plan
    .filter(o => isOverdue(o, today))
    .sort((a, b) =>
      (a.timing.state === 'scheduled' ? a.timing.due.getTime() : 0) -
      (b.timing.state === 'scheduled' ? b.timing.due.getTime() : 0));

  const upcomingAll = plan
    .filter(o => !o.done && !isOverdue(o, today)
      && o.timing.state === 'scheduled'
      && o.timing.due.getTime() <= horizon.getTime())
    .sort((a, b) =>
      (a.timing.state === 'scheduled' ? a.timing.due.getTime() : 0) -
      (b.timing.state === 'scheduled' ? b.timing.due.getTime() : 0));

  if (overdueAll.length === 0 && upcomingAll.length === 0) return null;

  const toItem = (o: Objective, over: boolean): DigestItem => ({
    id: o.id,
    title: o.title,
    overdue: over,
    whenLabel: o.timing.state === 'scheduled'
      ? `${over ? 'was due' : 'due'} ${shortDate(o.timing.due)}`
      : over ? 'overdue' : 'coming up',
    tip: tipFor(o),
    ...(o.source_url ? { source_url: o.source_url } : {}),
  });

  const overdue = overdueAll.slice(0, DIGEST_CAP).map(o => toItem(o, true));
  const upcoming = upcomingAll.slice(0, Math.max(0, DIGEST_CAP - overdue.length)).map(o => toItem(o, false));

  return {
    overdue,
    upcoming,
    moreCount: overdueAll.length + upcomingAll.length - overdue.length - upcoming.length,
    totalOpen: plan.filter(o => !o.done).length,
  };
}
