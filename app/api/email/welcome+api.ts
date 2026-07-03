/**
 * POST /api/email/welcome — send the welcome email to the CALLER (once, ever).
 *
 * Auth: `Authorization: Bearer <supabase access token>` — the route only ever emails the
 * verified owner of that token, so it can't be pointed at other people's inboxes.
 * Dedupe: `welcomed_at` in the user's auth metadata (set server-side with the service role;
 * no schema migration, and the client can't forge it ahead of time to suppress the send —
 * worst case a prankster suppresses their own welcome email).
 *
 * Client calls this fire-and-forget after sign-in when metadata lacks `welcomed_at`;
 * the server re-checks, so double-fires and multi-device races collapse to one email.
 */
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/serverEmail';
import { welcomeEmail, unsubFooter } from '@/lib/emailTemplates';
import { signUnsubToken } from '@/lib/emailTokens';
import { captureServerError } from '@/lib/sentryServer';

export async function POST(request: Request): Promise<Response> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return Response.json({ error: 'supabase env missing' }, { status: 500 });
  if (!service) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured yet' }, { status: 501 });

  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'missing bearer token' }, { status: 401 });

  try {
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await auth.auth.getUser(token);
    if (error || !user?.email) return Response.json({ error: 'invalid token' }, { status: 401 });
    if ((user.user_metadata as Record<string, unknown> | null)?.welcomed_at) {
      return Response.json({ sent: false, reason: 'already welcomed' });
    }

    const origin = new URL(request.url).origin;
    const cronSecret = process.env.CRON_SECRET;
    const unsubUrl = cronSecret
      ? `${origin}/api/email/unsubscribe?uid=${user.id}&sig=${await signUnsubToken(cronSecret, user.id)}`
      : null;

    await sendEmail({ to: user.email, ...welcomeEmail({ planUrl: `${origin}/plan`, unsubHtml: unsubFooter(unsubUrl) }) });

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { welcomed_at: new Date().toISOString() },
    });

    return Response.json({ sent: true });
  } catch (e) {
    captureServerError(e, { route: 'email/welcome' });
    return Response.json({ error: 'welcome failed' }, { status: 500 });
  }
}
