import type { Digest, DigestItem } from '@/core/email-digest';

/**
 * The three transactional emails, hand-rolled HTML + plain-text twins.
 * Inline styles only (email clients strip <style>), single column, max 560px —
 * the boring, deliverable kind of email. Palette mirrors constants/Colors.ts.
 * No react-email dependency: three templates don't earn a framework.
 */

// Keep in sync with constants/Colors.ts (can't import it here: it sits next to RN code).
const C = {
  cobalt: '#2B5AA3',
  indigo: '#15243B',
  amber:  '#BD8318',
  cal:    '#FBFAF7',
  muted:  '#8A9BB0',
  red:    '#C0392B',
  redBg:  '#FBEFED',
};

export type RenderedEmail = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.cal};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:${C.indigo};">
  <div style="font-size:22px;font-weight:600;margin-bottom:24px;">Get Camino <span style="color:${C.muted};font-size:14px;font-style:italic;">— your road to Spain</span></div>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #E8E4DC;margin:32px 0 16px;">
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${C.muted};">
    ${footerHtml}
    <br>Guidance only — not legal or tax advice.
  </div>
</div>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.cobalt};color:#FFFFFF;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(label)}</a>`;

const p = (html: string) =>
  `<p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">${html}</p>`;

// ── Welcome ────────────────────────────────────────────────────────────────────

export function welcomeEmail(opts: { planUrl: string; unsubHtml: string }): RenderedEmail {
  const subject = 'Welcome to Get Camino — your road to Spain starts here';
  const html = shell(
    p('Hola — I’m Lola.') +
    p('Get Camino turns your move to Spain into a step-by-step roadmap: every visa, form and deadline that applies to <em>your</em> situation, in the right order, each one backed by an official source.') +
    p('Your roadmap lives here — it updates as your plans change, and I’ll coach you through any step you tap:') +
    `<div style="margin:24px 0;">${button(opts.planUrl, 'Open your roadmap')}</div>` +
    p(`While your move is underway I’ll send a short weekly roundup — what’s coming up, what’s slipped, never more than a handful of tasks.`),
    opts.unsubHtml
  );
  const text = [
    'Hola — I’m Lola.',
    '',
    'Get Camino turns your move to Spain into a step-by-step roadmap: every visa, form and deadline that applies to your situation, in the right order, backed by official sources.',
    '',
    `Open your roadmap: ${opts.planUrl}`,
    '',
    'While your move is underway I’ll send a short weekly roundup — never more than a handful of tasks.',
  ].join('\n');
  return { subject, html, text };
}

// ── Weekly roundup ─────────────────────────────────────────────────────────────

function itemHtml(it: DigestItem): string {
  const badge = it.overdue
    ? `<span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:${C.red};background:${C.redBg};border:1px solid ${C.red};border-radius:4px;padding:2px 6px;">OVERDUE</span> `
    : '';
  const when = `<span style="color:${it.overdue ? C.red : C.muted};">${esc(it.whenLabel)}</span>`;
  const src = it.source_url
    ? ` &nbsp;·&nbsp; <a href="${it.source_url}" style="color:${C.cobalt};">official source ↗</a>`
    : '';
  return `<div style="margin:0 0 18px;padding:14px 16px;background:#FFFFFF;border:1px solid #E8E4DC;border-radius:10px;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:22px;">${badge}${esc(it.title)}</div>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;margin-top:4px;">${when}${src}</div>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#4A5A70;margin-top:6px;">${esc(it.tip)}</div>
  </div>`;
}

export function roundupEmail(opts: { digest: Digest; planUrl: string; unsubHtml: string }): RenderedEmail {
  const { digest } = opts;
  const n = digest.overdue.length + digest.upcoming.length;
  const subject = digest.overdue.length > 0
    ? `Your Get Camino week: ${digest.overdue.length} overdue, ${digest.upcoming.length} coming up`
    : `Your Get Camino week: ${n === 1 ? 'one thing' : `${n} things`} coming up`;

  const sectionH = (label: string, color: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:${color};margin:24px 0 12px;">${label}</div>`;

  let body = p('Hola — here’s where your road to Spain stands this week.');
  if (digest.overdue.length > 0) {
    body += sectionH('SLIPPED PAST', C.red) + digest.overdue.map(itemHtml).join('');
    body += p(`<span style="font-size:13px;color:#4A5A70;">Already done one of these? Mark it done with the real date and your plan re-flows. Plans changed? Tell me what happened and I’ll remodel the roadmap.</span>`);
  }
  if (digest.upcoming.length > 0) {
    body += sectionH('COMING UP', C.amber) + digest.upcoming.map(itemHtml).join('');
  }
  if (digest.moreCount > 0) {
    body += p(`<span style="color:${C.muted};">…and ${digest.moreCount} more after these — one step at a time.</span>`);
  }
  body += `<div style="margin:24px 0;">${button(opts.planUrl, 'Open your full roadmap')}</div>`;

  const html = shell(body, opts.unsubHtml);

  const line = (it: DigestItem) =>
    `${it.overdue ? '[OVERDUE] ' : ''}${it.title} — ${it.whenLabel}${it.source_url ? `\n  official source: ${it.source_url}` : ''}\n  tip: ${it.tip}`;
  const text = [
    'Hola — here’s where your road to Spain stands this week.',
    '',
    ...digest.overdue.map(line),
    ...digest.upcoming.map(line),
    digest.moreCount > 0 ? `…and ${digest.moreCount} more after these.` : '',
    '',
    `Open your full roadmap: ${opts.planUrl}`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

// ── Unfinished-interview nudge ─────────────────────────────────────────────────

export function nudgeEmail(opts: { interviewUrl: string; unsubHtml: string }): RenderedEmail {
  const subject = 'Your Spain roadmap is waiting — a few questions to go';
  const html = shell(
    p('Hola — Lola here.') +
    p('You started telling me about your move to Spain, and I’d hate for that head start to go to waste. A few more answers and I can lay out your full roadmap — every step that applies to you, in the right order, with real deadlines.') +
    `<div style="margin:24px 0;">${button(opts.interviewUrl, 'Pick up where you left off')}</div>` +
    p(`<span style="font-size:13px;color:#4A5A70;">It usually takes two or three minutes. Your earlier answers are saved.</span>`),
    opts.unsubHtml
  );
  const text = [
    'Hola — Lola here.',
    '',
    'You started telling me about your move to Spain. A few more answers and I can lay out your full roadmap.',
    '',
    `Pick up where you left off: ${opts.interviewUrl}`,
  ].join('\n');
  return { subject, html, text };
}

// ── Shared footer link ─────────────────────────────────────────────────────────

export function unsubFooter(unsubUrl: string | null): string {
  return unsubUrl
    ? `You’re getting this because you have a Get Camino roadmap. <a href="${unsubUrl}" style="color:${C.muted};">Unsubscribe from the weekly roundup</a>.`
    : 'You’re getting this because you have a Get Camino roadmap.';
}
