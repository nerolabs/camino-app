/**
 * Deterministic engine test suite (B5, layer 1 — no browser, no LLM, no network).
 *
 * Locks in the four invariants plus every gating fix from the 2026-07-03 audit, using the staff
 * personas as fixtures (each persona documents which branch it exists to exercise). Runs in CI on
 * every push and inside scripts/deploy.sh, so a regression can't reach a deploy.
 */
import { describe, it, expect, vi } from 'vitest';
import { buildPlan, CATALOG, isOverdue, type Objective } from '../core/engine-controller';
import { derive, nextSlot, SLOTS, type Profile } from '../core/interview-controller';
import { auditCatalog } from '../core/catalog-audit';
import { TEST_PERSONAS } from '../core/test-personas';

function planFor(name: string): Objective[] {
  const persona = TEST_PERSONAS.find(p => p.name.startsWith(name));
  if (!persona) throw new Error(`no persona starting with "${name}"`);
  const profile: Profile = { ...persona.answers };
  derive(profile);
  return buildPlan(profile);
}
const ids = (plan: Objective[]) => new Set(plan.map(o => o.id));

// ── Invariant 2: the catalog↔interview contract ────────────────────────────────
describe('catalog audit', () => {
  it('has no hard failures and no uncited officials', () => {
    const { errors, warnings } = auditCatalog();
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]); // every `official` carries a source_url
  });

  it('every official obligation has a canonical https source_url', () => {
    for (const o of CATALOG.filter(o => o.source === 'official')) {
      expect(o.source_url, o.id).toMatch(/^https:\/\//);
    }
  });
});

