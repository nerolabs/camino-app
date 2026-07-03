/**
 * POST /api/email/weekly — the weekly send: roundups for finished interviews,
 * one-time nudges for unfinished ones. Trigger: GitHub Actions cron (Mon 06:00 UTC)
 * with `Authorization: Bearer $CRON_SECRET`; also manually via workflow_dispatch.
 *
 * Per user, entirely deterministic:
 *  - opted out (weekly_optout in auth metadata) → nothing.
 *  - finished interview → buildDigest(profile): overdue + upcoming, ≤5 items, per-item
 *    catalog tips. Empty digest → no email (a roundup with nothing to say is spam).
 *    At most one roundup per 6 days (last_roundup_at metadata).
 *  - unfinished/absent interview → one nudge, ever (nudged_at), account ≥24h old.
 *  - "email me my roadmap" users who never clicked their link still get roundups:
 *    their profile rides in auth metadata (pending_profile) until first sign-in.
 *
 * All bookkeeping lives in auth user metadata — no schema migration, and the profiles
 * table's column-level grants stay untouched.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { buildDigest, interviewComplete } from '@/core/email-digest';
import type { Profile } from '@/core/interview-controller';
import { sendEmail, siteOrigin } from '@/lib/serverEmail';
import { roundupEmail, nudgeEmail, unsubFooter } from '@/lib/emailTemplates';
import { signUnsubToken } from '@/lib/emailTokens';
import { captureServerError } from '@/lib/sentryServer';

const MAX_SENDS_PER_RUN = 200;          // plenty at current scale; revisit with growth
const SEND_SPACING_MS = 650;            // Resend free tier: 2 requests/second
const ROUNDUP_MIN_GAP_MS = 6 * 86_400_000;
const NUDGE_MIN_AGE_MS = 24 * 3_600_000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function allUsers(admin: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 10; page++) {           // 10 × 200 = 2000 users; enough for now
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

export async function POST(request: Request): Promise<Response> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!url) return Response.json({ error: 'supabase env missing' }, { status: 500 });
  if (!service || !cronSecret) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET not configured yet' }, { status: 501 });
  }
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (token !== cronSecret) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const origin = siteOrigin(request);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const counts = { roundups: 0, nudges: 0, skipped: 0, errors: 0 };
  const errors: string[] = [];

  try {
    const [users, profilesRes] = await Promise.all([
      allUsers(admin),
      admin.from('profiles').select('user_id, answers'),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    const answersByUser = new Map<string, Profile | null>(
      (profilesRes.data ?? []).map(r => [r.user_id as string, r.answers as Profile | null]));

    let sends = 0;
    for (const user of users) {
      if (sends >= MAX_SENDS_PER_RUN) { counts.skipped++; continue; }
      const md = (user.user_metadata ?? {}) as Record<string, unknown>;
      if (!user.email || md.weekly_optout === true) { counts.skipped++; continue; }

      const answers = answersByUser.get(user.id) ?? (md.pending_profile as Profile | undefined) ?? null;
      const unsubUrl = `${origin}/api/email/unsubscribe?uid=${user.id}&sig=${await signUnsubToken(cronSecret, user.id)}`;
      const unsubHtml = unsubFooter(unsubUrl);
      // RFC 8058 one-click unsubscribe — keeps Gmail/Apple Mail spam scoring happy.
      const headers = {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      };

      try {
        const digest = answers ? buildDigest(answers) : null;
        if (digest) {
          const last = typeof md.last_roundup_at === 'string' ? Date.parse(md.last_roundup_at) : 0;
          if (Date.now() - last < ROUNDUP_MIN_GAP_MS) { counts.skipped++; continue; }
          await sendEmail({ to: user.email, headers, ...roundupEmail({ digest, planUrl: `${origin}/plan`, unsubHtml }) });
          await admin.auth.admin.updateUserById(user.id, { user_metadata: { last_roundup_at: new Date().toISOString() } });
          counts.roundups++; sends++;
          await sleep(SEND_SPACING_MS);
        } else {
          // No digest: interview unfinished, or finished with nothing pressing (→ silence,
          // not a nudge — only genuinely unfinished interviews earn the one-time nudge).
          const needsInterview = !answers || !interviewComplete(answers);
          const oldEnough = Date.now() - Date.parse(user.created_at) > NUDGE_MIN_AGE_MS;
          if (needsInterview && !md.nudged_at && oldEnough) {
            await sendEmail({ to: user.email, headers, ...nudgeEmail({ interviewUrl: `${origin}/interview`, unsubHtml }) });
            await admin.auth.admin.updateUserById(user.id, { user_metadata: { nudged_at: new Date().toISOString() } });
            counts.nudges++; sends++;
            await sleep(SEND_SPACING_MS);
          } else {
            counts.skipped++;
          }
        }
      } catch (e) {
        counts.errors++;
        errors.push(`${user.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (errors.length) captureServerError(new Error(`weekly email partial failures: ${errors.slice(0, 5).join(' | ')}`), { route: 'email/weekly', extra: counts });
    return Response.json({ ok: true, ...counts, users: users.length });
  } catch (e) {
    captureServerError(e, { route: 'email/weekly' });
    return Response.json({ error: 'weekly run failed' }, { status: 500 });
  }
}
