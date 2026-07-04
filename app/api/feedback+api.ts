/**
 * POST /api/feedback — "report a problem / send feedback", family-testing scale.
 * Emails the message to the team via Resend (no schema, no dashboard to check) with
 * whatever context the client attached. Caps keep it from being a free mail relay:
 * short payloads only, and the recipient is hardcoded — the caller can never choose
 * where it goes.
 */
import { sendEmail } from '@/lib/serverEmail';
import { captureServerError } from '@/lib/sentryServer';

const TEAM_INBOX = 'feedback@getcamino.app';
const MAX_MESSAGE = 2000;
const MAX_FIELD = 200;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(request: Request): Promise<Response> {
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
  const ctx = {
    email:    field(body.email),      // optional reply-to, self-reported
    platform: field(body.platform),   // ios / android / web
    version:  field(body.version),    // app version/build
    route:    field(body.route),      // where they were
    env:      process.env.EXPO_PUBLIC_ENV ?? 'unknown',
  };

  try {
    await sendEmail({
      to: TEAM_INBOX,
      subject: `Get Camino feedback (${ctx.env}${ctx.platform ? ` · ${ctx.platform}` : ''})`,
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
    return Response.json({ ok: true });
  } catch (e) {
    captureServerError(e, { route: 'feedback' });
    return Response.json({ error: 'could not send' }, { status: 500 });
  }
}
