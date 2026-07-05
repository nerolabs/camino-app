/**
 * POST /api/account/delete integration tests — hard delete of the TOKEN OWNER only, in the
 * right order (profile row → auth user), with Supabase mocked. Apple 5.1.1(v) + GDPR erasure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureServerError = vi.fn();
vi.mock('@/lib/sentryServer', () => ({ captureServerError: (...a: unknown[]) => captureServerError(...a) }));

const getUser = vi.fn();
const deleteEq = vi.fn();          // admin.from('profiles').delete().eq(...)
const deleteUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser, admin: { deleteUser } },
    from: () => ({ delete: () => ({ eq: deleteEq }) }),
  }),
}));

import { POST } from '../app/api/account/delete+api';

const req = (token?: string) =>
  new Request('https://getcamino.app/api/account/delete', {
    method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {},
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://stub.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  getUser.mockResolvedValue({ data: { user: { id: 'user-9' } }, error: null });
  deleteEq.mockResolvedValue({ error: null });
  deleteUser.mockResolvedValue({ error: null });
});

describe('POST /api/account/delete', () => {
  it('401 without a bearer token', async () => {
    expect((await POST(req())).status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('401 on an invalid token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    expect((await POST(req('nope'))).status).toBe(401);
    expect(deleteEq).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the token owner: profile row FIRST, then the auth user, both by that id', async () => {
    const order: string[] = [];
    deleteEq.mockImplementation((col: string, id: string) => { order.push(`profile:${col}=${id}`); return Promise.resolve({ error: null }); });
    deleteUser.mockImplementation((id: string) => { order.push(`user:${id}`); return Promise.resolve({ error: null }); });
    const res = await POST(req('tok'));
    expect(await res.json()).toEqual({ ok: true });
    expect(order).toEqual(['profile:user_id=user-9', 'user:user-9']); // owner id, profile before user
  });

  it('profile-delete failure → 500 + Sentry, and the auth user is NOT deleted', async () => {
    deleteEq.mockResolvedValue({ error: { message: 'db down' } });
    const res = await POST(req('tok'));
    expect(res.status).toBe(500);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(captureServerError).toHaveBeenCalledOnce();
  });
});
