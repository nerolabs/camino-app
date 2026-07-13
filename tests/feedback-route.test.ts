/**
 * POST /api/feedback integration tests — validation caps + the "can't be turned into a mail
 * relay" guarantee (hardcoded recipient, no caller-chosen destination), with Resend mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendEmail = vi.fn();
const captureServerError = vi.fn();
const volumeGuard = vi.fn();
const sessionGate = vi.fn();
vi.mock('@/lib/serverEmail', () => ({
  sendEmail: (...a: unknown[]) => sendEmail(...a),
  siteOrigin: () => 'https://getcamino.app',
}));
vi.mock('@/lib/sentryServer', () => ({ captureServerError: (...a: unknown[]) => captureServerError(...a) }));
vi.mock('@/lib/apiGuard', () => ({
  volumeGuard: (...a: unknown[]) => volumeGuard(...a),
  corsPreflight: () => new Response(null, { status: 204 }),
}));
// C2b gate mocked to pass by default so these tests exercise the route's own logic; one test
// below flips it to a 401 to prove it runs first.
vi.mock('@/lib/session', () => ({ sessionGate: (...a: unknown[]) => sessionGate(...a) }));

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
  sessionGate.mockResolvedValue(null); // gate passes by default
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

  it('C9a: auto-acks the sender when they left a valid email — never the report inbox', async () => {
    await POST(req({ message: 'a question', email: 'user@example.com' }));
    const acks = sendEmail.mock.calls.map(c => (c[0] as { to: string }).to).filter(to => to === 'user@example.com');
    expect(acks).toHaveLength(1);
  });

  it('C9a: the ack is AWAITED before responding — the Workers runtime kills unawaited sends', async () => {
    // Regression (2026-07-13): the ack was fire-and-forget, so on Cloudflare Workers it was dropped
    // when the handler returned. This proves the response waits for the ack to settle: 'responded'
    // must come AFTER the ack send resolves, not before.
    const order: string[] = [];
    let releaseAck!: () => void;
    const ackGate = new Promise<void>(r => { releaseAck = r; });
    sendEmail.mockImplementation(async (p: { to: string }) => {
      if (p.to === 'user@example.com') { await ackGate; order.push('ack-settled'); }
      else order.push('team-sent');
    });
    const pending = POST(req({ message: 'q', email: 'user@example.com' })).then(() => order.push('responded'));
    await new Promise(r => setTimeout(r, 0)); // drain microtasks/timers up to the awaited ack
    expect(order).toEqual(['team-sent']);      // still awaiting the ack — has NOT responded yet
    releaseAck();
    await pending;
    expect(order).toEqual(['team-sent', 'ack-settled', 'responded']);
  });

  it('C9a: no auto-ack when no (or an invalid) email is given', async () => {
    await POST(req({ message: 'anonymous report' }));
    await POST(req({ message: 'bad address', email: 'not-an-email' }));
    const recipients = sendEmail.mock.calls.map(c => (c[0] as { to: string }).to);
    expect(recipients.every(to => to === 'feedback@getcamino.app')).toBe(true);
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
      { ipPerMinute: 5, globalPerDay: 1000 }); // C9b: raised 200 → 1000
  });

  it('send failure → 500 + Sentry', async () => {
    sendEmail.mockRejectedValue(new Error('resend down'));
    const res = await POST(req({ message: 'hi' }));
    expect(res.status).toBe(500);
    expect(captureServerError).toHaveBeenCalledOnce();
  });

  it('C2b: the session gate runs FIRST — a challenge failure short-circuits before any work', async () => {
    sessionGate.mockResolvedValue(Response.json({ error: 'challenge required' }, { status: 401 }));
    const res = await POST(req({ message: 'hi', platform: 'web' }));
    expect(res.status).toBe(401);
    expect(volumeGuard).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
