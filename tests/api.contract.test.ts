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
import { SLOTS } from '@/core/interview-controller';
import { buildExtractionSystem, parseExtraction } from '@/lib/extractionPrompt';

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

// LOCALIZATION GATE (2026-07-05): the interview must already understand Spanish BEFORE we
// localize the UI — extraction is an LLM call, so a Spanish answer must land in the same
// English slot slugs an English answer would. Uses the app's REAL extraction prompt
// (lib/extractionPrompt.ts — no test-only copy to drift) against the deployed /api/lola.
// Each case spends one live Haiku call; LLM answers get one retry like the rest of E2E.
run('interview extraction is language-agnostic (Spanish in → English slugs out)', () => {
  const slotByField = (field: string) => {
    const slot = SLOTS.find(s => s.field === field);
    if (!slot) throw new Error(`slot ${field} missing — did the interview change?`);
    return slot;
  };

  async function extract(field: string, userText: string) {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`${BASE}/api/lola`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 350,
          system: buildExtractionSystem({ slot: slotByField(field), remaining: [] }),
          messages: [{ role: 'user', content: userText }],
        }),
      });
      expect(res.status).toBe(200);
      const { text } = (await res.json()) as { text?: string };
      const parsed = parseExtraction(text ?? '');
      if ('value' in parsed || attempt >= 2) return parsed;
    }
  }

  it('"Somos estadounidenses" → nationalities ["US"]', async () => {
    const parsed = await extract('nationalities', 'Somos estadounidenses');
    expect(parsed).toHaveProperty('value');
    expect((parsed as { value: unknown }).value).toEqual(['US']);
  }, 45_000);

  it('"Trabajo en remoto para una empresa de EE.UU." → work_situation "employed_remote"', async () => {
    const parsed = await extract('work_situation', 'Trabajo en remoto para una empresa de EE.UU.');
    expect(parsed).toHaveProperty('value');
    expect((parsed as { value: unknown }).value).toBe('employed_remote');
  }, 45_000);

  it('"Sí, estamos casados" → partner_is_married true (bool)', async () => {
    const parsed = await extract('partner_is_married', 'Sí, estamos casados');
    expect(parsed).toHaveProperty('value');
    expect((parsed as { value: unknown }).value).toBe(true);
  }, 45_000);
});
