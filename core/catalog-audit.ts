/**
 * Catalog ↔ interview contract audit — the live enforcement of invariant 2:
 * "the interview is derived from the catalog; every field any `applies_if` tests
 * must be fillable by a slot or a derivation."
 *
 * (Ported from the original walking-skeleton's auditCatalog(), which had been left behind in a
 * dead file while the live controller shipped with no drift check.)
 *
 * Run via `npm run audit` (scripts/audit-catalog.ts) — also wired into scripts/deploy.sh so a
 * drifted catalog can't deploy. Hard failures exit non-zero; warnings (e.g. official items still
 * missing a source_url during the re-verification pass) just print.
 */
import { CATALOG } from './engine-controller';
import { SLOTS, DERIVATIONS } from './interview-controller';

type Cond =
  | { all: Cond[] } | { any: Cond[] } | { not: Cond }
  | { field: string; op: string; value?: unknown };

// Fields the profile can legitimately carry without an interview slot:
// timing anchors set post-move (known-later), engine inputs with safe defaults, and progress.
const KNOWN_LATER_OR_DEFAULTED = new Set([
  'residency_established', // set by completing `residencia` or the "what changed" flow
  'padron_done',           // set by completing `empadronamiento`
  'urgency',               // engine defaults to 'soon'
  'progress',              // user-reported completion state
]);

function conditionFields(c: Cond, out: Set<string>): void {
  if ('all' in c) c.all.forEach(x => conditionFields(x, out));
  else if ('any' in c) c.any.forEach(x => conditionFields(x, out));
  else if ('not' in c) conditionFields(c.not, out);
  else out.add(c.field);
}

export type AuditResult = { errors: string[]; warnings: string[] };

export function auditCatalog(): AuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const slotFields = new Set(SLOTS.map(s => s.field));
  const derivedFields = new Set(DERIVATIONS.map(d => d.field));
  const ids = new Set(CATALOG.map(o => o.id));

  for (const o of CATALOG) {
    // 1. Every applies_if field must be fillable (invariant 2 — hard failure).
    const used = new Set<string>();
    conditionFields(o.applies_if as Cond, used);
    for (const f of used) {
      if (!slotFields.has(f) && !derivedFields.has(f) && !KNOWN_LATER_OR_DEFAULTED.has(f)) {
        errors.push(`${o.id}: applies_if tests "${f}" — no slot, derivation, or known-later source fills it`);
      }
    }

    // 2. depends_on must reference real obligations (hard failure).
    for (const d of o.depends_on) {
      if (!ids.has(d)) errors.push(`${o.id}: depends_on "${d}" — no such obligation`);
    }

    // 3. relative_to_obligation timing must reference a real obligation (hard failure).
    const t = o.timing as { kind: string; after?: string };
    if (t.kind === 'relative_to_obligation' && t.after && !ids.has(t.after)) {
      errors.push(`${o.id}: timing.after "${t.after}" — no such obligation`);
    }

    // 4. Duplicate ids (hard failure).
    if (CATALOG.filter(x => x.id === o.id).length > 1) {
      errors.push(`duplicate obligation id: ${o.id}`);
    }

    // 5. Official items should cite their source (warning until the re-verification pass lands).
    if (o.source === 'official' && !o.source_url) {
      warnings.push(`${o.id}: source is 'official' but has no source_url`);
    }
  }

  return { errors: [...new Set(errors)], warnings };
}
