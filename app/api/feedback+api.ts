/**
 * POST /api/feedback — "report a problem / send feedback", family-testing scale.
 * Emails the message to the team via Resend (no schema, no dashboard to check) with
 * whatever context the client attached. Caps keep it from being a free mail relay:
 * short payloads only, and the recipient is hardcoded — the caller can never choose
 * where it goes.
 */
import { sendEmail, siteOrigin } from '@/lib/serverEmail';
import { feedbackAckEmail } from '@/lib/emailTemplates';
import { resolveEmailLang, type EmailLang } from '@/lib/serverLocale';
import { captureServerError } from '@/lib/sentryServer';
import { corsPreflight, volumeGuard } from '@/lib/apiGuard';
import { sessionGate } from '@/lib/session';

const TEAM_INBOX = 'feedback@getcamino.app';
const MAX_MESSAGE = 2000;
const MAX_FIELD = 200;
// Volume limits (fresh-eyes 2026-07-12: this route had payload caps but unlimited volume —
// an abuser could flood the team inbox / burn Resend quota). A human files at most a few
// reports; the global cap bounds a distributed flood at nuisance level. C9b: raised 200 → 1000
// (the C2c budget-drain alert pages on the 429 cliff, so a real spike is noticed, not swallowed).
const IP_PER_MINUTE = Number(process.env.FEEDBACK_IP_PER_MINUTE ?? 5);
const GLOBAL_PER_DAY = Number(process.env.FEEDBACK_GLOBAL_PER_DAY ?? 1000);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Strict CORS (same posture as /api/lola): handling OPTIONS ourselves opts out of the
// platform's permissive default. Same-origin web and native are never preflighted.
export function OPTIONS(request: Request): Response {
  return corsPreflight(request);
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(request: Request): Promise<Response> {
  // C2b: require a valid Turnstile-derived session token where configured (covers the inbox-flood
  // vector the same way as /api/lola). Native rides its app-side counters as before.
  const gated = await sessionGate(request);
  if (gated) return gated;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'bad payload' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return Response.json({ error: 'empty message' }, { status: 400 });
  if (message.length > MAX_MESSAGE) return Response.json({ error: 'message too long' }, { status: 413 });

  const field = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_FIELD) : '');
  // Topic comes from the contact page's selector; anything unexpected collapses to 'general'
  // so the subject line can never be attacker-chosen text.
  const topic = ['general', 'feedback', 'problem'].includes(body.topic as string)
    ? (body.topic as string) : 'general';
  const ctx = {
    email:    field(body.email),      // optional reply-to, self-reported
    platform: field(body.platform),   // ios / android / web
    version:  field(body.version),    // app version/build
    route:    field(body.route),      // where they were
    env:      process.env.EXPO_PUBLIC_ENV ?? 'unknown',
  };

  // After validation (malformed junk never burns the budget), before the send.
  const limited = await volumeGuard('feedback', request, {
    ipPerMinute: IP_PER_MINUTE, globalPerDay: GLOBAL_PER_DAY,
  });
  if (limited) return limited;

  try {
    await sendEmail({
      to: TEAM_INBOX,
      subject: `Get Camino ${topic} (${ctx.env}${ctx.platform ? ` · ${ctx.platform}` : ''})`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#15243B;">
        <p style="white-space:pre-wrap;">${esc(message)}</p>
        <hr style="border:none;border-top:1px solid #E8E4DC;">
        <p style="font-size:12px;color:#8A9BB0;">
          ${ctx.email ? `From: ${esc(ctx.email)}<br>` : ''}
          Platform: ${esc(ctx.platform || '—')} · Version: ${esc(ctx.version || '—')} ·
          Route: ${esc(ctx.route || '—')} · Env: ${esc(ctx.env)}
        </p>
      </div>`,
      text: `${message}\n\n—\nFrom: ${ctx.email || '—'}\nPlatform: ${ctx.platform || '—'} · Version: ${ctx.version || '—'} · Route: ${ctx.route || '—'} · Env: ${ctx.env}`,
    });

    // C9a: acknowledge the sender if they left a usable address. Fire-and-forget — a failed ack
    // must never fail the report itself, and it's bounded by the same volume caps above.
    if (EMAIL_RE.test(ctx.email)) {
      const lang: EmailLang = resolveEmailLang(typeof body.lang === 'string' ? { lang: body.lang } : null);
      const origin = siteOrigin(request);
      const ack = feedbackAckEmail({ questionsUrl: `${origin}/questions`, changelogUrl: `${origin}/changelog`, lang });
      sendEmail({ to: ctx.email, subject: ack.subject, html: ack.html, text: ack.text })
        .catch(e => captureServerError(e, { route: 'feedback', method: 'ack' }));
    }

    return Response.json({ ok: true });
  } catch (e) {
    captureServerError(e, { route: 'feedback' });
    return Response.json({ error: 'could not send' }, { status: 500 });
  }
}
