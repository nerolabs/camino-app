import type { Digest, DigestItem } from '@/core/email-digest';
import { emailStrings, interp, type EmailLang } from '@/lib/serverLocale';

/**
 * The three transactional emails, hand-rolled HTML + plain-text twins.
 * Inline styles only (email clients strip <style>), single column, max 560px —
 * the boring, deliverable kind of email. Palette mirrors constants/Colors.ts.
 * No react-email dependency: three templates don't earn a framework.
 *
 * L1: every template takes `lang` and reads its copy from locales/<lang>/emails.json —
 * the caller resolves the user's language (auth user_metadata.lang; see serverLocale.ts).
 * English output is pinned byte-identical to the pre-L1 templates by the render snapshots.
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

function shell(bodyHtml: string, footerHtml: string, lang: EmailLang): string {
  const S = emailStrings(lang);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.cal};">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:${C.indigo};">
  <div style="font-size:22px;font-weight:600;margin-bottom:24px;">Get Camino <span style="color:${C.muted};font-size:14px;font-style:italic;">${S.shell.tagline}</span></div>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #E8E4DC;margin:32px 0 16px;">
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${C.muted};">
    ${footerHtml}
    <br>${S.shell.disclaimer}
  </div>
</div>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.cobalt};color:#FFFFFF;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(label)}</a>`;

const p = (html: string) =>
  `<p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">${html}</p>`;

// ── Welcome ────────────────────────────────────────────────────────────────────

export function welcomeEmail(opts: { planUrl: string; unsubHtml: string; lang?: EmailLang }): RenderedEmail {
  const S = emailStrings(opts.lang ?? 'en').welcome;
  const html = shell(
    p(S.hola) +
    p(S.what) +
    p(S.lives) +
    `<div style="margin:24px 0;">${button(opts.planUrl, S.button)}</div>` +
    p(S.weekly),
    opts.unsubHtml,
    opts.lang ?? 'en'
  );
  const text = [
    S.hola,
    '',
    S.whatText,
    '',
    interp(S.textOpen, { url: opts.planUrl }),
    '',
    S.weeklyText,
  ].join('\n');
  return { subject: S.subject, html, text };
}

// ── Weekly roundup ─────────────────────────────────────────────────────────────

function itemHtml(it: DigestItem, R: ReturnType<typeof emailStrings>['roundup']): string {
  const badge = it.overdue
    ? `<span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:${C.red};background:${C.redBg};border:1px solid ${C.red};border-radius:4px;padding:2px 6px;">${R.overdueBadge}</span> `
    : '';
  const when = `<span style="color:${it.overdue ? C.red : C.muted};">${esc(it.whenLabel)}</span>`;
  const src = it.source_url
    ? ` &nbsp;·&nbsp; <a href="${it.source_url}" style="color:${C.cobalt};">${R.officialSource}</a>`
    : '';
  return `<div style="margin:0 0 18px;padding:14px 16px;background:#FFFFFF;border:1px solid #E8E4DC;border-radius:10px;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:22px;">${badge}${esc(it.title)}</div>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;margin-top:4px;">${when}${src}</div>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#4A5A70;margin-top:6px;">${esc(it.tip)}</div>
  </div>`;
}

export function roundupEmail(opts: { digest: Digest; planUrl: string; unsubHtml: string; lang?: EmailLang }): RenderedEmail {
  const lang = opts.lang ?? 'en';
  const R = emailStrings(lang).roundup;
  const { digest } = opts;
  const n = digest.overdue.length + digest.upcoming.length;
  const subject = digest.overdue.length > 0
    ? interp(R.subjectOverdue, { overdue: digest.overdue.length, upcoming: digest.upcoming.length })
    : n === 1 ? R.subjectOne : interp(R.subjectMany, { count: n });

  const sectionH = (label: string, color: string) =>
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:${color};margin:24px 0 12px;">${label}</div>`;

  let body = p(R.intro);
  if (digest.overdue.length > 0) {
    body += sectionH(R.slippedPast, C.red) + digest.overdue.map(it => itemHtml(it, R)).join('');
    body += p(`<span style="font-size:13px;color:#4A5A70;">${R.reflow}</span>`);
  }
  if (digest.upcoming.length > 0) {
    body += sectionH(R.comingUp, C.amber) + digest.upcoming.map(it => itemHtml(it, R)).join('');
  }
  if (digest.moreCount > 0) {
    body += p(`<span style="color:${C.muted};">${interp(R.more, { count: digest.moreCount })}</span>`);
  }
  body += `<div style="margin:24px 0;">${button(opts.planUrl, R.button)}</div>`;

  const html = shell(body, opts.unsubHtml, lang);

  const line = (it: DigestItem) =>
    `${it.overdue ? `[${R.overdueBadge}] ` : ''}${it.title} — ${it.whenLabel}${it.source_url ? `\n  ${interp(R.textOfficialSource, { url: it.source_url })}` : ''}\n  ${interp(R.textTip, { tip: it.tip })}`;
  const text = [
    R.intro,
    '',
    ...digest.overdue.map(line),
    ...digest.upcoming.map(line),
    digest.moreCount > 0 ? interp(R.moreText, { count: digest.moreCount }) : '',
    '',
    interp(R.textOpen, { url: opts.planUrl }),
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

// ── Unfinished-interview nudge ─────────────────────────────────────────────────

export function nudgeEmail(opts: { interviewUrl: string; unsubHtml: string; lang?: EmailLang }): RenderedEmail {
  const lang = opts.lang ?? 'en';
  const S = emailStrings(lang).nudge;
  const html = shell(
    p(S.hola) +
    p(S.body) +
    `<div style="margin:24px 0;">${button(opts.interviewUrl, S.button)}</div>` +
    p(`<span style="font-size:13px;color:#4A5A70;">${S.note}</span>`),
    opts.unsubHtml,
    lang
  );
  const text = [
    S.hola,
    '',
    S.bodyText,
    '',
    interp(S.textOpen, { url: opts.interviewUrl }),
  ].join('\n');
  return { subject: S.subject, html, text };
}

// ── Shared footer link ─────────────────────────────────────────────────────────

export function unsubFooter(unsubUrl: string | null, lang: EmailLang = 'en'): string {
  const F = emailStrings(lang).footer;
  return unsubUrl
    ? `${F.because} <a href="${unsubUrl}" style="color:${C.muted};">${F.unsubscribe}</a>.`
    : F.because;
}
