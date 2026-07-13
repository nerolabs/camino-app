/**
 * The ONE profile-delta validator (council fix C1a, 2026-07-13).
 *
 * Three surfaces let an LLM propose changes to the saved profile: the interview's extraction
 * "extras" path, the plan page's "what changed?" re-model, and the interview's final-note
 * distillation. The trust claim is "the LLM never authors plan data" — but only the extras path
 * actually type-checked what it merged; the other two spread the model's raw JSON into the
 * profile. This module is the single check all three now share, so a hallucinated field name or
 * a wrong-typed value can never reach the engine or the database.
 *
 * Pure (no i18n, no React) so it runs anywhere. The engine still re-derives everything from the
 * cleaned profile — this only decides which proposed key/values are structurally legitimate.
 */
import { SLOTS, type Slot, type Profile } from '@/core/interview-controller';

// Anchor dates the engine reads to firm up estimated timings, but which the interview never
// asks (you don't know them until you're in Spain — set later via the "what changed?" flow or
// auto-filled on completion). They aren't in SLOTS, so the validator must allow them explicitly.
// Field names are single-sourced HERE; lib/lolaPrompts.ts pairs them with their prompt hints.
export const KNOWN_LATER_DATE_FIELDS = ['residency_established', 'padron_done'] as const;

const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Does a value structurally satisfy a slot's schema? The single type/enum/date check that
 *  every LLM write-path uses (extracted from the interview extras path). */
export function valueOkForSlot(slot: Slot, v: unknown): boolean {
  return slot.type === 'bool' ? typeof v === 'boolean'
       : slot.type === 'date' ? isIsoDate(v)
       : slot.type === 'list' ? Array.isArray(v) && v.every(x => typeof x === 'string')
       : slot.options       ? typeof v === 'string' && slot.options.includes(v)
       : typeof v === 'string';
}

/**
 * Reduce a raw LLM-proposed delta to only the fields that are real (a known slot or a
 * known-later anchor date) AND whose value type-checks. Unknown keys and wrong-typed values are
 * dropped field-by-field; null/undefined are skipped. The result is safe to spread into a Profile.
 */
export function sanitizeProfileDelta(delta: Record<string, unknown>): Partial<Profile> {
  const clean: Record<string, unknown> = {};
  if (!delta || typeof delta !== 'object') return clean;
  for (const [key, v] of Object.entries(delta)) {
    if (v === undefined || v === null) continue;
    const slot = SLOTS.find(s => s.field === key);
    if (slot) {
      if (valueOkForSlot(slot, v)) clean[key] = v;
      continue;
    }
    if ((KNOWN_LATER_DATE_FIELDS as readonly string[]).includes(key) && isIsoDate(v)) {
      clean[key] = v;
    }
    // else: unknown key the engine doesn't read → dropped
  }
  return clean as Partial<Profile>;
}
