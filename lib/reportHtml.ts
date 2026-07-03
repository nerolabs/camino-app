/**
 * The printable report — a pure function of the plan (THESIS piece 4).
 * Honesty as UI: one hero step, estimated vs firm dates, dateless pending steps
 * ("starts once X happens"), overdue in red, done in olive. Inline styles only,
 * A4-friendly, page-break aware — built for the fridge door and the gestor.
 *
 * No LLM, no network: (objectives, today) → HTML string. Shared by web
 * (print dialog → save as PDF) and native (expo-print → share sheet).
 */
import { isOverdue, type Objective, type Phase } from '../core/engine-controller';

// Local copies of the display maps (keep in sync with lib/plan-format.ts): importing
// plan-format would drag react-native into this module, and the report must stay pure —
// it runs in vitest and could one day run server-side.
const PHASE_ORDER: Phase[] = ['before_you_go', 'first_weeks', 'ongoing', 'when_settled'];
const PHASE_LABELS: Record<Phase, string> = {
  before_you_go: 'Before you go', first_weeks: 'First weeks',
  ongoing: 'Ongoing', when_settled: 'When settled',
};
const SEV_LABEL: Record<string, string> = {
  penalty: 'Penalty risk', required: 'Required', recommended: 'Recommended', info: 'Info',
};

const C = {
  cobalt: '#2B5AA3', indigo: '#15243B', amber: '#BD8318', olive: '#5E7355',
  cal: '#FBFAF7', muted: '#8A9BB0', red: '#C0392B', line: '#E8E4DC',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const ANCHOR_PROSE: Record<string, string> = {
  arrival: 'you arrive in Spain',
  residency_established: 'your residency is established',
  padron_done: 'your padrón registration is done',
  property_purchase: 'you complete your property purchase',
};

function dueLine(o: Objective, today: Date): { text: string; color: string } {
  if (o.done) {
    return { text: o.completedOn ? `Done · ${fmt(o.completedOn)}` : 'Done', color: C.olive };
  }
  const t = o.timing;
  if (t.state === 'pending_anchor') {
    return { text: `Starts once ${ANCHOR_PROSE[t.anchor] ?? 'an earlier step is done'}`, color: C.muted };
  }
  if (t.state === 'recurring') {
    return { text: `Every year · next due ${fmt(t.nextDue)}`, color: C.indigo };
  }
  if (isOverdue(o, today)) {
    return { text: `Overdue · was due ${fmt(t.due)}`, color: C.red };
  }
  return { text: `Due ${fmt(t.due)}${t.estimated ? ' (estimated)' : ''}`, color: C.indigo };
}

const SEV_INK: Record<string, string> = {
  penalty: C.red, required: C.cobalt, recommended: C.olive, info: C.muted,
};

function itemHtml(o: Objective, today: Date): string {
  const due = dueLine(o, today);
  const src = o.source === 'official' && o.source_url
    ? `<div style="font-size:9px;color:${C.muted};margin-top:2px;word-break:break-all;">Official source: ${esc(o.source_url)}</div>`
    : '';
  return `<div style="page-break-inside:avoid;padding:8px 0 8px 12px;border-left:3px solid ${o.done ? C.olive : SEV_INK[o.severity]};border-bottom:1px solid ${C.line};">
    <div style="font-size:12px;line-height:16px;color:${o.done ? C.olive : C.indigo};${o.done ? 'text-decoration:line-through;text-decoration-thickness:1px;' : ''}">${o.done ? '✓ ' : ''}${esc(o.title)}</div>
    <div style="font-size:10px;line-height:15px;margin-top:2px;">
      <span style="color:${due.color};font-weight:600;">${esc(due.text)}</span>
      <span style="color:${C.muted};"> · ${esc(SEV_LABEL[o.severity])} · ${o.source === 'official' ? 'official requirement' : 'Camino recommendation'}</span>
    </div>
    ${src}
  </div>`;
}

export function reportHtml(objectives: Objective[], today: Date = new Date()): string {
  const hero = objectives.find(o => !o.done) ?? null;
  const done = objectives.filter(o => o.done).length;
  const required = objectives.filter(o => o.severity === 'required' || o.severity === 'penalty').length;
  const overdue = objectives.filter(o => isOverdue(o, today)).length;

  const phases = PHASE_ORDER
    .map((phase: Phase) => ({ phase, items: objectives.filter(o => o.phase === phase) }))
    .filter(g => g.items.length > 0);

  const heroBlock = hero ? (() => {
    const due = dueLine(hero, today);
    return `<div style="page-break-inside:avoid;background:#FFFFFF;border:2px solid ${C.amber};border-radius:10px;padding:14px 16px;margin:18px 0 6px;">
      <div style="font-size:9px;letter-spacing:2px;color:${C.amber};font-weight:700;margin-bottom:6px;">YOUR NEXT STEP</div>
      <div style="font-size:15px;line-height:20px;color:${C.indigo};font-weight:600;">${esc(hero.title)}</div>
      <div style="font-size:11px;margin-top:4px;color:${due.color};font-weight:600;">${esc(due.text)}</div>
    </div>`;
  })() : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Camino — your road to Spain</title>
<style>@page { margin: 18mm 15mm; } body { margin: 0; }</style></head>
<body style="background:${C.cal};font-family:Georgia,'Times New Roman',serif;color:${C.indigo};">
<div style="max-width:720px;margin:0 auto;padding:8px 4px;font-family:Helvetica,Arial,sans-serif;">

  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid ${C.indigo};padding-bottom:10px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;">Camino <span style="font-size:12px;color:${C.muted};font-style:italic;">— your road to Spain</span></div>
    <div style="font-size:10px;color:${C.muted};">Generated ${fmt(today)}</div>
  </div>

  <div style="display:flex;gap:18px;margin-top:12px;font-size:11px;color:${C.muted};">
    <span><b style="color:${C.indigo};font-size:14px;">${objectives.length}</b> steps</span>
    <span><b style="color:${C.cobalt};font-size:14px;">${required}</b> required</span>
    <span><b style="color:${C.olive};font-size:14px;">${done}</b> done</span>
    ${overdue > 0 ? `<span><b style="color:${C.red};font-size:14px;">${overdue}</b> overdue</span>` : ''}
  </div>

  ${heroBlock}

  ${phases.map(({ phase, items }) => `
  <div style="margin-top:20px;">
    <div style="font-size:10px;letter-spacing:2px;color:${C.muted};font-weight:700;border-bottom:1px solid ${C.indigo};padding-bottom:4px;">${esc(PHASE_LABELS[phase]).toUpperCase()} · ${items.length}</div>
    ${items.map(o => itemHtml(o, today)).join('')}
  </div>`).join('')}

  <div style="margin-top:24px;padding-top:10px;border-top:1px solid ${C.line};font-size:9px;line-height:14px;color:${C.muted};">
    Estimated dates sharpen as real dates are confirmed; steps without dates begin once their milestone happens — Camino never invents a deadline.
    <br>Made with Camino (getcamino.app). Guidance only — not legal or tax advice; a gestor signs the papers.
  </div>
</div>
</body></html>`;
}
