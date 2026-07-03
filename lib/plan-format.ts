/**
 * Pure formatting helpers + display maps for the roadmap, extracted from app/plan.tsx.
 * No state, no LLM — everything here is a deterministic function of plan data.
 */
import { Platform, Linking } from 'react-native';
import { palette } from '@/constants/Colors';
import { type Objective, type Phase } from '@/core/engine-controller';

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
  if (added.length)   parts.push(`added ${added.length} step${added.length === 1 ? '' : 's'} (e.g. ${shortTitle(added[0].title)})`);
  if (removed.length) parts.push(`removed ${removed.length} step${removed.length === 1 ? '' : 's'}`);
  if (shifted)        parts.push(`${shifted} date${shifted === 1 ? '' : 's'} shifted`);
  if (!parts.length)  return 'Nothing in your plan needed to change.';
  const joined = parts.join(', ');
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// "Completed 12 May · 3 days late" / "· on time" / "· 2 days early", measured against
// the step's own scheduled due date when there is one.
export function completionLine(obj: Objective): string {
  const on = obj.completedOn!;
  const dateStr = on.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (obj.timing.state !== 'scheduled') return `Completed ${dateStr}`;
  const delta = daysBetween(on, obj.timing.due);
  const mag = Math.abs(delta);
  const rel = delta === 0 ? 'on time' : `${mag} day${mag === 1 ? '' : 's'} ${delta > 0 ? 'late' : 'early'}`;
  return `Completed ${dateStr} · ${rel}`;
}

export const PHASE_LABELS: Record<Phase, string> = {
  before_you_go: 'Before you go',
  first_weeks:   'First weeks',
  ongoing:       'Ongoing',
  when_settled:  'When settled',
};

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

export const SEV_LABEL: Record<string, string> = {
  penalty:     'Penalty risk',
  required:    'Required',
  recommended: 'Recommended',
  info:        'Info',
};

export const SEV_BLURB: Record<string, string> = {
  penalty:     'Missing this can trigger a financial penalty.',
  required:    'A legal requirement for your situation.',
  recommended: 'Strongly advised, though not strictly mandatory.',
  info:        'Informational — a milestone to be aware of.',
};

// Open an external URL. On web, a new tab (so the user keeps their roadmap open); Linking.openURL
// would navigate the current tab away. On native, hand off to the OS browser.
export function openExternal(url: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url);
  }
}

export const SOURCE_SHORT: Record<string, string> = {
  official:       'official',
  recommendation: 'recommended',
};

export const SOURCE_BLURB: Record<string, string> = {
  official:       'Verified against an official government source (AEAT, extranjería, BOE).',
  recommendation: 'Camino’s practical recommendation — not a legal requirement. How strongly we suggest it is shown by its priority; confirm the specifics for your own case.',
};

export const SOURCE_COLOR: Record<string, string> = {
  official:       palette.cobalt,
  recommendation: '#9A7B4F',
};

export function timingDetail(obj: Objective): string {
  const t = obj.timing;
  if (t.state === 'recurring') return 'This repeats every year for as long as it applies to you.';
  if (t.state === 'pending_anchor') {
    const evt = t.anchor === 'arrival'              ? 'you arrive in Spain'
              : t.anchor === 'residency_established' ? 'your residency is established'
              : t.anchor === 'property_purchase'     ? 'you complete your property purchase'
              :                                        'an earlier step is done';
    return `This can't be given a date until ${evt}.`;
  }
  if (t.estimated) return 'This date is an estimate based on typical timelines — give Lola firm dates to sharpen it.';
  return 'A firm date based on what you told Lola.';
}

export function formatTiming(obj: Objective): string {
  const t = obj.timing;
  if (t.state === 'scheduled') {
    const due = t.due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Due ${due}${t.estimated ? ' (est.)' : ''}`;
  }
  if (t.state === 'recurring') {
    const next = t.nextDue.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Next due ${next} · yearly`;
  }
  return `Starts once ${t.anchor.replace(/_/g, ' ')}`;
}
