import { describe, it, expect } from 'vitest';
import { buildLolaRequest, LOLA_MODES, LLM_LANG_NAMES } from '@/lib/lolaPrompts';
import { SUPPORTED_LOCALES } from '@/lib/i18n';

// C2a lockdown (2026-07-13): the /api/lola route builds every system prompt server-side from a
// mode + typed params, so a stolen URL can only ever run our five Lola personas — never
// general-purpose Claude. These offline tests lock that contract (the live contract tests in
// api.contract.test.ts are network-gated and skipped in CI).

describe('buildLolaRequest — mode gating', () => {
  it('rejects an unknown mode', () => {
    expect(buildLolaRequest('jailbreak', {})).toEqual({ error: 'unknown mode' });
  });

  it('rejects a mode with no params object (no crash, clean 400 signal)', () => {
    expect(buildLolaRequest('extract', undefined)).toEqual({ error: 'unknown slot' });
  });

  it('exposes exactly the five real modes', () => {
    expect([...LOLA_MODES].sort()).toEqual(['ack', 'change', 'clarify', 'coach', 'extract']);
  });
});

describe('buildLolaRequest — slot resolution is server-side (no caller prose)', () => {
  it('resolves a known slot field and builds the extraction prompt', () => {
    const built = buildLolaRequest('extract', { slotField: 'nationalities' });
    expect('error' in built).toBe(false);
    if ('error' in built) return;
    expect(built.model).toBe('claude-haiku-4-5-20251001');
    expect(built.max_tokens).toBe(350);
    expect(built.system).toContain('extracting a structured value');
    // The slot's own prose comes from the CATALOG, not the caller.
    expect(built.system).toContain('nationalities');
  });

  it('rejects an unknown slot field (caller cannot smuggle a fake slot)', () => {
    expect(buildLolaRequest('extract', { slotField: 'not_a_real_slot' })).toEqual({ error: 'unknown slot' });
    expect(buildLolaRequest('clarify', { slotField: 'nope', reask: 'x' })).toEqual({ error: 'unknown slot' });
    expect(buildLolaRequest('ack', { slotField: 'nope', userText: 'x' })).toEqual({ error: 'unknown slot' });
  });
});

describe('buildLolaRequest — the instructions are fixed, only data is interpolated', () => {
  it('clarify keeps the hard rules and re-asks, with the answer text as data', () => {
    const built = buildLolaRequest('clarify', {
      slotField: 'work_situation', reask: 'How do you earn a living?',
      extractorHint: 'ambiguous', transcript: 'Lola: hi\nUser: what?',
    });
    if ('error' in built) throw new Error('unexpected error');
    expect(built.max_tokens).toBe(220);
    expect(built.system).toContain('You are Lola');
    expect(built.system).toContain('never state legal facts');
    expect(built.system).toContain('How do you earn a living?');
  });

  it('ack carries the never-drive-the-conversation guard', () => {
    const built = buildLolaRequest('ack', { slotField: 'has_children', userText: 'yes two kids' });
    if ('error' in built) throw new Error('unexpected error');
    expect(built.max_tokens).toBe(100);
    expect(built.system).toContain('you are NOT driving the conversation');
    expect(built.system).toContain('yes two kids');
  });

  it('change frames step vs final-note distillation from a typed situationKind', () => {
    const step = buildLolaRequest('change', { situationKind: 'step', objTitle: 'Pay the property transfer tax' });
    const final = buildLolaRequest('change', { situationKind: 'final' });
    if ('error' in step || 'error' in final) throw new Error('unexpected error');
    expect(step.system).toContain('Pay the property transfer tax');
    expect(final.system).toContain('finished the interview');
    expect(final.system).toContain('anything else I should know');
  });

  it('coach injects the step title/category/visa as data only', () => {
    const built = buildLolaRequest('coach', { objTitle: 'Get your NIE', objCategory: 'residency', visaType: 'nlv' });
    if ('error' in built) throw new Error('unexpected error');
    expect(built.max_tokens).toBe(280);
    expect(built.system).toContain('Get your NIE');
    expect(built.system).toContain('on the nlv path');
  });
});

describe('buildLolaRequest — language directive', () => {
  it('appends a per-locale directive for non-English, nothing for English/unknown', () => {
    const es = buildLolaRequest('ack', { slotField: 'has_children', userText: 'sí', lang: 'es' });
    const en = buildLolaRequest('ack', { slotField: 'has_children', userText: 'yes', lang: 'en' });
    const none = buildLolaRequest('ack', { slotField: 'has_children', userText: 'yes' });
    if ('error' in es || 'error' in en || 'error' in none) throw new Error('unexpected error');
    expect(es.system).toContain('Respond in Spanish');
    expect(en.system).not.toContain('Respond in');
    expect(none.system).not.toContain('Respond in');
  });

  // The LLM language names are duplicated from i18n.ts to keep the server bundle i18n-free —
  // this test is what single-sources them. If a locale's llmName changes, update both.
  it('LLM_LANG_NAMES stays in sync with i18n SUPPORTED_LOCALES', () => {
    for (const l of SUPPORTED_LOCALES) {
      if (l.code === 'en') continue;
      expect(LLM_LANG_NAMES[l.code]).toBe(l.llmName);
    }
    // No stray entries beyond the non-English supported locales.
    expect(Object.keys(LLM_LANG_NAMES).sort()).toEqual(
      SUPPORTED_LOCALES.filter(l => l.code !== 'en').map(l => l.code).sort(),
    );
  });
});