// ── Invariant 4: the plan is a pure function of the profile ────────────────────
describe('determinism', () => {
  it('same profile → identical plan (ids, order, dates)', () => {
    // buildPlan anchors estimated dates to "now", so the invariant is: same profile AND same
    // instant → identical plan. Freeze the clock or the two builds can straddle a millisecond
    // tick (real CI flake: timing dates differed by 1ms, .636Z vs .637Z).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'));
    try {
      for (const persona of TEST_PERSONAS) {
        const p1: Profile = { ...persona.answers }; derive(p1);
        const p2: Profile = { ...persona.answers }; derive(p2);
        const a = buildPlan(p1), b = buildPlan(p2);
        expect(a.map(o => o.id)).toEqual(b.map(o => o.id));
        expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── Invariant 1: dependency order is inviolable; no silent drops ───────────────
describe('ordering & completeness', () => {
  it('a dependency never appears after its dependent', () => {
    for (const persona of TEST_PERSONAS) {
      const plan = planFor(persona.name.split(' ')[0]);
      const pos = new Map(plan.map((o, i) => [o.id, i]));
      for (const o of plan) {
        for (const dep of o.depends_on) {
          if (pos.has(dep)) {
            expect(pos.get(dep)!, `${persona.name}: ${dep} must precede ${o.id}`)
              .toBeLessThan(pos.get(o.id)!);
          }
        }
      }
    }
  });

  it('plans contain no duplicates and are non-empty for every persona', () => {
    for (const persona of TEST_PERSONAS) {
      const profile: Profile = { ...persona.answers }; derive(profile);
      const plan = buildPlan(profile);
      expect(plan.length, persona.name).toBeGreaterThan(0);
      expect(new Set(plan.map(o => o.id)).size).toBe(plan.length);
    }
  });
});

// ── Audit-fix regressions (2026-07-03) — each pinned by a persona ───────────────
describe('gating regressions', () => {
  it('Paolo (PH): 2-year track present AND DELE still required (not Spanish-speaking)', () => {
    const paolo = ids(planFor('Paolo'));
    expect(paolo.has('citizenship-track-latam')).toBe(true);
    expect(paolo.has('dele-a2-exam')).toBe(true);
    expect(paolo.has('ccse-exam')).toBe(true);
  });

  it('Sofia (CO): 2-year track present, DELE exempt (Spanish-speaking)', () => {
    const sofia = ids(planFor('Sofia'));
    expect(sofia.has('citizenship-track-latam')).toBe(true);
    expect(sofia.has('dele-a2-exam')).toBe(false);
    expect(sofia.has('ccse-exam')).toBe(true);
  });

  it('Elena (unmarried partner): family-reunification absent', () => {
    expect(ids(planFor('Elena')).has('family-reunification')).toBe(false);
  });

  it('Susan (married, wants citizenship): reunification present + full citizenship track + scouting', () => {
    const susan = ids(planFor('Susan'));
    expect(susan.has('family-reunification')).toBe(true);
    expect(susan.has('dele-a2-exam')).toBe(true);
    expect(susan.has('citizenship-application')).toBe(true);
    expect(susan.has('scout-where-to-live')).toBe(true); // still deciding where to live
  });

  it('James (renewal-only): zero citizenship items, renewal path intact', () => {
    const james = ids(planFor('James'));
    for (const id of ['citizenship-track-standard', 'citizenship-track-latam', 'dele-a2-exam',
                      'ccse-exam', 'citizenship-application', 'citizenship-jura']) {
      expect(james.has(id), id).toBe(false);
    }
    expect(james.has('nlv-renewal')).toBe(true);
    expect(james.has('permanent-residence')).toBe(true);
    expect(james.has('scout-where-to-live')).toBe(false); // knows where to live
  });

  it('EU registration: EX-18 only for non-Spanish EU nationals; mixed households get EX-19 (build-37 shred)', () => {
    // Andrew's household holds a SPANISH passport — the Spanish spouse is not a "foreign
    // national" (no EX-18), and the US spouse needs the EU family-member card instead.
    // This test previously asserted the buggy behavior; Cristina's real interview caught it.
    const andrew = ids(planFor('Andrew'));
    expect(andrew.has('eu-registration-certificate')).toBe(false);
    expect(andrew.has('eu-family-member-card')).toBe(true);
    expect(ids(planFor('Mara')).has('eu-registration-certificate')).toBe(false); // short stay
    // (EX-18-present for a non-Spanish EU long-stay is pinned in tests/spanish-national.test.ts)
  });

  it('Kenji (property buyer): purchase cluster present and anchored firm to the purchase date', () => {
    const plan = planFor('Kenji');
    const kenji = ids(plan);
    for (const id of ['property-legal-due-diligence', 'completion-deed-notary',
                      'land-registry-registration', 'property-transfer-tax', 'ibi-property-tax',
                      'community-fees', 'pet-import', 'dgt-exchange']) {
      expect(kenji.has(id), id).toBe(true);
    }
    expect(kenji.has('dgt-exam')).toBe(false); // JP has a bilateral exchange agreement
    const itp = plan.find(o => o.id === 'property-transfer-tax')!;
    if (itp.timing.state === 'scheduled') expect(itp.timing.estimated).toBe(false);
  });
});

// ── Overdue predicate (feeds the roadmap treatment AND the weekly email) ───────
describe('isOverdue', () => {
  const base = { id: 'x', title: 'x', category: 'admin', severity: 'required', source: 'official',
                 depends_on: [], phase: 'first_weeks', done: false, completedOn: null } as unknown as Objective;
  const at = (d: string) => new Date(d + 'T12:00:00');
  const sched = (due: string): Objective =>
    ({ ...base, timing: { state: 'scheduled', start: at(due), due: at(due), estimated: false } } as Objective);

  it('past due date → overdue', () => {
    expect(isOverdue(sched('2026-06-01'), at('2026-07-03'))).toBe(true);
  });
  it('due today → NOT overdue (grace until midnight)', () => {
    expect(isOverdue(sched('2026-07-03'), at('2026-07-03'))).toBe(false);
  });
  it('future due → not overdue', () => {
    expect(isOverdue(sched('2026-08-01'), at('2026-07-03'))).toBe(false);
  });
  it('done → never overdue, even with a past date', () => {
    expect(isOverdue({ ...sched('2026-06-01'), done: true }, at('2026-07-03'))).toBe(false);
  });
  it('pending-anchor / recurring states → not overdue', () => {
    const pending = { ...base, timing: { state: 'pending_anchor', anchor: 'padron_done' } } as unknown as Objective;
    expect(isOverdue(pending, at('2026-07-03'))).toBe(false);
  });
});

// ── The living plan: completion re-anchors downstream dates ────────────────────
describe('anchor re-flow', () => {
  it('completing residencia turns residency-anchored steps firm and re-dates them', () => {
    const susan = TEST_PERSONAS.find(p => p.name.startsWith('Susan'))!;
    const base: Profile = { ...susan.answers }; derive(base);
    const before = buildPlan(base).find(o => o.id === 'ccse-exam')!;
    expect(before.timing.state).toBe('scheduled');
    if (before.timing.state === 'scheduled') expect(before.timing.estimated).toBe(true);

    const done: Profile = { ...susan.answers, progress: { residencia: { state: 'done', completedOn: '2027-02-01' } } };
    derive(done);
    const after = buildPlan(done).find(o => o.id === 'ccse-exam')!;
    expect(after.timing.state).toBe('scheduled');
    if (after.timing.state === 'scheduled') {
      expect(after.timing.estimated).toBe(false);
      expect(after.timing.due.toISOString().slice(0, 10)).toBe('2032-01-31'); // 2027-02-01 + 1825d
    }
  });
});

// ── Interview derivations & sequencing ─────────────────────────────────────────
describe('interview controller', () => {
  it('derives is_eu, visa_type, and the two colony/language fields correctly', () => {
    const dual: Profile = { nationalities: ['US', 'ES'], work_situation: 'employed_remote', employer_country_is_foreign: true, intends_long_stay: true };
    derive(dual);
    expect(dual.is_eu).toBe(true);

    const dnv: Profile = { nationalities: ['US'], work_situation: 'employed_remote', employer_country_is_foreign: true, intends_long_stay: true };
    derive(dnv);
    expect(dnv.is_eu).toBe(false);
    expect(dnv.visa_type).toBe('dnv');

    const ph: Profile = { nationalities: ['PH'] }; derive(ph);
    expect(ph.is_ex_colony_national).toBe(true);
    expect(ph.is_spanish_speaking_national).toBe(false); // the DELE fix

    const co: Profile = { nationalities: ['CO'] }; derive(co);
    expect(co.is_spanish_speaking_national).toBe(true);

    // explicit ex-colony answer is an OR-fallback when passports don't show it
    const fallback: Profile = { nationalities: ['US'], previously_ex_spanish_colony_nationality: true };
    derive(fallback);
    expect(fallback.is_ex_colony_national).toBe(true);
  });

  it('asks wants_citizenship only for non-EU long-stay; knows_where_to_live only for non-owners', () => {
    const answerAll = (p: Profile) => {
      const asked: string[] = [];
      for (let i = 0; i < SLOTS.length + 5; i++) {
        const s = nextSlot(p); if (!s) break;
        asked.push(s.field);
        p[s.field] = s.type === 'bool' ? true : s.type === 'date' ? '2026-09-01'
                   : s.type === 'list' ? (s.field === 'nationalities' ? ['US'] : ['retired'])
                   : s.options?.[0] ?? 'x';
        derive(p);
      }
      return asked;
    };
    const nonEuLong = answerAll({ nationalities: ['US'], work_situation: 'retired', intends_long_stay: true } as Profile);
    expect(nonEuLong).toContain('wants_citizenship');

    const euShort = answerAll({ nationalities: ['DE'], work_situation: 'employed_remote', employer_country_is_foreign: true, intends_long_stay: false } as Profile);
    expect(euShort).not.toContain('wants_citizenship');

    const owner: Profile = { nationalities: ['JP'], work_situation: 'retired', intends_long_stay: true, owns_property_in_spain: true };
    derive(owner);
    const ownerAsked = answerAll(owner);
    expect(ownerAsked).not.toContain('knows_where_to_live');
  });
});
