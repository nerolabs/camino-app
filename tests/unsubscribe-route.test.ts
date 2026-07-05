/**
 * GET/POST /api/email/unsubscribe integration tests — session-less one-click opt-out gated by
 * the REAL HMAC (signUnsubToken/verifyUnsubToken, Web Crypto), with only Supabase mocked. A
 * forged or missing signature must never flip anyone's metadata.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureServerError = vi.fn();
vi.mock('@/lib/sentryServer', () => ({ captureServerError: (...a: unknown[]) => captureServerError(...a) }));

const updateUserById = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: { updateUserById } } }),
}));

import { GET, POST } from '../app/api/email/unsubscribe+api';
import { signUnsubToken } from '../lib/emailTokens';

const SECRET = 'test-cron-secret';
const url = (uid: string, sig: string) =>
  new Request(`https://getcamino.app/api/email/unsubscribe?uid=${encodeURIComponent(uid)}&sig=${encodeURIComponent(sig)}`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://stub.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.stubEnv('CRON_SECRET', SECRET);
  updateUserById.mockResolvedValue({ error: null });
});

describe('GET /api/email/unsubscribe', () => {
  it('400 with a missing signature — no metadata write', async () => {
    expect((await GET(url('user-1', ''))).status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('400 with a FORGED signature (real HMAC rejects it) — no metadata write', async () => {
    expect((await GET(url('user-1', 'deadbeef'))).status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('valid signature → sets weekly_optout:true for that uid, 200 HTML', async () => {
    const sig = await signUnsubToken(SECRET, 'user-1');
    const res = await GET(url('user-1', sig));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('no more weekly roundups');
    expect(updateUserById).toHaveBeenCalledWith('user-1', { user_metadata: { weekly_optout: true } });
  });

  it("a valid signature for one uid does NOT authorize a different uid (tamper)", async () => {
    const sig = await signUnsubToken(SECRET, 'user-1');
    expect((await GET(url('user-2', sig))).status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('POST (RFC 8058 one-click) works the same way', async () => {
    const sig = await signUnsubToken(SECRET, 'user-1');
    expect((await POST(url('user-1', sig))).status).toBe(200);
    expect(updateUserById).toHaveBeenCalledOnce();
  });

  it('metadata write failure → 500 + Sentry', async () => {
    updateUserById.mockResolvedValue({ error: { message: 'down' } });
    const sig = await signUnsubToken(SECRET, 'user-1');
    const res = await GET(url('user-1', sig));
    expect(res.status).toBe(500);
    expect(captureServerError).toHaveBeenCalledOnce();
  });
});
