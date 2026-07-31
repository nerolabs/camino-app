/**
 * Timeline simulation — the "when should I land?" differentiator (STRATEGY.md uniqueness bet).
 *
 * A PURE view over the deterministic engine: clone the profile with a different `arrival_date`,
 * re-run buildPlan, and read how the arrival-anchored milestones shift. The non-obvious payoff is
 * the 183-day TAX-RESIDENCY YEAR — Spain taxes you as a resident for a calendar year only if you
 * spend >183 days in it, so landing a few weeks either side of early July moves which year Spain
 * first taxes you (and thus your first Modelo 100). The engine models this nowhere; we compute it
 * here from the arrival date alone, honestly (no fabricated dates — school windows stay a FLAG).
 *
 * No LLM, no side effects. `buildPlan` expects an already-derived profile (arrival changes don't
 * touch derivations), so simulateArrival clones + sets the date + re-plans; the milestone dues are
 * arrival-relative and therefore deterministic regardless of the wall clock.
 */
import { buildPlan, type Objective } from './engine-controller';

const DAY = 86_400_000;
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; // non-leap, 0-indexed month

function parseISO(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}
// 1-based day of the year, timezone-free (avoids Date's UTC/local drift near Jan 1 / Dec 31).
function dayOfYear({ y, m, d }: { y: number; m: number; d: number }): number {
  return DAYS_BEFORE_MONTH[m - 1] + d + (isLeap(y) && m > 2 ? 1 : 0);
}
const daysInYear = (y: number) => (isLeap(y) ? 366 : 365);

/** Days from the arrival date to 31 Dec of the arrival year, inclusive of the arrival day. */
export function daysLeftInArrivalYear(arrivalISO: string): number {
  const p = parseISO(arrivalISO);
  return daysInYear(p.y) - dayOfYear(p) + 1;
}

/**
 * The first calendar year you're a Spanish tax resident. Arrive with ≥183 days left in the year →
 * resident that year; otherwise your first tax-resident year is the next one (the ~2 July pivot).
 */
export function taxResidencyFirstYear(arrivalISO: string): number {
  const { y } = parseISO(arrivalISO);
  return daysLeftInArrivalYear(arrivalISO) >= 183 ? y : y + 1;
}

/** School-enrollment timing risk — a FLAG, never a fabricated date (invariant: no secondhand school
 *  windows). The ordinary admission window runs ~Feb–May for a September start; arriving outside it
 *  means the off-cycle "fuera de plazo" process. null when the plan has no school step. */
export type SchoolRisk = 'ordinary' | 'off_cycle';
export function schoolWindowRisk(arrivalISO: string): SchoolRisk {
  const { m } = parseISO(arrivalISO);
  return m >= 2 && m <= 5 ? 'ordinary' : 'off_cycle';
}

// The curated arrival-anchored milestones the timeline surfaces (verbose catalog titles collapse to
// short, localizable keys). dgt-exchange/exam both map to the licence milestone.
const SIGNAL: Record<string, string> = {
  'consulate-appointment': 'visa',
  empadronamiento: 'padron',
  residencia: 'tie',
  escolarizacion: 'school',
  'dgt-exchange': 'licence',
  'dgt-exam': 'licence',
};

export type Milestone = { key: string; due: Date; estimated: boolean };

export type ArrivalScenario = {
  arrivalISO: string;
  arrival: Date;
  taxYear: number;         // first Spanish tax-resident calendar year
  taxResidentOn: Date;     // the day the 183-day count is reached in-country (arrival + 182)
  schoolRisk: SchoolRisk | null; // null when there's no school step in this plan
  milestones: Milestone[]; // sorted by due, ascending
};

export function simulateArrival(derivedProfile: Record<string, unknown>, arrivalISO: string): ArrivalScenario {
  const clone = { ...derivedProfile, arrival_date: arrivalISO };
  const plan: Objective[] = buildPlan(clone);
  const arrival = new Date(arrivalISO);

  const seen = new Set<string>();
  const milestones: Milestone[] = [
    { key: 'arrival', due: arrival, estimated: false },
    { key: 'tax_resident', due: new Date(arrival.getTime() + 182 * DAY), estimated: false },
  ];
  for (const o of plan) {
    const key = SIGNAL[o.id];
    if (!key || seen.has(key)) continue;
    if (o.timing.state !== 'scheduled') continue;
    seen.add(key);
    milestones.push({ key, due: o.timing.due, estimated: o.timing.estimated });
  }
  milestones.sort((a, b) => a.due.getTime() - b.due.getTime());

  const hasSchool = plan.some(o => o.id === 'escolarizacion');
  return {
    arrivalISO,
    arrival,
    taxYear: taxResidencyFirstYear(arrivalISO),
    taxResidentOn: new Date(arrival.getTime() + 182 * DAY),
    schoolRisk: hasSchool ? schoolWindowRisk(arrivalISO) : null,
    milestones,
  };
}

export type ArrivalComparison = {
  scenarios: ArrivalScenario[];
  taxYearPivot: boolean; // true when the candidate arrivals don't all share the same first tax year
};

export function compareArrivals(derivedProfile: Record<string, unknown>, arrivalISOs: string[]): ArrivalComparison {
  const scenarios = arrivalISOs.map(a => simulateArrival(derivedProfile, a));
  const years = new Set(scenarios.map(s => s.taxYear));
  return { scenarios, taxYearPivot: years.size > 1 };
}
