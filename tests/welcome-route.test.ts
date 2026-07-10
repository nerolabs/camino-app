/**
 * Integration tests for POST /api/email/welcome — the welcome-once dedupe.
 *
 * This route caused a real 3×-send (build-19 era): several auth events fired the client
 * effect, and the server checked `welcomed_at` non-atomically AFTER sending. The fix is
 * claim-before-send with rollback on failure — these tests pin exactly those properties,
 * with Supabase and Resend mocked (2026-07-05 audit gap, closed).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendEmail = vi.fn();
vi.mock('@/lib/serverEmail', async importOriginal => ({
  ...(await importOriginal<typeof import('../lib/serverEmail')>()),
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));
vi.mock('@/lib/sentryServer', () => ({ captureServerError: vi.fn() }));

// One controllable fake per client role: the anon client verifies the token, the service
// client writes the metadata claim.
const getUser = vi.fn();
const updateUserById = vi.fn();
const generateLink = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser, admin: { updateUserById, generateLink } },
  }),
}));

import { POST } from '../app/api/email/welcome+api';

const USER = {
  id: 'user-1',
  email: 'nueva@example.com',
  user_metadata: {} as Record<string, unknown>,
};

function req(token = 'tok'): Request {
  return new Request('https://camino--staging.expo.app/api/email/welcome', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://stub.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.stubEnv('CRON_SECRET', 'cron-secret');
  vi.stubEnv('EXPO_PUBLIC_ENV', 'staging');
  getUser.mockResolvedValue({ data: { user: { ...USER, user_metadata: {} } }, error: null });
  updateUserById.mockResolvedValue({ data: {}, error: null });
  generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'th-w' } }, error: null });
  sendEmail.mockResolvedValue(undefined);
});

describe('POST /api/email/welcome (welcome-once dedupe)', () => {
  it('401 without a bearer token', async () => {
    const res = await POST(req(''));
    expect(res.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('already-welcomed metadata → no email, no claim write', async () => {
    getUser.mockResolvedValue({
      data: { user: { ...USER, user_metadata: { welcomed_at: '2026-07-01T00:00:00Z' } } },
      error: null,
    });
    const res = await POST(req());
    expect(await res.json()).toEqual({ sent: false, reason: 'already welcomed' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('happy path: the claim is written BEFORE the send (the anti-3×-send property)', async () => {
    const order: string[] = [];
    updateUserById.mockImplementation(async (_id: string, patch: { user_metadata: Record<string, unknown> }) => {
      order.push(`claim:${patch.user_metadata.welcomed_at ? 'set' : 'clear'}`);
      return { data: {}, error: null };
    });
    sendEmail.mockImplementation(async () => { order.push('send'); });

    const res = await POST(req());
    expect(await res.json()).toEqual({ sent: true });
    expect(order).toEqual(['claim:set', 'send']);
    const [payload] = sendEmail.mock.calls[0] as [{ to: string; subject: string }];
    expect(payload.to).toBe(USER.email);
  });

  it('send failure rolls the claim back (a transient Resend error must not eat the welcome forever)', async () => {
    sendEmail.mockRejectedValue(new Error('resend down'));
    const res = await POST(req());
    expect(res.status).toBe(500);
    const patches = updateUserById.mock.calls.map(c => (c[1] as { user_metadata: Record<string, unknown> }).user_metadata.welcomed_at);
    expect(patches[0]).toBeTruthy();       // claim
    expect(patches[1]).toBeNull();         // rollback
  });

  it('speaks the user’s saved language (user_metadata.lang → localized welcome)', async () => {
    getUser.mockResolvedValue({ data: { user: { ...USER, user_metadata: { lang: 'es' } } }, error: null });
    await POST(req());
    const [payload] = sendEmail.mock.calls[0] as [{ subject: string }];
    expect(payload.subject).toContain('Te damos la bienvenida a Get Camino');
  });
});
