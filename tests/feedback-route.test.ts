/**
 * POST /api/feedback integration tests — validation caps + the "can't be turned into a mail
 * relay" guarantee (hardcoded recipient, no caller-chosen destination), with Resend mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendEmail = vi.fn();
const captureServerError = vi.fn();
const volumeGuard = vi.fn();
vi.mock('@/lib/serverEmail', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));
vi.mock('@/lib/sentryServer', () => ({ captureServerError: (...a: unknown[]) => captureServerError(...a) }));
vi.mock('@/lib/apiGuard', () => ({
  volumeGuard: (...a: unknown[]) => volumeGuard(...a),
  corsPreflight: () => new Response(null, { status: 204 }),
}));

import { POST } from '../app/api/feedback+api';

const req = (body: unknown, raw = false) =>
  new Request('https://getcamino.app/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_ENV', 'production');
  sendEmail.mockResolvedValue(undefined);
  volumeGuard.mockResolvedValue(null); // fail-open default, like the real guard
});

describe('POST /api/feedback', () => {
  it('400 on non-JSON body', async () => {
    expect((await POST(req('not json{', true))).status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('400 on empty/whitespace message', async () => {
    expect((await POST(req({ message: '   ' }))).status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('413 when the message exceeds the cap', async () => {
    expect((await POST(req({ message: 'x'.repeat(2001) }))).status).toBe(413);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('always sends to the hardcoded team inbox — a caller cannot redirect it', async () => {
    const res = await POST(req({ message: 'the drawer won’t scroll', email: 'me@x.com', to: 'attacker@evil.com', platform: 'ios' }));
    expect(await res.json()).toEqual({ ok: true });
    const [payload] = sendEmail.mock.calls[0] as [{ to: string; subject: string; html: string }];
    expect(payload.to).toBe('feedback@getcamino.app'); // NOT attacker@evil.com
    expect(payload.subject).toContain('production');
    expect(payload.html).toContain('the drawer won’t scroll');
  });

  it('HTML-escapes the message (no injection into the email) and caps context fields', async () => {
    const res = await POST(req({ message: '<script>alert(1)</script>', platform: 'z'.repeat(500) }));
    expect(res.status).toBe(200);
    const [payload] = sendEmail.mock.calls[0] as [{ html: string }];
    expect(payload.html).toContain('&lt;script&gt;');
    expect(payload.html).not.toContain('<script>alert');
    expect(payload.html).toContain('z'.repeat(200));      // capped
    expect(payload.html).not.toContain('z'.repeat(201));  // ...not beyond
  });

  it('429 when the volume guard trips — nothing reaches the inbox (fresh-eyes 2026-07-12)', async () => {
    volumeGuard.mockResolvedValue(Response.json({ error: 'rate limit exceeded' }, { status: 429 }));
    const res = await POST(req({ message: 'flood attempt' }));
    expect(res.status).toBe(429);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('the guard runs only after validation — malformed junk never burns the budget', async () => {
    await POST(req({ message: '' }));
    await POST(req('not json{', true));
    expect(volumeGuard).not.toHaveBeenCalled();
    await POST(req({ message: 'legit' }));
    expect(volumeGuard).toHaveBeenCalledWith('feedback', expect.anything(),
      { ipPerMinute: 5, globalPerDay: 200 });
  });

  it('send failure → 500 + Sentry', async () => {
    sendEmail.mockRejectedValue(new Error('resend down'));
    const res = await POST(req({ message: 'hi' }));
    expect(res.status).toBe(500);
    expect(captureServerError).toHaveBeenCalledOnce();
  });
});
