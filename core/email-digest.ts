import { buildPlan, isOverdue, type Objective } from './engine-controller';
import { derive, nextSlot, type Profile } from './interview-controller';
import { ES_CATALOG_TITLES } from './i18n/es/catalog';
import enEmails from '@/locales/en/emails.json';
import esEmails from '@/locales/es/emails.json';
import esGuides from '@/locales/es/guides.json';

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
export const CATEGORY_TIP: Record<Objective['category'], string> = {
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

// The digest follows the user's saved language (auth user_metadata.lang — set by the app's
// switcher). Pure JSON tables, no i18next: this runs in the Workers runtime. Spanish tips are
// the SAME nine strings the guide pages use (locales/es/guides.json), so there is exactly one
// translation of each tip per locale.
export type DigestLang = 'en' | 'es';
const TIPS: Record<DigestLang, Record<Objective['category'], string>> = {
  en: CATEGORY_TIP,
  es: esGuides.tip as Record<Objective['category'], string>,
};
const DIGEST_STRINGS: Record<DigestLang, typeof enEmails.digest> = {
  en: enEmails.digest,
  es: esEmails.digest,
};

function tipFor(o: Objective, lang: DigestLang): string {
  const base = TIPS[lang][o.category];
  return o.severity === 'penalty'
    ? `${base} ${DIGEST_STRINGS[lang].penaltySuffix}`
    : base;
}

const shortDate = (d: Date, lang: DigestLang) =>
  d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short' });

export function interviewComplete(raw: Profile): boolean {
  const p: Profile = { ...raw };
  derive(p);
  return nextSlot(p) === null;
}

export function buildDigest(raw: Profile, today: Date = new Date(), lang: DigestLang = 'en'): Digest | null {
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

  const S = DIGEST_STRINGS[lang];
  const toItem = (o: Objective, over: boolean): DigestItem => ({
    id: o.id,
    title: lang === 'es' ? ES_CATALOG_TITLES[o.id] ?? o.title : o.title,
    overdue: over,
    whenLabel: o.timing.state === 'scheduled'
      ? (over ? S.wasDue : S.due).replace('{{date}}', shortDate(o.timing.due, lang))
      : over ? S.overdueWord : S.comingUpWord,
    tip: tipFor(o, lang),
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
