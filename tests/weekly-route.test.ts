/**
 * POST /api/email/weekly integration tests — the cron orchestration: CRON_SECRET gate, opt-out
 * skip, roundup vs one-time nudge selection, the 6-day roundup gap, per-user language, and the
 * metadata bookkeeping writes. buildDigest/interviewComplete are mocked here (their own logic is
 * covered by email-digest.test.ts) so the branching is deterministic; the email templates are real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Digest } from '../core/email-digest';

const buildDigest = vi.fn();
const interviewComplete = vi.fn();
vi.mock('@/core/email-digest', async importOriginal => ({
  ...(await importOriginal<typeof import('../core/email-digest')>()),
  buildDigest: (...a: unknown[]) => buildDigest(...a),
  interviewComplete: (...a: unknown[]) => interviewComplete(...a),
}));

const sendEmail = vi.fn();
vi.mock('@/lib/serverEmail', async importOriginal => ({
  ...(await importOriginal<typeof import('../lib/serverEmail')>()),
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));
vi.mock('@/lib/sentryServer', () => ({ captureServerError: vi.fn() }));

const listUsers = vi.fn();
const updateUserById = vi.fn();
const profilesSelect = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { admin: { listUsers, updateUserById } },
    from: () => ({ select: profilesSelect }),
  }),
}));

import { POST } from '../app/api/email/weekly+api';

const SECRET = 'cron-secret';
const post = (token = SECRET) =>
  new Request('https://getcamino.app/api/email/weekly', { method: 'POST', headers: { authorization: `Bearer ${token}` } });

const DIGEST: Digest = {
  overdue: [], upcoming: [{ id: 'nie', title: 'NIE', overdue: false, whenLabel: 'due 28 Jul', tip: 'book it' }],
  moreCount: 0, totalOpen: 1,
};

// Configure the mocked DB: a set of auth users + their profile rows.
function setup(users: Array<{ id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }>,
               profiles: Array<{ user_id: string; answers: unknown }>) {
  listUsers.mockResolvedValue({ data: { users: users.map(u => ({ created_at: '2020-01-01T00:00:00Z', user_metadata: {}, ...u })) }, error: null });
  profilesSelect.mockResolvedValue({ data: profiles, error: null });
  updateUserById.mockResolvedValue({ error: null });
  sendEmail.mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://stub.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('EXPO_PUBLIC_ENV', 'production');
});

describe('POST /api/email/weekly', () => {
  it('401 with the wrong cron secret — nothing runs', async () => {
    setup([], []);
    expect((await POST(post('wrong'))).status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it('skips opted-out and email-less users (no send)', async () => {
    setup(
      [{ id: 'a', email: 'a@x.com', user_metadata: { weekly_optout: true } }, { id: 'b' /* no email */ }],
      [{ user_id: 'a', answers: { x: 1 } }, { user_id: 'b', answers: { x: 1 } }],
    );
    const res = await POST(post());
    const body = await res.json();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(body.skipped).toBe(2);
  });

  it('finished interview + pressing digest → roundup in the user’s language + last_roundup_at written', async () => {
    interviewComplete.mockReturnValue(true);
    buildDigest.mockReturnValue(DIGEST);
    setup([{ id: 'u1', email: 'u1@x.com', user_metadata: { lang: 'es' } }], [{ user_id: 'u1', answers: { done: true } }]);
    const res = await POST(post());
    expect((await res.json()).roundups).toBe(1);
    const [payload] = sendEmail.mock.calls[0] as [{ to: string; subject: string }];
    expect(payload.to).toBe('u1@x.com');
    expect(payload.subject).toContain('Tu semana con Get Camino'); // es roundup subject
    expect(updateUserById).toHaveBeenCalledWith('u1', { user_metadata: { last_roundup_at: expect.any(String) } });
  });

  it('respects the 6-day roundup gap (recent last_roundup_at → skip)', async () => {
    buildDigest.mockReturnValue(DIGEST);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    setup([{ id: 'u1', email: 'u1@x.com', user_metadata: { last_roundup_at: yesterday } }], [{ user_id: 'u1', answers: { done: true } }]);
    const res = await POST(post());
    expect(sendEmail).not.toHaveBeenCalled();
    expect((await res.json()).skipped).toBe(1);
  });

  it('unfinished interview, old account, not yet nudged → one-time nudge + nudged_at written', async () => {
    interviewComplete.mockReturnValue(false);
    buildDigest.mockReturnValue(null);
    setup([{ id: 'u2', email: 'u2@x.com', created_at: '2020-01-01T00:00:00Z' }], [{ user_id: 'u2', answers: { partial: true } }]);
    const res = await POST(post());
    expect((await res.json()).nudges).toBe(1);
    const [payload] = sendEmail.mock.calls[0] as [{ subject: string }];
    expect(payload.subject).toBeTruthy();
    expect(updateUserById).toHaveBeenCalledWith('u2', { user_metadata: { nudged_at: expect.any(String) } });
  });

  it('already-nudged unfinished user → skipped (nudge is once-ever)', async () => {
    interviewComplete.mockReturnValue(false);
    buildDigest.mockReturnValue(null);
    setup([{ id: 'u2', email: 'u2@x.com', user_metadata: { nudged_at: '2026-07-01T00:00:00Z' } }], [{ user_id: 'u2', answers: { partial: true } }]);
    const res = await POST(post());
    expect(sendEmail).not.toHaveBeenCalled();
    expect((await res.json()).skipped).toBe(1);
  });
});
