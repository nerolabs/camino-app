/**
 * POST /api/account/delete — permanent, immediate account deletion (user decision
 * 2026-07-04: hard delete, no grace period).
 *
 * Auth: `Authorization: Bearer <supabase access token>` — the route only ever deletes the
 * verified OWNER of the token; there is no way to point it at someone else's account.
 * Order matters: profile row first, then the auth user (which also removes all auth
 * metadata: welcomed_at, weekly_optout, pending_profile…). This is both the Apple
 * 5.1.1(v) requirement and our GDPR right-to-erasure mechanism.
 */
import { createClient } from '@supabase/supabase-js';
import { captureServerError } from '@/lib/sentryServer';

export async function POST(request: Request): Promise<Response> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return Response.json({ error: 'supabase env missing' }, { status: 500 });
  if (!service) return Response.json({ error: 'not configured' }, { status: 501 });

  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'missing bearer token' }, { status: 401 });

  try {
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await auth.auth.getUser(token);
    if (error || !user) return Response.json({ error: 'invalid token' }, { status: 401 });

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: profileErr } = await admin.from('profiles').delete().eq('user_id', user.id);
    if (profileErr) throw profileErr;
    const { error: userErr } = await admin.auth.admin.deleteUser(user.id);
    if (userErr) throw userErr;

    return Response.json({ ok: true });
  } catch (e) {
    captureServerError(e, { route: 'account/delete' });
    return Response.json({ error: 'deletion failed — try again or contact us' }, { status: 500 });
  }
}
