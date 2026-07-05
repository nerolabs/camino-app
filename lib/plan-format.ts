/**
 * Pure formatting helpers + display maps for the roadmap, extracted from app/plan.tsx.
 * No state, no LLM — everything here is a deterministic function of plan data (and, since L1,
 * of the app language: human-readable strings come from locales/<lang>/plan.json "format.*",
 * dates from dateLocale()). Colors, icons, and ordering stay code — they don't localize.
 */
import { Platform, Linking } from 'react-native';
import i18n, { dateLocale } from '@/lib/i18n';
import { displayTitle } from '@/lib/catalogTitles';
import { palette } from '@/constants/Colors';
import { type Objective, type Phase } from '@/core/engine-controller';

const tf = (key: string, options?: Record<string, unknown>) => i18n.t(`plan:format.${key}`, options) as string;

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function shortTitle(t: string): string {
  const clause = t.split(' — ')[0]; // titles lead with a short clause before the em-dash
  const words = clause.split(' ');
  return words.length <= 8 ? clause : words.slice(0, 8).join(' ') + '…';
}

// Truthful, deterministic diff of two plans — the facts Lola reports come from here.
export function diffSummary(before: Objective[], after: Objective[]): string {
  const beforeIds = new Set(before.map(o => o.id));
  const afterById = new Map(after.map(o => [o.id, o]));
  const beforeById = new Map(before.map(o => [o.id, o]));
  const added = after.filter(o => !beforeIds.has(o.id));
  const removed = before.filter(o => !afterById.has(o.id));
  let shifted = 0;
  for (const o of after) {
    const b = beforeById.get(o.id);
    if (b && b.timing.state === 'scheduled' && o.timing.state === 'scheduled'
        && b.timing.due.getTime() !== o.timing.due.getTime()) shifted++;
  }
  const parts: string[] = [];
  if (added.length)   parts.push(tf('diff.added', { count: added.length, example: shortTitle(displayTitle(added[0])) }));
  if (removed.length) parts.push(tf('diff.removed', { count: removed.length }));
  if (shifted)        parts.push(tf('diff.shifted', { count: shifted }));
  if (!parts.length)  return tf('diff.none');
  const joined = parts.join(', ');
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
}

// Did the re-plan actually change anything? Same criteria as diffSummary — used to keep the
// celebration honest: "I've remodelled your plan!" must never appear over a no-op diff
// (build-24 family finding: extractor set a field, nothing moved, Lola claimed a replan).
export function plansDiffer(before: Objective[], after: Objective[]): boolean {
  if (before.length !== after.length) return true;
  const beforeById = new Map(before.map(o => [o.id, o]));
  for (const o of after) {
    const b = beforeById.get(o.id);
    if (!b) return true;
    if (b.timing.state === 'scheduled' && o.timing.state === 'scheduled'
        && b.timing.due.getTime() !== o.timing.due.getTime()) return true;
  }
  return false;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// "Completed 12 May · 3 days late" / "· on time" / "· 2 days early", measured against
// the step's own scheduled due date when there is one.
export function completionLine(obj: Objective): string {
  const on = obj.completedOn!;
  const dateStr = on.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
  if (obj.timing.state !== 'scheduled') return tf('completion.bare', { date: dateStr });
  const delta = daysBetween(on, obj.timing.due);
  const mag = Math.abs(delta);
  const rel = delta === 0 ? tf('completion.onTime')
            : delta > 0   ? tf('completion.late', { count: mag })
            :               tf('completion.early', { count: mag });
  return tf('completion.line', { date: dateStr, rel });
}

export const phaseLabel = (phase: Phase): string => tf(`phase.${phase}`);

export const PHASE_ICONS: Record<Phase, string> = {
  before_you_go: '✈️',
  first_weeks:   '📍',
  ongoing:       '🔄',
  when_settled:  '🏡',
};

export const PHASE_ORDER: Phase[] = ['before_you_go', 'first_weeks', 'ongoing', 'when_settled'];

export const SEV_COLOR: Record<string, string> = {
  penalty:     '#C0392B',
  required:    palette.cobalt,
  recommended: palette.olive,
  info:        palette.muted,
};

export const sevLabel = (sev: string): string => tf(`severity.${sev}`);

export const sevBlurb = (sev: string): string => tf(`severityBlurb.${sev}`);

// Open an external URL. On web, a new tab (so the user keeps their roadmap open); Linking.openURL
// would navigate the current tab away. On native, hand off to the OS browser.
export function openExternal(url: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
}

export const sourceShort = (src: string): string => tf(`source.${src}`);

export const sourceBlurb = (src: string): string => tf(`sourceBlurb.${src}`);

export const SOURCE_COLOR: Record<string, string> = {
  official:       palette.cobalt,
  recommendation: '#9A7B4F',
};

export function timingDetail(obj: Objective): string {
  const t = obj.timing;
  if (t.state === 'recurring') return tf('timing.recurringDetail');
  if (t.state === 'pending_anchor') {
    const key = `timing.pendingEvent.${t.anchor}`;
    const evt = i18n.exists(`plan:format.${key}`) ? tf(key) : tf('timing.pendingEvent.other');
    return tf('timing.pendingDetail', { event: evt });
  }
  if (t.estimated) return tf('timing.estimatedDetail');
  return tf('timing.firmDetail');
}

export function formatTiming(obj: Objective): string {
  const t = obj.timing;
  const fmt = (d: Date) => d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
  if (t.state === 'scheduled') return tf(t.estimated ? 'timing.dueEst' : 'timing.due', { date: fmt(t.due) });
  if (t.state === 'recurring') return tf('timing.nextDue', { date: fmt(t.nextDue) });
  const anchorKey = `timing.anchor.${t.anchor}`;
  const event = i18n.exists(`plan:format.${anchorKey}`) ? tf(anchorKey) : t.anchor.replace(/_/g, ' ');
  return tf('timing.startsOnce', { event });
}
