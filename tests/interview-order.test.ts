/**
 * Interview ordering & input schema (interview redesign, Phase 1 — see docs/INTERVIEW-REDESIGN.md).
 * nextSlot() now asks the lowest-`order` applicable slot; every slot declares an input affordance.
 */
import { describe, it, expect } from 'vitest';
import { SLOTS, nextSlot, derive, type Profile } from '../core/interview-controller';
import { TEST_PERSONAS } from '../core/test-personas';

describe('slot schema', () => {
  it('every slot has a unique numeric order and a valid input', () => {
    const orders = SLOTS.map(s => s.order);
    expect(orders.every(o => Number.isFinite(o))).toBe(true);
    expect(new Set(orders).size).toBe(SLOTS.length); // unique
    for (const s of SLOTS) expect(['multi', 'single', 'yesno', 'date', 'typeahead']).toContain(s.input);
  });

  it('only option/list slots offer an "Other" free-text path', () => {
    for (const s of SLOTS) {
      if (s.allowOther) expect(['list', 'band']).toContain(s.type);
    }
  });
});

describe('nextSlot ordering', () => {
  it('opens with speaks_spanish, then nationalities', () => {
    expect(nextSlot({})?.field).toBe('speaks_spanish');
    expect(nextSlot({ speaks_spanish: 'None yet' })?.field).toBe('nationalities');
  });

  it('front-loads roadmap-payoff questions before sensitive ones', () => {
    // Walk a non-EU profile and record ask order; income (sensitive) must come after the
    // early high-payoff questions even though it has high leverage.
    const p: Profile = {};
    const asked: string[] = [];
    for (let i = 0; i < SLOTS.length + 5; i++) {
      const s = nextSlot(p); if (!s) break;
      asked.push(s.field);
      p[s.field] = s.type === 'bool' ? true
                 : s.type === 'date' ? '2026-09-01'
                 : s.type === 'list' ? (s.field === 'nationalities' ? ['US'] : ['retired'])
                 : s.options?.[0] ?? 'x';
      derive(p);
    }
    const at = (f: string) => asked.indexOf(f);
    expect(at('speaks_spanish')).toBe(0);
    expect(at('nationalities')).toBeLessThan(at('work_situation'));
    expect(at('work_situation')).toBeLessThan(at('arrival_date'));
    expect(at('arrival_date')).toBeLessThan(at('annual_income_eur_band')); // sensitive deferred
    expect(at('annual_income_eur_band')).toBeLessThan(at('foreign_assets_eur_band'));
  });

  it('a fully-answered persona (Susan) leaves no slot unasked', () => {
    const susan: Profile = { ...TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!.answers };
    derive(susan);
    expect(nextSlot(susan)).toBeNull();
  });

  it('asks employer_country_is_foreign immediately after work_situation for remote employees', () => {
    // It decides DNV vs work permit — the visa cluster is undetermined until it's answered.
    const p: Profile = { speaks_spanish: 'A little', nationalities: ['US'], work_situation: 'employed_remote' };
    derive(p);
    expect(nextSlot(p)?.field).toBe('employer_country_is_foreign');
  });

  it('skips the ex-colony question when the passports already show one (2026-07-10 audit)', () => {
    const co: Profile = { nationalities: ['CO'] };
    derive(co);
    expect(co.is_ex_colony_national).toBe(true);
    // walk the whole interview: the question never comes up for a Colombian passport…
    const asked: string[] = [];
    const p: Profile = { ...co };
    for (let i = 0; i < SLOTS.length + 5; i++) {
      const s = nextSlot(p); if (!s) break;
      asked.push(s.field);
      p[s.field] = s.type === 'bool' ? true : s.type === 'date' ? '2026-09-01'
                 : s.type === 'list' ? ['retired'] : s.options?.[0] ?? 'x';
      derive(p);
    }
    expect(asked).not.toContain('previously_ex_spanish_colony_nationality');
    // …but still reaches a US passport (the dual-national OR-fallback case)
    const us: Profile = { nationalities: ['US'] };
    derive(us);
    const askedUs: string[] = [];
    for (let i = 0; i < SLOTS.length + 5; i++) {
      const s = nextSlot(us); if (!s) break;
      askedUs.push(s.field);
      us[s.field] = s.type === 'bool' ? true : s.type === 'date' ? '2026-09-01'
                  : s.type === 'list' ? ['retired'] : s.options?.[0] ?? 'x';
      derive(us);
    }
    expect(askedUs).toContain('previously_ex_spanish_colony_nationality');
  });
});
