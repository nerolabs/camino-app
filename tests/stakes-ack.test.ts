import { describe, it, expect } from 'vitest';
import { derive, type Profile } from '@/core/interview-controller';
import { incomeAck } from '@/lib/stakesAck';

// C1b: on the income slot the reaction is engine-computed, not the LLM's, so Lola can never
// praise a band the roadmap is about to flag (the live finding: "that's a solid range" on a
// below-NLV income). This pins the decision that drives that reaction, run through the REAL
// derivations so it can't drift from the plan's own income check.

const built = (over: Partial<Profile>): Profile => {
  const p: Profile = { ...over };
  derive(p);
  return p;
};

describe('incomeAck', () => {
  it('flags an NLV band whose top still falls short — naming the household threshold', () => {
    // Solo NLV applicant, lowest band: 20k top < 28,800 threshold → short.
    const p = built({ visa_type: 'nlv', annual_income_eur_band: 'under €20k', family_extra_count: 0 });
    expect(incomeAck(p)).toEqual({ kind: 'short', route: 'nlv', threshold: 28_800 });
  });

  it('scales the threshold with dependents (per-dependent formula)', () => {
    const p = built({ visa_type: 'nlv', annual_income_eur_band: '€28k–€34k', family_extra_count: 2 });
    // 28,800 + 7,200×2 = 43,200; band top 34k < 43,200 → short at the bigger number.
    expect(incomeAck(p)).toEqual({ kind: 'short', route: 'nlv', threshold: 43_200 });
  });

  it('routes a DNV applicant to the DNV message + threshold', () => {
    const p = built({ visa_type: 'dnv', annual_income_eur_band: 'under €20k', has_spouse_or_partner: false, has_children: false });
    const ack = incomeAck(p);
    expect(ack.kind).toBe('short');
    if (ack.kind === 'short') expect(ack.route).toBe('dnv');
  });

  it('stays neutral ("noted") when even the conservative check passes', () => {
    const p = built({ visa_type: 'nlv', annual_income_eur_band: '€60k+', family_extra_count: 0 });
    expect(incomeAck(p)).toEqual({ kind: 'noted' });
  });
});
