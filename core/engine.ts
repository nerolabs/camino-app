/**
 * Relocation planning engine — the deterministic spine.
 *
 * interview  → Profile        (LLM elicits; not here)
 * Profile    → applicable set (evaluate `applies_if`)
 * applicable → ordered        (topological sort over `depends_on`)
 * ordered    → scheduled      (resolve `timing` against profile + urgency)
 *
 * No LLM runs inside this file. The model fills the Profile; the engine
 * decides truth. That seam is the point.
 */

// ─────────────────────────────────────────── Catalog types
type Category =
  | "residency" | "tax" | "health" | "mobility"
  | "banking" | "family" | "property" | "admin";
type Severity = "info" | "recommended" | "required" | "penalty";
type AnchorKind = "arrival" | "residency_established" | "padron_done" | "property_purchase";

type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { field: string; op: "eq" | "gt" | "in" | "exists"; value?: unknown };

type Timing =
  | { kind: "asap" }
  | { kind: "absolute_recurring"; rrule: string }
  | { kind: "relative_to_event"; anchor: AnchorKind; offset_days: number }
  | { kind: "relative_to_obligation"; after: string; offset_days: number };

type Obligation = {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  applies_if: Condition;
  depends_on: string[];
  timing: Timing;
};

// ─────────────────────────────────────────── Person types
type Urgency = "immediate" | "soon" | "exploratory";
type ConcernTheme = "money" | "health" | "kids" | "bureaucracy" | "language" | "belonging";
type Concern = { theme: ConcernTheme; intensity: 1 | 2 | 3 | 4 | 5 };

type Profile = {
  nationalities: string[];
  is_eu: boolean;
  nationality_has_dgt_agreement: boolean;
  is_tax_resident: boolean;
  foreign_assets_eur: number;
  owns_or_drives: boolean;
  has_children: boolean;
  has_spanish_address: boolean;
  urgency: Urgency;
  arrival_date?: string;            // may be absent → projected from urgency
  residency_established?: string;   // "known-later" anchor; backfilled by the living profile
  padron_done?: string;
  disposition: 1 | 2 | 3 | 4 | 5;   // 1 confident … 5 overwhelmed
  concerns: Concern[];
};

// concerns ride alongside the plan; they never gate it
const CONCERN_TO_CATEGORY: Record<ConcernTheme, Category[]> = {
  money: ["tax", "banking", "property"],
  health: ["health"],
  kids: ["family", "health"],
  bureaucracy: ["residency", "admin"],
  language: ["admin"],
  belonging: [],
};

// ─────────────────────────────────────────── Stage 1 · applicability (the rules DSL)
function getField(p: Profile, path: string): unknown {
  return path.split(".").reduce<any>((o, k) => (o == null ? o : o[k]), p);
}
function evaluate(c: Condition, p: Profile): boolean {
  if ("all" in c) return c.all.every((x) => evaluate(x, p));
  if ("any" in c) return c.any.some((x) => evaluate(x, p));
  if ("not" in c) return !evaluate(c.not, p);
  const a = getField(p, c.field);
  switch (c.op) {
    case "exists": return a != null;
    case "eq": return a === c.value;
    case "gt": return typeof a === "number" && a > (c.value as number);
    case "in": return Array.isArray(c.value) && (c.value as unknown[]).includes(a);
  }
}

// ─────────────────────────────────────────── Stage 2 · topological sort (Kahn, deterministic)
const SEV_RANK: Record<Severity, number> = { penalty: 4, required: 3, recommended: 2, info: 1 };
function priority(a: Obligation, b: Obligation): number {
  return SEV_RANK[b.severity] - SEV_RANK[a.severity]
      || a.category.localeCompare(b.category)
      || a.id.localeCompare(b.id);
}
function topoSort(obs: Obligation[]): Obligation[] {
  const present = new Set(obs.map((o) => o.id));
  const byId = new Map(obs.map((o) => [o.id, o]));
  const indeg = new Map<string, number>(obs.map((o) => [o.id, 0]));
  const adj = new Map<string, string[]>(obs.map((o) => [o.id, []]));

  for (const o of obs)
    for (const dep of o.depends_on)
      if (present.has(dep)) {                 // ← edges to NON-applicable obligations are dropped:
        adj.get(dep)!.push(o.id);             //   a prerequisite outside your journey isn't a blocker.
        indeg.set(o.id, indeg.get(o.id)! + 1);
      }

  const ready = obs.filter((o) => indeg.get(o.id) === 0).sort(priority);
  const out: Obligation[] = [];
  while (ready.length) {
    const o = ready.shift()!;
    out.push(o);
    for (const n of adj.get(o.id)!)
      if (indeg.set(n, indeg.get(n)! - 1).get(n) === 0)
        ready.push(byId.get(n)!), ready.sort(priority);
  }
  if (out.length !== obs.length)              // leftover nodes ⇒ a cycle in the catalog
    throw new Error("Cycle: " + [...present].filter((id) => !out.some((o) => o.id === id)));
  return out;
}

