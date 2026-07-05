/**
 * The printable report — a pure function of the plan (THESIS piece 4).
 * Honesty as UI: one hero step, estimated vs firm dates, dateless pending steps
 * ("starts once X happens"), overdue in red, done in olive. Inline styles only,
 * A4-friendly, page-break aware — built for the fridge door and the gestor.
 *
 * No LLM, no network: (objectives, today, lang) → HTML string. Shared by web
 * (print dialog → save as PDF) and native (expo-print → share sheet).
 * L1: strings come from locales/<lang>/emails.json "report" (pure JSON — this module
 * must stay importable server-side, so no lib/i18n here); step titles resolve through
 * the same per-locale catalog as the app. English output is snapshot-pinned.
 */
import { isOverdue, type Objective, type Phase } from '../core/engine-controller';
import { emailStrings, interp, emailDateLocale, type EmailLang } from './serverLocale';
import { ES_CATALOG_TITLES } from '../core/i18n/es/catalog';

const PHASE_ORDER: Phase[] = ['before_you_go', 'first_weeks', 'ongoing', 'when_settled'];

// Print-safe palette: the app's muted blue-gray (#8A9BB0) reads fine on screens but washes
// out on paper and cheap-toner printers (build-25 QA finding) — the report uses a darker
// slate for secondary text instead. Accents (cobalt/amber/olive/red) stay brand.
const C = {
  cobalt: '#2B5AA3', indigo: '#15243B', amber: '#BD8318', olive: '#5E7355',
  cal: '#FBFAF7', muted: '#4A5A70', faint: '#5B6B80', red: '#C0392B', line: '#D8D2C8',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type R = ReturnType<typeof emailStrings>['report'];

function dueLine(o: Objective, today: Date, R: R, fmt: (d: Date) => string): { text: string; color: string } {
  if (o.done) {
    return { text: o.completedOn ? interp(R.doneOn, { date: fmt(o.completedOn) }) : R.doneBare, color: C.olive };
  }
  const t = o.timing;
  if (t.state === 'pending_anchor') {
    const event = (R.anchor as Record<string, string>)[t.anchor] ?? R.anchor.other;
    return { text: interp(R.startsOnce, { event }), color: C.muted };
  }
  if (t.state === 'recurring') {
    return { text: interp(R.everyYear, { date: fmt(t.nextDue) }), color: C.indigo };
  }
  if (isOverdue(o, today)) {
    return { text: interp(R.overdueLine, { date: fmt(t.due) }), color: C.red };
  }
  return { text: interp(R.dueLine, { date: fmt(t.due) }) + (t.estimated ? R.estimatedSuffix : ''), color: C.indigo };
}

const SEV_INK: Record<string, string> = {
  penalty: C.red, required: C.cobalt, recommended: C.olive, info: C.muted,
};

function itemHtml(o: Objective, today: Date, R: R, fmt: (d: Date) => string, title: string): string {
  const due = dueLine(o, today, R, fmt);
  const src = o.source === 'official' && o.source_url
    ? `<div style="font-size:10px;color:${C.faint};margin-top:2px;word-break:break-all;">${R.sourcePrefix}${esc(o.source_url)}</div>`
    : '';
  return `<div style="page-break-inside:avoid;padding:8px 0 8px 12px;border-left:3px solid ${o.done ? C.olive : SEV_INK[o.severity]};border-bottom:1px solid ${C.line};">
    <div style="font-size:12px;line-height:16px;color:${o.done ? C.olive : C.indigo};${o.done ? 'text-decoration:line-through;text-decoration-thickness:1px;' : ''}">${o.done ? '✓ ' : ''}${esc(title)}</div>
    <div style="font-size:10px;line-height:15px;margin-top:2px;">
      <span style="color:${due.color};font-weight:600;">${esc(due.text)}</span>
      <span style="color:${C.muted};"> · ${esc((R.severity as Record<string, string>)[o.severity])} · ${o.source === 'official' ? R.official : R.recommendation}${o.regional ? ` · ${R.regional}` : ''}</span>
    </div>
    ${src}
  </div>`;
}

export function reportHtml(objectives: Objective[], today: Date = new Date(), lang: EmailLang = 'en'): string {
  const R = emailStrings(lang).report;
  const fmt = (d: Date) => d.toLocaleDateString(emailDateLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' });
  const titleOf = (o: Objective) => (lang === 'es' ? ES_CATALOG_TITLES[o.id] ?? o.title : o.title);

  const hero = objectives.find(o => !o.done) ?? null;
  const done = objectives.filter(o => o.done).length;
  const required = objectives.filter(o => o.severity === 'required' || o.severity === 'penalty').length;
  const overdue = objectives.filter(o => isOverdue(o, today)).length;

  const phases = PHASE_ORDER
    .map((phase: Phase) => ({ phase, items: objectives.filter(o => o.phase === phase) }))
    .filter(g => g.items.length > 0);

  const heroBlock = hero ? (() => {
    const due = dueLine(hero, today, R, fmt);
    return `<div style="page-break-inside:avoid;background:#FFFFFF;border:2px solid ${C.amber};border-radius:10px;padding:14px 16px;margin:18px 0 6px;">
      <div style="font-size:9px;letter-spacing:2px;color:${C.amber};font-weight:700;margin-bottom:6px;">${R.nextStep}</div>
      <div style="font-size:15px;line-height:20px;color:${C.indigo};font-weight:600;">${esc(titleOf(hero))}</div>
      <div style="font-size:11px;margin-top:4px;color:${due.color};font-weight:600;">${esc(due.text)}</div>
    </div>`;
  })() : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${R.title}</title>
<style>@page { margin: 18mm 15mm; } body { margin: 0; }</style></head>
<body style="background:${C.cal};font-family:Georgia,'Times New Roman',serif;color:${C.indigo};">
<!-- Container padding is the margin fallback: iOS's HTML→PDF renderer ignores @page
     (build-25 QA finding: zero print margins), so the page must carry its own. -->
<div style="max-width:720px;margin:0 auto;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;">

  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid ${C.indigo};padding-bottom:10px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;">Get Camino <span style="font-size:12px;color:${C.muted};font-style:italic;">${R.tagline}</span></div>
    <div style="font-size:10px;color:${C.muted};">${interp(R.generated, { date: fmt(today) })}</div>
  </div>

  <div style="display:flex;gap:18px;margin-top:12px;font-size:11px;color:${C.muted};">
    <span><b style="color:${C.indigo};font-size:14px;">${objectives.length}</b> ${R.steps}</span>
    <span><b style="color:${C.cobalt};font-size:14px;">${required}</b> ${R.required}</span>
    <span><b style="color:${C.olive};font-size:14px;">${done}</b> ${R.done}</span>
    ${overdue > 0 ? `<span><b style="color:${C.red};font-size:14px;">${overdue}</b> ${R.overdue}</span>` : ''}
  </div>

  ${heroBlock}

  ${phases.map(({ phase, items }) => `
  <div style="margin-top:20px;">
    <div style="font-size:10px;letter-spacing:2px;color:${C.muted};font-weight:700;border-bottom:1px solid ${C.indigo};padding-bottom:4px;">${esc((R.phase as Record<string, string>)[phase]).toUpperCase()} · ${items.length}</div>
    ${items.map(o => itemHtml(o, today, R, fmt, titleOf(o))).join('')}
  </div>`).join('')}

  <div style="margin-top:24px;padding-top:10px;border-top:1px solid ${C.line};font-size:10px;line-height:15px;color:${C.faint};">
    ${R.footerHonesty}
    <br>${R.footerMade}
  </div>
</div>
</body></html>`;
}
