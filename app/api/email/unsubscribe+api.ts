/**
 * GET/POST /api/email/unsubscribe?uid=<user_id>&sig=<hmac> — one-click weekly-roundup opt-out.
 * No session needed: the HMAC (keyed by CRON_SECRET) proves the link came from an email we
 * sent to that user. POST exists for RFC 8058 List-Unsubscribe-Post (Gmail's one-click).
 * Sets `weekly_optout: true` in auth metadata; welcome stays (transactional, one-time).
 */
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubToken } from '@/lib/emailTokens';
import { captureServerError } from '@/lib/sentryServer';

async function unsubscribe(request: Request): Promise<Response> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!url || !service || !cronSecret) return new Response('Not configured', { status: 501 });

  const q = new URL(request.url).searchParams;
  const uid = q.get('uid') ?? '';
  const sig = q.get('sig') ?? '';
  if (!uid || !sig || !(await verifyUnsubToken(cronSecret, uid, sig))) {
    return new Response('Invalid unsubscribe link', { status: 400 });
  }

  try {
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.updateUserById(uid, { user_metadata: { weekly_optout: true } });
    if (error) throw error;
  } catch (e) {
    captureServerError(e, { route: 'email/unsubscribe' });
    return new Response('Something went wrong — please try again.', { status: 500 });
  }

  return new Response(
    `<!doctype html><html><body style="margin:0;background:#FBFAF7;font-family:Georgia,serif;color:#15243B;">
     <div style="max-width:560px;margin:80px auto;padding:0 24px;text-align:center;">
       <div style="font-size:22px;font-weight:600;">Camino</div>
       <p style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;margin-top:24px;">
         Done — no more weekly roundups.<br>Your roadmap stays right where it is,
         and you can keep using Camino as always.
       </p>
       <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A9BB0;">
         Changed your mind? Just ask Lola in the app.
       </p>
     </div></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export const GET = unsubscribe;
export const POST = unsubscribe;
