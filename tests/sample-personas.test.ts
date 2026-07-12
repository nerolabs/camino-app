import { describe, it, expect } from 'vitest';
import { SAMPLE_PERSONAS, EXTRA_PERSONAS, DEFAULT_PERSONA_ID } from '../core/sample-personas';
import { SLOTS, derive } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

// The persona pages are marketing surfaces rendered by the REAL engine — so the personas
// must stay valid interview profiles (same discipline as the audit's test personas), and
// each must keep lighting up the branch it was chosen for.

const SLOT_FIELDS = new Set(SLOTS.map(s => s.field));
const OPTION_SLOTS = new Map(SLOTS.filter(s => s.options).map(s => [s.field, new Set(s.options!)]));

describe('sample personas', () => {
  it('profiles only use real slot fields with legal option values', () => {
    for (const persona of SAMPLE_PERSONAS) {
      for (const [field, value] of Object.entries(persona.profile())) {
        expect(SLOT_FIELDS.has(field), `${persona.id}: unknown field ${field}`).toBe(true);
        const opts = OPTION_SLOTS.get(field);
        if (opts && typeof value === 'string') {
          expect(opts.has(value), `${persona.id}: ${field}=${value} not in options`).toBe(true);
        }
      }
    }
  });

  it('every persona builds a non-empty plan, and the plans genuinely differ', () => {
    const signatures = SAMPLE_PERSONAS.map(persona => {
      const p = persona.profile();
      derive(p);
      const ids = buildPlan(p).map(o => o.id);
      expect(ids.length, `${persona.id} plan empty`).toBeGreaterThan(8);
      return ids.join(',');
    });
    expect(new Set(signatures).size).toBe(SAMPLE_PERSONAS.length);
  });

  it('each persona lights up the branch it was chosen for', () => {
    const planIds = (id: string) => {
      const p = SAMPLE_PERSONAS.find(x => x.id === id)!.profile();
      derive(p);
      return new Set(buildPlan(p).map(o => o.id));
    };
    const eu = planIds('eu-family');
    expect(eu.has('eu-registration-certificate')).toBe(true);
    expect(eu.has('choose-visa-type')).toBe(false); // EU: no visa cluster
    expect(eu.has('school-enrollment') || [...eu].some(i => i.includes('school') || i.includes('escolar'))).toBe(true);

    const nomad = planIds('digital-nomad');
    expect([...nomad].some(i => i.startsWith('dnv-') || i.includes('nomad'))).toBe(true);
    expect([...nomad].some(i => i.startsWith('nlv-'))).toBe(false);

    const owners = planIds('property-owners');
    expect([...owners].some(i => i.includes('property') || i.includes('transfer-tax') || i.includes('ibi'))).toBe(true);
  });

  it('the default persona is the original sample (marketing continuity)', () => {
    expect(DEFAULT_PERSONA_ID).toBe('retirees');
    expect(EXTRA_PERSONAS.map(p => p.id)).toEqual(['eu-family', 'digital-nomad', 'property-owners']);
  });
});
