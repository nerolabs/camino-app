/**
 * The move-budget engine — a PURE function over a built plan (council/STRATEGY.md uniqueness bet).
 *
 * Given the deterministic plan (Objective[]) and the few numbers only the user knows (home price,
 * region rate…), it prices each step from core/obligation-costs.ts and lays the result out in the
 * three honest layers the UX is built on:
 *   • sourced   — firm + soft costs Camino can back with a source; a RANGE, never false precision.
 *   • personal  — discretionary items Camino won't price; the user's own budget lives here.
 *   • free      — steps with no cost entry, kept for completeness (collapsed in the UI).
 *
 * Invariants honored: no fabricated numbers (a soft cost with no user base yields a display string
 * and contributes nothing to the total); recurring costs (IBI, income tax, RETA) are bucketed
 * apart so the headline "cost to move" is never inflated by lifetime obligations; personal figures
 * are the user's, never summed into the sourced total. No LLM, no side effects.
 */
import type { Objective } from './engine-controller';
import { OBLIGATION_COSTS, type ObligationCost } from './obligation-costs';

export type BudgetInputs = {
  homePriceEur?: number;
  cadastralValueEur?: number;      // IBI / non-resident tax base; absent → those lines show display only
  incomeEur?: number;              // income-based taxes; left as a rate range unless supplied
  netWealthEur?: number;           // wealth tax base
  regionItpPct?: number;           // the user's comunidad ITP rate, when known — collapses the ITP range to a point
  userBudgets?: Record<string, number>; // personal id → the amount the user entered (in that entry's unit)
};

export type BudgetLine = {
  id: string;
  title: string;
  kind: 'firm' | 'soft' | 'personal';
  display: string;                 // the string shown verbatim on the card
  low: number | null;              // euro low (null when Camino can't compute a figure honestly)
  high: number | null;
  recurring: 'monthly' | 'annual' | null;
  sourced: boolean;                // firm|soft → true; personal → false (no source dot)
  verified: boolean;
  confidence: 'high' | 'med' | 'low';
  source_url?: string;
  note?: string;
  typicalEur?: [number, number];   // personal-only: optional third-party market band (never Camino's figure)
};

export type Range = { low: number; high: number };

export type Budget = {
  moveCost: Range & { firm: number };  // one-time firm + soft — the headline; `firm` = the fixed portion
  monthly: Range;                      // recurring monthly sourced costs (RETA, convenio…)
  annual: Range;                       // recurring annual sourced costs (IBI, income tax…)
  sourcedLines: BudgetLine[];
  personal: { lines: BudgetLine[]; userOneTime: number; userMonthly: number };
  free: { count: number; ids: string[] };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Resolve a soft cost's euro low/high from the user's base number. `regionRatePct`, when given,
// pins a range down to a single known point (the ITP rate for the user's comunidad).
function softRange(c: ObligationCost, inputs: BudgetInputs, regionRatePct?: number): Range | null {
  const baseVal =
    c.base === 'home_price'      ? inputs.homePriceEur :
    c.base === 'cadastral_value' ? inputs.cadastralValueEur :
    c.base === 'income'          ? inputs.incomeEur :
    c.base === 'net_wealth'      ? inputs.netWealthEur : undefined;
  if (baseVal == null) return null;                       // no base → no fabricated number

  const [lo, hi] = regionRatePct != null ? [regionRatePct, regionRatePct]
                 : c.pct != null          ? [c.pct, c.pct]
                 : (c.pctRange ?? [0, 0]);
  return { low: round2((baseVal * lo) / 100), high: round2((baseVal * hi) / 100) };
}

export function priceLine(id: string, title: string, inputs: BudgetInputs): BudgetLine | null {
  const c = OBLIGATION_COSTS[id];
  if (!c) return null; // free / no-cost step
  const base: Omit<BudgetLine, 'low' | 'high'> = {
    id, title, kind: c.kind, display: c.display,
    recurring: c.recurring ?? null,
    sourced: c.kind !== 'personal',
    verified: c.verified, confidence: c.confidence,
    source_url: c.source_url, note: c.note, typicalEur: c.typicalEur,
  };
  if (c.kind === 'firm')     return { ...base, low: c.eur ?? null, high: c.eur ?? null };
  if (c.kind === 'personal') return { ...base, low: null, high: null };
  // soft — ITP alone honors a known region rate
  const regionRate = id === 'property-transfer-tax' ? inputs.regionItpPct : undefined;
  const r = softRange(c, inputs, regionRate);
  return { ...base, low: r?.low ?? null, high: r?.high ?? null };
}

export function buildBudget(plan: Pick<Objective, 'id' | 'title'>[], inputs: BudgetInputs = {}): Budget {
  const sourcedLines: BudgetLine[] = [];
  const personalLines: BudgetLine[] = [];
  const freeIds: string[] = [];

  for (const o of plan) {
    const line = priceLine(o.id, o.title, inputs);
    if (!line) { freeIds.push(o.id); continue; }
    (line.sourced ? sourcedLines : personalLines).push(line);
  }

  const moveCost = { low: 0, high: 0, firm: 0 };
  const monthly: Range = { low: 0, high: 0 };
  const annual: Range = { low: 0, high: 0 };
  for (const l of sourcedLines) {
    if (l.low == null || l.high == null) continue;          // not computable → excluded from totals (shown on the line)
    const bucket = l.recurring === 'monthly' ? monthly : l.recurring === 'annual' ? annual : moveCost;
    bucket.low = round2(bucket.low + l.low);
    bucket.high = round2(bucket.high + l.high);
    // "Fixed fees" is the figure we present as certain, so only VERIFIED firm tasas count toward it.
    // Unverified firm estimates (the reciprocity-set consulate / work-visa fees) still sit in the
    // one-time total range above, tagged "estimate" on their card — they're just never summed into
    // the certain figure, which would otherwise read as precise when part of it is a placeholder.
    if (l.recurring == null && l.kind === 'firm' && l.verified) moveCost.firm = round2(moveCost.firm + l.low);
  }

  const userBudgets = inputs.userBudgets ?? {};
  let userOneTime = 0, userMonthly = 0;
  for (const l of personalLines) {
    const amt = userBudgets[l.id];
    if (amt == null) continue;
    if (l.recurring === 'monthly') userMonthly = round2(userMonthly + amt);
    else userOneTime = round2(userOneTime + amt);
  }

  return {
    moveCost,
    monthly, annual,
    sourcedLines,
    personal: { lines: personalLines, userOneTime, userMonthly },
    free: { count: freeIds.length, ids: freeIds },
  };
}
