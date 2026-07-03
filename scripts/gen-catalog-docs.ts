/**
 * Generates docs/CATALOG.md — the human-reviewable map of the whole deterministic core:
 * every interview question, every derivation, every obligation, and exactly which answers
 * gate which obligations (the branching), plus a Mermaid graph of the field flow.
 *
 * Run: `npm run docs:catalog`. Output is DERIVED from SLOTS + DERIVATIONS + CATALOG, so it can
 * never drift from the code — regenerate after any catalog/interview change (CI's audit checks
 * the underlying contract; this file is the readable view of it).
 */
import fs from 'fs';
import { CATALOG } from '../core/engine-controller';
import { SLOTS, DERIVATIONS } from '../core/interview-controller';

type Cond =
  | { all: Cond[] } | { any: Cond[] } | { not: Cond }
  | { field: string; op: string; value?: unknown };

function condStr(c: Cond): string {
  if ('all' in c) return c.all.map(condStr).join(' AND ');
  if ('any' in c) return '(' + c.any.map(condStr).join(' OR ') + ')';
  if ('not' in c) return 'NOT ' + condStr(c.not);
  if (c.op === 'exists') return `${c.field} is known`;
  const v = Array.isArray(c.value) ? `[${c.value.join(', ')}]` : JSON.stringify(c.value);
  return `${c.field} ${c.op === 'eq' ? '=' : c.op} ${v}`;
}

function condFields(c: Cond, out: Set<string>): void {
  if ('all' in c) c.all.forEach(x => condFields(x, out));
  else if ('any' in c) c.any.forEach(x => condFields(x, out));
  else if ('not' in c) condFields(c.not, out);
  else out.add(c.field);
}

function timingStr(t: { kind: string; anchor?: string; offset_days?: number; after?: string; rrule?: string }): string {
  switch (t.kind) {
    case 'asap': return 'ASAP (window from arrival)';
    case 'relative_to_event': {
      const d = t.offset_days ?? 0;
      const rel = d === 0 ? 'at' : d > 0 ? `+${d}d after` : `${d}d before`;
      return `${rel} ${t.anchor}`;
    }
    case 'relative_to_obligation': return `+${t.offset_days}d after \`${t.after}\``;
    case 'absolute_recurring': {
      const months = t.rrule?.match(/BYMONTH=([\d,]+)/)?.[1] ?? '';
      return `yearly (months: ${months})`;
    }
    default: return t.kind;
  }
}

const esc = (s: string) => s.replace(/\|/g, '\\|');
const today = new Date().toISOString().slice(0, 10);

let md = `# The Camino catalog — obligations × the questions that gate them

> **Generated** by \`npm run docs:catalog\` on ${today} — do not hand-edit; regenerate after any
> catalog or interview change. This is the human-reviewable view of the deterministic core:
> which interview answers exist, what gets derived from them, and exactly which combination
> switches each obligation on.

**Totals:** ${CATALOG.length} obligations · ${SLOTS.length} interview questions · ${DERIVATIONS.length} derivations.

## 1 · The interview (every question asked)

| # | Field | Type | Asked when | Hint (what Lola asks about) |
|---|---|---|---|---|
`;

SLOTS.forEach((s, i) => {
  const when = s.required_if ? esc(condStr(s.required_if as Cond)) : 'always';
  md += `| ${i + 1} | \`${s.field}\` | ${s.type} | ${when} | ${esc(s.prompt_hint.slice(0, 110))}${s.prompt_hint.length > 110 ? '…' : ''} |\n`;
});

md += `
## 2 · Derivations (fields computed, never asked)

| Derived field | Computed from |
|---|---|
`;
for (const d of DERIVATIONS) {
  md += `| \`${d.field}\` | ${d.from.map(f => `\`${f}\``).join(', ')} |\n`;
}

md += `
## 3 · The obligations (what applies, when)

| Obligation | Sev | Source | Applies when | Depends on | Timing |
|---|---|---|---|---|---|
`;
for (const o of CATALOG) {
  const deps = o.depends_on.length ? o.depends_on.map(d => `\`${d}\``).join('<br>') : '—';
  md += `| \`${o.id}\` | ${o.severity} | ${o.source} | ${esc(condStr(o.applies_if as Cond))} | ${deps} | ${esc(timingStr(o.timing as never))} |\n`;
}

// ── Reverse index: which answers unlock what ─────────────────────────────────
const byField = new Map<string, string[]>();
for (const o of CATALOG) {
  const used = new Set<string>();
  condFields(o.applies_if as Cond, used);
  for (const f of used) {
    if (!byField.has(f)) byField.set(f, []);
    byField.get(f)!.push(o.id);
  }
}

md += `
## 4 · The branching — which fields gate which obligations

Every field that any \`applies_if\` tests, and the obligations that hinge on it. This is the
review view: change an answer, these are the items that can appear or disappear.

| Field | Gates (${[...byField.values()].reduce((a, b) => a + b.length, 0)} references) |
|---|---|
`;
for (const [field, ids] of [...byField.entries()].sort((a, b) => b[1].length - a[1].length)) {
  md += `| \`${field}\` | ${ids.map(i => `\`${i}\``).join(' · ')} |\n`;
}

// ── Mermaid: slots → derivations (the field-flow graph; obligations are the tables above) ──
md += `
## 5 · Field-flow graph (questions → derived fields)

Obligations hang off these fields per the tables above; drawing all ${CATALOG.length} would be
unreadable, so this graph shows how raw answers become the derived switches.

\`\`\`mermaid
flowchart LR
  subgraph Asked["Interview answers"]
`;
const derivedNames = new Set(DERIVATIONS.map(d => d.field));
const usedAsInput = new Set(DERIVATIONS.flatMap(d => d.from));
for (const s of SLOTS) {
  if (usedAsInput.has(s.field)) md += `    ${s.field}[${s.field}]\n`;
}
md += `  end
  subgraph Derived["Derived (never asked)"]
`;
for (const d of DERIVATIONS) md += `    ${d.field}((${d.field}))\n`;
md += `  end\n`;
for (const d of DERIVATIONS) {
  for (const f of d.from) md += `  ${f} --> ${d.field}\n`;
}
md += `\`\`\`

## 6 · Direct-gate fields (asked, used as-is by obligations)

${[...byField.keys()].filter(f => !derivedNames.has(f)).map(f => `\`${f}\``).join(' · ')}
`;

fs.writeFileSync('docs/CATALOG.md', md);
console.log(`docs/CATALOG.md written: ${CATALOG.length} obligations, ${SLOTS.length} slots, ${DERIVATIONS.length} derivations, ${byField.size} gating fields.`);