// ─────────────────────────────────────────── Stage 3 · timing resolution
type Resolved =
  | { state: "scheduled"; start: Date; due: Date; estimated: boolean }
  | { state: "pending_anchor"; anchor: AnchorKind }     // known-later: no fake date
  | { state: "recurring"; nextDue: Date };

const ARRIVAL_OFFSET: Record<Urgency, number> = { immediate: 0, soon: 45, exploratory: 365 };
const ASAP_WINDOW:    Record<Urgency, number> = { immediate: 14, soon: 30, exploratory: 60 };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

function arrivalAnchor(p: Profile, today: Date): Date {
  return p.arrival_date ? new Date(p.arrival_date) : addDays(today, ARRIVAL_OFFSET[p.urgency]);
}
function anchorDate(a: AnchorKind, p: Profile, today: Date): Date | null {
  switch (a) {
    case "arrival": return arrivalAnchor(p, today);
    case "residency_established": return p.residency_established ? new Date(p.residency_established) : null;
    case "padron_done": return p.padron_done ? new Date(p.padron_done) : null;
    case "property_purchase": return null;
  }
}
// minimal rrule reader — only the one shape the catalog uses (yearly filing window end)
function nextYearlyDeadline(rrule: string, today: Date): Date {
  const months = (rrule.match(/BYMONTH=([\d,]+)/)?.[1] ?? "12").split(",").map(Number);
  const endMonth = Math.max(...months);
  const end = (y: number) => new Date(y, endMonth, 0); // day 0 = last day of prior month index
  const thisYear = end(today.getFullYear());
  return today <= thisYear ? thisYear : end(today.getFullYear() + 1);
}

function resolveTiming(o: Obligation, p: Profile, today: Date, prior: Map<string, Resolved>): Resolved {
  const t = o.timing;
  switch (t.kind) {
    case "asap": {
      const start = arrivalAnchor(p, today);
      return { state: "scheduled", start, due: addDays(start, ASAP_WINDOW[p.urgency]), estimated: false };
    }
    case "absolute_recurring":
      return { state: "recurring", nextDue: nextYearlyDeadline(t.rrule, today) };
    case "relative_to_event": {
      const a = anchorDate(t.anchor, p, today);
      if (!a) return { state: "pending_anchor", anchor: t.anchor };   // e.g. DGT 183-day clock, residency not yet granted
      return { state: "scheduled", start: a, due: addDays(a, t.offset_days), estimated: false };
    }
    case "relative_to_obligation": {
      const base = prior.get(t.after);                                 // prereq already resolved (topo order)
      if (!base || base.state !== "scheduled") return { state: "pending_anchor", anchor: "arrival" };
      return { state: "scheduled", start: base.due, due: addDays(base.due, t.offset_days), estimated: true };
    }
  }
}

// ─────────────────────────────────────────── Stage 4 · assemble objectives
type Phase = "before_you_go" | "first_weeks" | "ongoing" | "when_settled";
type Objective = {
  id: string; title: string; category: Category; severity: Severity;
  timing: Resolved; phase: Phase; linked_concerns: ConcernTheme[];
};

function phaseOf(r: Resolved, arrival: Date): Phase {
  if (r.state === "recurring") return "ongoing";
  if (r.state === "pending_anchor") return "when_settled";
  if (r.due < arrival) return "before_you_go";
  return r.due <= addDays(arrival, 90) ? "first_weeks" : "when_settled";
}

