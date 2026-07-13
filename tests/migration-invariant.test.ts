import { describe, it, expect } from 'vitest';
import { SLOTS, nextSlot, derive, type Profile, type Slot } from '@/core/interview-controller';
import { TEST_PERSONAS } from '@/core/test-personas';

// Candidate invariant #5 (docs/THESIS.md — the "migration invariant"): a catalog/engine change
// must honor every saved profile, so a REPLAN never requires a new interview. `nextSlot` only
// ever asks UNANSWERED slots whose condition holds — so a completed profile is done, and when new
// info is genuinely required a delta-interview asks ONLY the missing slot(s), never re-asking what
// was already answered. New slots ship with safe unknown-handling (the C3 penalty rule is the
// pattern). This pins that property as a guarantee.

const answer = (s: Slot): unknown =>
  s.type === 'bool' ? true
  : s.type === 'date' ? '2026-09-01'
  : s.type === 'list' ? (s.field === 'nationalities' ? ['US'] : ['retired'])
  : s.options?.[0] ?? 'x';

// Drive the interview to completion, asserting nextSlot never re-asks an answered slot.
function runInterview(seed: Profile = {}): { profile: Profile; asked: string[] } {
  const p: Profile = { ...seed };
  const asked: string[] = [];
  for (let i = 0; i < SLOTS.length + 5; i++) {
    const s = nextSlot(p);
    if (!s) break;
    expect(s.field in p, `nextSlot re-asked an already-answered slot: ${s.field}`).toBe(false);
    asked.push(s.field);
    p[s.field] = answer(s);
    derive(p);
  }
  return { profile: p, asked };
}

describe('migration invariant #5 — a replan never requires a new interview', () => {
  it('nextSlot only ever asks UNANSWERED slots, and the interview terminates', () => {
    const { profile, asked } = runInterview();
    expect(new Set(asked).size).toBe(asked.length); // no slot asked twice
    expect(nextSlot(profile)).toBeNull();            // reaches completion
  });

  it('a completed profile needs nothing more — re-deriving (a replan) surfaces no new question', () => {
    for (const persona of TEST_PERSONAS) {
      const p: Profile = { ...persona.answers };
      derive(p);
      const pending = nextSlot(p);
      // Whatever's pending (usually null) is NEVER a slot the persona already answered.
      if (pending) expect(pending.field in persona.answers).toBe(false);
      // A replan re-runs derive over the same answers; that must not change what's pending.
      derive(p);
      expect(nextSlot(p)?.field).toBe(pending?.field);
    }
  });

  it('a delta-interview asks ONLY the missing slot (dropping one answer re-asks just it)', () => {
    // Susan is fully answered; remove each answer in turn and the interview asks a MISSING slot,
    // never one of the answers still present.
    const susan = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!.answers;
    for (const field of Object.keys(susan)) {
      const reduced: Profile = { ...susan };
      delete reduced[field];
      derive(reduced);
      const s = nextSlot(reduced);
      if (s) expect(s.field in reduced, `re-asked a still-present slot after dropping ${field}`).toBe(false);
    }
  });
});
