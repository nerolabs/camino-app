import { describe, it, expect } from 'vitest';
import { buildPlan, type Objective } from '@/core/engine-controller';
import { derive, type Profile } from '@/core/interview-controller';

// C3 (council fix): a penalty-bearing obligation gated on a sensitive field must NEVER be silently
// dropped when that field is unanswered or declined — the privacy-respecting answer would
// otherwise cause the worst harm (Modelo 720 is the trap). It's kept, marked `conditional`; the
// title already carries the threshold. A definite "under the threshold" answer still excludes it.

const plan = (over: Partial<Profile>): Objective[] => {
  const p: Profile = { ...over };
  derive(p);
  return buildPlan(p);
};
const find = (p: Objective[], id: string) => p.find(o => o.id === id);
const taxResident: Partial<Profile> = { intends_long_stay: true };

describe('C3 — penalty items kept conditionally when a sensitive gate is unknown/declined', () => {
  it('DECLINED foreign assets → Modelo 720 kept, flagged conditional', () => {
    const m = find(plan({ ...taxResident, foreign_assets_eur_band: 'prefer not to say' }), 'modelo-720');
    expect(m).toBeTruthy();
    expect(m!.conditional).toBe(true);
  });

  it('UNANSWERED foreign assets → Modelo 720 kept conditional', () => {
    const m = find(plan({ ...taxResident }), 'modelo-720');
    expect(m).toBeTruthy();
    expect(m!.conditional).toBe(true);
  });

  it('definitely UNDER the threshold → Modelo 720 absent (no false alarm)', () => {
    expect(find(plan({ ...taxResident, foreign_assets_eur_band: 'under €50k' }), 'modelo-720')).toBeUndefined();
  });

  it('OVER the threshold → Modelo 720 present, NOT conditional (definite)', () => {
    const m = find(plan({ ...taxResident, foreign_assets_eur_band: '€50k–€200k' }), 'modelo-720');
    expect(m).toBeTruthy();
    expect(m!.conditional).toBeFalsy();
  });

  it('NON-tax-resident who declines → Modelo 720 not forced (base prerequisite fails)', () => {
    expect(find(plan({ intends_long_stay: false, foreign_assets_eur_band: 'prefer not to say' }), 'modelo-720')).toBeUndefined();
  });

  it('wealth tax (Modelo 714) is kept conditional too when assets are declined', () => {
    const w = find(plan({ ...taxResident, foreign_assets_eur_band: 'prefer not to say' }), 'wealth-tax');
    expect(w).toBeTruthy();
    expect(w!.conditional).toBe(true);
  });

  it('Modelo 100 (income tax) is unaffected — it applies to every tax resident regardless', () => {
    const m = find(plan({ ...taxResident, foreign_assets_eur_band: 'prefer not to say' }), 'modelo-100');
    expect(m).toBeTruthy();
    expect(m!.conditional).toBeFalsy();
  });
});