function buildPlan(p: Profile, catalog: Obligation[], today = new Date()): {
  objectives: Objective[]; nextAction?: Objective;
} {
  const applicable = catalog.filter((o) => evaluate(o.applies_if, p)); // stage 1
  const ordered = topoSort(applicable);                                // stage 2
  const arrival = arrivalAnchor(p, today);

  const resolved = new Map<string, Resolved>();
  const objectives = ordered.map((o) => {                              // stages 3 + 4
    const timing = resolveTiming(o, p, today, resolved);
    resolved.set(o.id, timing);
    const cats = new Set(p.concerns.flatMap((c) => CONCERN_TO_CATEGORY[c.theme]));
    return {
      id: o.id, title: o.title, category: o.category, severity: o.severity,
      timing, phase: phaseOf(timing, arrival),
      linked_concerns: p.concerns.filter((c) => CONCERN_TO_CATEGORY[c.theme].includes(o.category)).map((c) => c.theme),
    };
  });

  // dependency order is INVIOLABLE — dates only bucket into phases, never reorder past a prerequisite.
  // "next action" = front of the queue that's actually actionable today.
  const nextAction = objectives.find((o) => o.timing.state === "scheduled");
  return { objectives, nextAction };
}

// ─────────────────────────────────────────── Worked example: your exact persona
const CATALOG: Obligation[] = [
  { id: "empadronamiento", title: "Empadronamiento (padrón)", category: "residency", severity: "required",
    applies_if: { field: "has_spanish_address", op: "eq", value: true }, depends_on: [], timing: { kind: "asap" } },
  { id: "residencia", title: "Residence permit (TIE)", category: "residency", severity: "required",
    applies_if: { field: "is_eu", op: "eq", value: false }, depends_on: ["empadronamiento"],
    timing: { kind: "relative_to_obligation", after: "empadronamiento", offset_days: 30 } },
  { id: "tarjeta-sanitaria", title: "Health card (tarjeta sanitaria)", category: "health", severity: "required",
    applies_if: { field: "has_spanish_address", op: "eq", value: true }, depends_on: ["residencia"],
    timing: { kind: "relative_to_obligation", after: "residencia", offset_days: 14 } },
  { id: "modelo-720", title: "Modelo 720 (foreign assets declaration)", category: "tax", severity: "penalty",
    applies_if: { all: [{ field: "is_tax_resident", op: "eq", value: true }, { field: "foreign_assets_eur", op: "gt", value: 50000 }] },
    depends_on: [], timing: { kind: "absolute_recurring", rrule: "FREQ=YEARLY;BYMONTH=1,2,3" } },
  { id: "dgt-exchange", title: "Exchange driving licence", category: "mobility", severity: "required",
    applies_if: { all: [{ field: "owns_or_drives", op: "eq", value: true }, { field: "nationality_has_dgt_agreement", op: "eq", value: true }] },
    depends_on: ["residencia"], timing: { kind: "relative_to_event", anchor: "residency_established", offset_days: 183 } },
  { id: "dgt-exam", title: "Spanish driving test (theory + practical)", category: "mobility", severity: "required",
    applies_if: { all: [{ field: "owns_or_drives", op: "eq", value: true }, { not: { field: "nationality_has_dgt_agreement", op: "eq", value: true } }] },
    depends_on: ["residencia"], timing: { kind: "relative_to_event", anchor: "residency_established", offset_days: 183 } },
  { id: "escolarizacion", title: "Enrol child in school", category: "family", severity: "required",
    applies_if: { field: "has_children", op: "eq", value: true }, depends_on: ["empadronamiento"],
    timing: { kind: "relative_to_obligation", after: "empadronamiento", offset_days: 7 } },
];

const ANDREW: Profile = {
  nationalities: ["US"], is_eu: false, nationality_has_dgt_agreement: false, // USA → no exchange agreement
  is_tax_resident: true, foreign_assets_eur: 700_000, owns_or_drives: true, has_children: true,
  has_spanish_address: true, urgency: "immediate", arrival_date: "2026-04-01",
  residency_established: undefined,                                          // not yet granted → known-later
  disposition: 4, concerns: [{ theme: "money", intensity: 5 }, { theme: "kids", intensity: 4 }],
};

const plan = buildPlan(ANDREW, CATALOG, new Date("2026-06-30"));
const fmt = (r: Resolved) =>
  r.state === "scheduled" ? `due ${r.due.toISOString().slice(0, 10)}${r.estimated ? " (est.)" : ""}`
  : r.state === "recurring" ? `next ${r.nextDue.toISOString().slice(0, 10)} (yearly)`
  : `⏳ starts when ${r.anchor.replace(/_/g, " ")}`;

console.log("NEXT ACTION →", plan.nextAction?.title, "\n");
for (const o of plan.objectives)
  console.log(`[${o.phase.padEnd(13)}] ${o.severity.padEnd(11)} ${o.title.padEnd(38)} ${fmt(o.timing)}`,
    o.linked_concerns.length ? `  ↳ coach: ${o.linked_concerns.join(", ")}` : "");
