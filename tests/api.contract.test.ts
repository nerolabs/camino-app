/**
 * API contract tests (B5, layer 2) — hits the DEPLOYED staging API over the network, so it's
 * opt-in: `npm run test:api` (sets RUN_API=1). The default `npm test` skips this whole suite,
 * keeping CI and the deploy gate offline and free.
 *
 * Only validation/hardening paths are asserted (they return before any upstream call), plus one
 * tiny TTS happy-path whose text is constant so the CDN cache usually absorbs it. The Anthropic
 * happy path is deliberately not exercised here — the Playwright smoke covers it end-to-end.
 */
import { describe, it, expect } from 'vitest';

const BASE = process.env.API_BASE ?? 'https://camino--staging.expo.app';
const run = process.env.RUN_API === '1' ? describe : describe.skip;

run('POST /api/lola contract', () => {
  it('400 when messages is missing', async () => {
    const res = await fetch(`${BASE}/api/lola`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('400 on too many messages', async () => {
    const messages = Array.from({ length: 41 }, () => ({ role: 'user', content: 'hi' }));
    const res = await fetch(`${BASE}/api/lola`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages }),
    });
    expect(res.status).toBe(400);
  });

  it('413 when the payload exceeds the char cap', async () => {
    const res = await fetch(`${BASE}/api/lola`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(25_000) }] }),
    });
    expect(res.status).toBe(413);
  });

  it('400 on an invalid message role', async () => {
    const res = await fetch(`${BASE}/api/lola`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: 'sneaky' }] }),
    });
    expect(res.status).toBe(400);
  });
});

run('/api/tts contract', () => {
  it('400 when text is empty (POST and GET)', async () => {
    const post = await fetch(`${BASE}/api/tts`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '' }),
    });
    expect(post.status).toBe(400);
    const get = await fetch(`${BASE}/api/tts?text=`);
    expect(get.status).toBe(400);
  });

  it('413 when text exceeds the cap', async () => {
    const res = await fetch(`${BASE}/api/tts`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(1001) }),
    });
    expect(res.status).toBe(413);
  });

  it('GET happy path returns audio/mpeg (constant text → CDN-cacheable)', async () => {
    const res = await fetch(`${BASE}/api/tts?text=Hola`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('audio/mpeg');
  });
});
