/**
 * Weighted interview completeness (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 *
 * Replaces "Question 3 of 11" with a roadmap-anchored "% complete": each slot is weighted by how
 * many catalog obligations its answer helps decide, so high-leverage questions (nationalities,
 * work_situation, intends_long_stay) move the bar a lot and low-leverage ones (has_pets) barely
 * nudge it. This ties the number to "how much of your roadmap is determined" and drives the
 * resume nudge. v1 weighting is count-only (user decision 2026-07-09); severity-weighting deferred.
 *
 * The monotonic clamp and the 95%-until-done display cap live in the UI (see the redesign doc) —
 * this module stays a pure function of the profile.
 */
import { CATALOG } from './engine-controller';
import { SLOTS, DERIVATIONS, isSlotApplicable, type Profile } from './interview-controller';

// Condition is a private type in engine-controller; we only need to walk its shape to collect the
// field names it references, so traverse structurally.
type ConditionLike =
  | { all: ConditionLike[] } | { any: ConditionLike[] } | { not: ConditionLike }
  | { field: string } | unknown;

function collectFields(c: ConditionLike, out: Set<string>): void {
  if (!c || typeof c !== 'object') return;
  if ('all' in c) { (c.all as ConditionLike[]).forEach(x => collectFields(x, out)); return; }
  if ('any' in c) { (c.any as ConditionLike[]).forEach(x => collectFields(x, out)); return; }
  if ('not' in c) { collectFields((c as { not: ConditionLike }).not, out); return; }
  if ('field' in c) out.add((c as { field: string }).field);
}

const SLOT_FIELDS = new Set(SLOTS.map(s => s.field));
const DERIV_FROM = new Map(DERIVATIONS.map(d => [d.field, d.from]));

// A derivation's `from` list is its TRIGGER set (derive() runs it once those fields exist), not
// its full read set — some compute bodies also read optional fields (visa_type branches on
// employer_country_is_foreign for remote employees; is_ex_colony_national ORs in the explicit
// answer). Credit those reads here so the leverage weights don't under-count the questions.
// (2026-07-10 interview audit: employer_country_is_foreign was weighted 1 despite deciding the
// ~20-obligation DNV-vs-work-permit branch.)
const COMPUTE_ALSO_READS: Record<string, string[]> = {
  visa_type: ['employer_country_is_foreign'],
  is_ex_colony_national: ['previously_ex_spanish_colony_nationality'],
};
for (const [field, extra] of Object.entries(COMPUTE_ALSO_READS))
  DERIV_FROM.set(field, [...(DERIV_FROM.get(field) ?? []), ...extra]);

// Expand a referenced field to the underlying answerable slot fields it ultimately depends on.
// A catalog condition may test a derived field (e.g. `visa_type`), which derives from
// `is_eu` + `work_situation` + …; `is_eu` derives from `nationalities`; etc. Resolve transitively
// so the leverage of a derived field is credited to the real questions behind it.
function sourceSlots(field: string, seen = new Set<string>()): string[] {
  if (SLOT_FIELDS.has(field)) return [field];
  if (seen.has(field)) return [];
  seen.add(field);
  const from = DERIV_FROM.get(field);
  if (!from) return [];                       // not a slot and not derived → credits nothing
  return from.flatMap(f => sourceSlots(f, seen));
}

/**
 * Static weight per slot = 1 (floor, so every applicable question always counts) + the number of
 * catalog obligations whose `applies_if` references that slot (directly or via a derivation).
 * Computed once at module load.
 */
export const SLOT_WEIGHT: Record<string, number> = (() => {
  const w: Record<string, number> = {};
  for (const s of SLOTS) w[s.field] = 1;      // floor
  for (const o of CATALOG) {
    const fields = new Set<string>();
    collectFields((o as { applies_if: ConditionLike }).applies_if, fields);
    const slots = new Set<string>();
    for (const f of fields) for (const s of sourceSlots(f)) slots.add(s);
    for (const s of slots) w[s] = (w[s] ?? 1) + 1;
  }
  return w;
})();

export type Completeness = {
  pct: number;              // 0..1, raw (UI applies monotonic clamp + display cap)
  answeredWeight: number;
  totalWeight: number;      // over currently-applicable slots (answered + askable)
  remaining: number;        // count of applicable, unanswered slots
};

export function interviewCompleteness(p: Profile): Completeness {
  let answeredWeight = 0;
  let totalWeight = 0;
  let remaining = 0;
  for (const s of SLOTS) {
    if (!isSlotApplicable(s, p)) continue;    // gated-off branch: doesn't count yet
    const w = SLOT_WEIGHT[s.field] ?? 1;
    totalWeight += w;
    if (s.field in p) answeredWeight += w;
    else remaining++;
  }
  const pct = totalWeight === 0 ? 0 : answeredWeight / totalWeight;
  return { pct, answeredWeight, totalWeight, remaining };
}
