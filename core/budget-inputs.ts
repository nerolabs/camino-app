/**
 * Profile → BudgetInputs adapter for the move-budget engine (increment 2).
 *
 * The budget engine (core/budget.ts) is pure and takes explicit numbers; this maps a saved
 * Profile onto those inputs. It reads only OPTIONAL fields the budget screen writes, so a profile
 * saved before this feature still plans AND still produces a budget (soft costs simply stay
 * uncomputed) — the migration invariant holds by construction; no new interview slot, no change to
 * buildPlan.
 *
 * Budget-only profile fields (written by the budget screen, ignored by the plan engine):
 *   • home_price_eur       — number; the base for ITP / notary / registry soft costs
 *   • cadastral_value_eur  — number; the base for IBI / non-resident tax (absent → those stay ranges)
 *   • budget_estimates     — Record<obligationId, number>; the user's own figures for personal items
 *
 * The two gates the screen branches on already exist on the profile and drive the PLAN itself, so
 * the budget engine sees property/autónomo steps only when they apply — nothing to re-gate here:
 *   • owns_property_in_spain (bool)  — buying gate → property obligations appear
 *   • work_situation ∈ {self_employment, business_owner} — autónomo gate → RETA + tax filings appear
 *
 * ITP is pinned to the user's comunidad rate when that rate is a verified FLAT rate
 * (core/regional-specifics.ts). Bracketed regions (Cataluña, Asturias…) keep the engine's generic
 * range for now — their marginal-vs-whole-value mechanics need their own verification pass before
 * we pin a single number (invariant 3: no invented rate).
 */
import type { BudgetInputs } from './budget';
import { REGIONAL_SPECIFICS } from './regional-specifics';

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;

const AUTONOMO_WORK = new Set(['self_employment', 'business_owner']);

/** true when the profile's work situation is one that carries autónomo (RETA + tax) obligations. */
export function isSelfEmployed(profile: Record<string, unknown>): boolean {
  return AUTONOMO_WORK.has(String(profile.work_situation));
}

/** true when the profile indicates buying a home (the gate that unlocks the property cost block). */
export function isBuying(profile: Record<string, unknown>): boolean {
  return profile.owns_property_in_spain === true;
}

/**
 * The verified ITP rate for a comunidad, as a percentage number — but ONLY when it's a single flat
 * rate we can honestly pin. Bracketed / not_sure / unknown regions return null (engine falls back
 * to the sourced range).
 */
export function resolveRegionItpPct(region: unknown): number | null {
  if (typeof region !== 'string') return null;
  const fact = REGIONAL_SPECIFICS.find(
    r => r.region === region && r.obligation_id === 'property-transfer-tax',
  );
  if (!fact || fact.template !== 'itp_flat') return null; // brackets not pinned yet
  const pct = parseFloat(String(fact.values.rate).replace(/[^0-9.]/g, ''));
  return Number.isFinite(pct) ? pct : null;
}

export function profileToBudgetInputs(profile: Record<string, unknown>): BudgetInputs {
  const itp = resolveRegionItpPct(profile.region);
  const budgets = profile.budget_estimates;
  const userBudgets =
    budgets && typeof budgets === 'object' && !Array.isArray(budgets)
      ? Object.fromEntries(
          Object.entries(budgets as Record<string, unknown>)
            .map(([k, v]) => [k, num(v)])
            .filter(([, v]) => v != null) as [string, number][],
        )
      : undefined;

  return {
    homePriceEur: num(profile.home_price_eur),
    cadastralValueEur: num(profile.cadastral_value_eur),
    ...(itp != null ? { regionItpPct: itp } : {}),
    ...(userBudgets && Object.keys(userBudgets).length ? { userBudgets } : {}),
  };
}
