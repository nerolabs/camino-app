/**
 * Pure display helpers for the move-budget view (increment 3). Kept out of the component so the
 * money-formatting logic is unit-testable and Hermes-safe (manual grouping — no reliance on
 * Intl.NumberFormat, which is patchy on the RN engine).
 */
import type { Budget, BudgetLine } from '@/core/budget';

/** "€16.08" (cents kept for small fees), "€16,800", "€0". Never invents precision on round sums. */
export function formatEur(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  const showCents = abs < 1000 && !Number.isInteger(abs); // €16.08 yes; €16,800 no
  const fixed = showCents ? abs.toFixed(2) : Math.round(abs).toString();
  const [intPart, dec] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}€${grouped}${dec ? '.' + dec : ''}`;
}

/** A range collapses to a single figure when low === high (a pinned/exact cost). */
export function formatRange(low: number, high: number): string {
  return low === high ? formatEur(low) : `${formatEur(low)}–${formatEur(high)}`;
}

/** What a single budget line shows as its cost: the computed euro when we have it, else the
 *  registry's honest display string (e.g. "6–13% of price", "your call"). */
export function lineCostDisplay(line: BudgetLine): string {
  if (line.low == null || line.high == null) return line.display;
  return formatRange(line.low, line.high);
}

export type BudgetHeadline = {
  total: string;      // the sourced one-time move cost, as a range
  firm: string;       // the fixed (firm) portion
  hasRange: boolean;  // true when low !== high (drives "– X" vs a single figure)
  monthly: string | null;
  annual: string | null;
};

export function budgetHeadline(b: Budget): BudgetHeadline {
  const { moveCost, monthly, annual } = b;
  return {
    total: formatRange(moveCost.low, moveCost.high),
    firm: formatEur(moveCost.firm),
    hasRange: moveCost.low !== moveCost.high,
    monthly: monthly.high > 0 ? formatRange(monthly.low, monthly.high) : null,
    annual: annual.high > 0 ? formatRange(annual.low, annual.high) : null,
  };
}
