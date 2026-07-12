import { describe, it, expect } from 'vitest';
import { sampleProfile } from '../core/sample-profile';
import { derive, SLOTS, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

// The sample plan (Susan & Tom) is public marketing rendered by the REAL engine. It must stay a
// valid profile (every field a real interview slot — same rule the persona audit enforces) and
// keep producing a rich, future-dated plan, or the front door looks broken.

describe('sampleProfile', () => {
  it('only sets fields the interview actually asks (no drift)', () => {
    const slotFields = new Set(SLOTS.map(s => s.field));
    for (const field of Object.keys(sampleProfile())) {
      expect(slotFields.has(field), `sample sets "${field}" which no slot asks`).toBe(true);
    }
  });

  it('arrival floats into the future so dates never go stale', () => {
    const iso = sampleProfile().arrival_date as string;
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now());
  });

  it('builds a substantial, unique-step plan with signature obligations', () => {
    const p: Profile = { ...sampleProfile() };
    derive(p);
    const plan = buildPlan(p);
    expect(plan.length).toBeGreaterThan(20); // a rich demo, not a stub
    const ids = plan.map(o => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    // US retiree, non-EU, no address yet, €50k–200k foreign assets, wants citizenship:
    expect(ids).toContain('nie');                         // non-EU
    expect(ids).toContain('scout-where-to-live');         // knows_where_to_live: false
    expect(ids).toContain('modelo-720');                  // foreign assets > €50k
    expect(ids.some(id => id.startsWith('citizenship'))).toBe(true); // wants_citizenship: true
    // Audit A1 (2026-07-12): empadronamiento applies to every long-stay mover — the old
    // assertion here was ENCODING the address-gating bug (the padrón vanished for anyone
    // still choosing housing). Susan & Tom now correctly see it, dated from arrival.
    expect(ids).toContain('empadronamiento');
  });
});
