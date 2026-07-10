import { REGION_OPTIONS } from './regions';

type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { field: string; op: "eq" | "gt" | "in" | "exists"; value?: unknown };

export type Profile = Record<string, unknown>;

export type Slot = {
  field: string;
  type: "list" | "bool" | "band" | "date";
  // How the answer is captured in the UI (interview redesign — see docs/INTERVIEW-REDESIGN.md):
  // multi = pick many chips, single = pick one, yesno = Yes/No, date = date entry,
  // typeahead = filter-as-you-type dropdown (for long option lists like the comunidades).
  input: "multi" | "single" | "yesno" | "date" | "typeahead";
  prompt_hint: string;
  options?: string[];
  // Show the Lola text/voice "Other" affordance (free-form, AI-extracted) alongside the chips.
  // Kept for lists/regions where the options can't be exhaustive; off for fixed bands & yes/no.
  allowOther?: boolean;
  // Designed sequence (front-loads roadmap payoff, defers sensitive/refinement). nextSlot() asks
  // the lowest-`order` currently-applicable slot. Gaps of 10 leave room to insert.
  order: number;
  sensitive?: boolean;
  required_if?: Condition;
  gates?: string[];
};

function evaluate(c: Condition, p: Profile): boolean {
  if ("all" in c) return c.all.every((x) => evaluate(x, p));
  if ("any" in c) return c.any.some((x) => evaluate(x, p));
  if ("not" in c) return !evaluate(c.not, p);
  const a = p[c.field];
  switch (c.op) {
    case "exists": return a != null;
    case "eq":     return a === c.value;
    case "gt":     return typeof a === "number" && a > (c.value as number);
    case "in":     return Array.isArray(c.value) && (c.value as unknown[]).includes(a);
  }
}

// The interview. Physical array order no longer matters — nextSlot() asks the lowest-`order`
// currently-applicable slot (see the `order` field). Ordering principle: front-load questions
// that add visible roadmap steps; defer refinement and sensitive asks. `gates` is retained as
// documentation of a slot's downstream reach (no longer used for sequencing).
export const SLOTS: Slot[] = [
  // ── Opener: easy, relatable, adds a step on Q1 ─────────────────────────────
  {
    // Advisory-only: drives the language-classes recommendation. Does NOT touch the DELE A2
    // exemption — that is legally passport-based (is_spanish_speaking_national), not self-report.
    field: "speaks_spanish", type: "band", input: "single", order: 10, allowOther: false,
    options: ["None yet", "A little", "Conversational", "Fluent or native"],
    prompt_hint: "how much Spanish they already speak",
  },

  // ── Round 1: who they are ──────────────────────────────────────────────────
  {
    field: "nationalities", type: "list", input: "multi", order: 20, allowOther: true,
    gates: ["work_situation", "has_spouse_or_partner", "has_children", "annual_income_eur_band",
            "intends_long_stay", "previously_ex_spanish_colony_nationality"],
    // Plain plural, no "(s)": Lola echoes this hint into the spoken question and TTS
    // reads a parenthetical "(s)" out loud (user report, 2026-07-04).
    prompt_hint: "what passports everyone in the household holds — people sometimes hold more than one",
  },

  // ── Round 2: work & income ─────────────────────────────────────────────────
  {
    field: "work_situation", type: "list", input: "single", order: 30, allowOther: true,
    gates: ["annual_income_eur_band", "employer_country_is_foreign"],
    options: ["employed_remote", "contractor_freelance", "self_employed", "business_owner",
              "student", "retired", "passive_income", "job_seeker"],
    prompt_hint: "their work situation when they move — remote employee, freelancer, retired, studying, etc.",
  },
  {
    field: "employer_country_is_foreign", type: "bool", input: "yesno", order: 60,
    required_if: { field: "work_situation", op: "eq", value: "employed_remote" },
    prompt_hint: "whether their employer is based outside Spain (vs a Spanish company hiring them)",
  },
  {
    // Sensitive → deferred despite high leverage; drives visa qualification.
    field: "annual_income_eur_band", type: "band", input: "single", order: 170, allowOther: false,
    required_if: { field: "is_eu", op: "eq", value: false },
    options: ["under €20k", "€20k–€28k", "€28k–€34k", "€34k–€60k", "€60k+"],
    prompt_hint: "their rough annual household income in euros — determines which visa they qualify for",
  },

  // ── Round 3: family ─────────────────────────────────────────────────────────
  {
    field: "has_spouse_or_partner", type: "bool", input: "yesno", order: 70,
    gates: ["partner_is_married"],
    prompt_hint: "whether a spouse or partner will be relocating with them",
  },
  {
    field: "partner_is_married", type: "bool", input: "yesno", order: 80,
    required_if: { field: "has_spouse_or_partner", op: "eq", value: true },
    prompt_hint: "whether they are legally married or in a registered civil partnership",
  },
  {
    field: "has_children", type: "bool", input: "yesno", order: 90,
    prompt_hint: "whether school-age children will be making this move",
  },

  // ── Round 4: life in Spain ──────────────────────────────────────────────────
  {
    field: "intends_long_stay", type: "bool", input: "yesno", order: 40,
    gates: ["foreign_assets_eur_band"],
    prompt_hint: "whether this is a long-term move (more than 183 days a year) or a shorter extended stay",
  },
  {
    field: "arrival_date", type: "date", input: "date", order: 50,
    prompt_hint: "roughly when they plan to arrive in Spain — even an approximate month is enough to anchor real deadlines",
  },
  {
    field: "has_spanish_address", type: "bool", input: "yesno", order: 100,
    prompt_hint: "whether they already have a Spanish address — rented or owned",
  },
  {
    field: "owns_or_drives", type: "bool", input: "yesno", order: 150,
    prompt_hint: "whether anyone in the household will drive in Spain",
  },
  {
    field: "owns_property_in_spain", type: "bool", input: "yesno", order: 110,
    gates: ["property_purchase"],
    prompt_hint: "whether they own or are actively planning to purchase property in Spain",
  },
  {
    field: "property_purchase", type: "date", input: "date", order: 120,
    required_if: { field: "owns_property_in_spain", op: "eq", value: true },
    prompt_hint: "roughly when they completed (or expect to complete) the property purchase — anchors the notary, registry, and transfer-tax deadlines",
  },
  {
    // Only relevant to movers who don't already own a place; gates the (advisory) scouting step.
    field: "knows_where_to_live", type: "bool", input: "yesno", order: 130,
    required_if: { not: { field: "owns_property_in_spain", op: "eq", value: true } },
    prompt_hint: "whether they already know which city or region in Spain they'll settle in, or are still deciding where to live",
  },
  {
    // Region-awareness v1 (2026-07-04): asked only of movers who know where they're going
    // (or already own there). "not_sure" is a fine answer. No applies_if tests this field —
    // it personalizes the regional-variation notes on plan steps and stays ready for the
    // per-region content pass.
    field: "region", type: "band", input: "typeahead", order: 140, allowOther: false,
    required_if: { any: [
      { field: "knows_where_to_live", op: "eq", value: true },
      { field: "owns_property_in_spain", op: "eq", value: true },
    ] },
    options: REGION_OPTIONS,
    prompt_hint: "which comunidad autónoma (region of Spain) they'll settle in — if they name a city or province, map it to its comunidad; 'not sure yet' is a fine answer",
  },
  {
    field: "has_pets", type: "bool", input: "yesno", order: 160,
    prompt_hint: "whether any pets — dogs, cats, or ferrets — will be making this move with them",
  },

  // ── Round 5: sensitive / background ────────────────────────────────────────
  {
    field: "foreign_assets_eur_band", type: "band", input: "single", order: 180, allowOther: false, sensitive: true,
    required_if: { field: "is_tax_resident", op: "eq", value: true },
    options: ["under €50k", "€50k–€200k", "€200k–€700k", "over €700k", "prefer not to say"],
    prompt_hint: "roughly, total assets held outside Spain — only a range is needed, drives Modelo 720",
  },
  {
    field: "previously_ex_spanish_colony_nationality", type: "bool", input: "yesno", order: 200,
    required_if: { field: "is_eu", op: "eq", value: false },
    prompt_hint: "whether they hold nationality from a former Spanish colony (most Latin American countries, Philippines) — this affects citizenship timelines",
  },
  {
    // Decides whether the citizenship track applies at all vs. just rolling residence renewals.
    // Only relevant to non-EU long-stay movers (EU citizens don't naturalise this way; short stays
    // never reach it).
    field: "wants_citizenship", type: "bool", input: "yesno", order: 210,
    required_if: { all: [
      { field: "is_eu", op: "eq", value: false },
      { field: "intends_long_stay", op: "eq", value: true },
    ] },
    prompt_hint: "whether, longer term, they hope to become a Spanish citizen — or plan to just keep renewing their residence to stay. Frame it as: some people aim for citizenship, others are happy renewing their residence indefinitely; there's no wrong answer",
  },
];

// ── EU/EEA + Switzerland ───────────────────────────────────────────────────────
const EU = new Set([
  "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HR","HU",
  "IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK",
  "IS","LI","NO", // EEA
  "CH",           // Switzerland
]);

// Countries with DGT bilateral exchange agreement (no theory/practical exam)
const DGT_AGREEMENT = new Set(["GB","AR","BO","BR","CH","CL","CO","CR","CU","DO","EC","GT","GY","HN","JP","KR","MX","NI","PA","PE","PY","SR","SV","TT","UY","VE"]);

// Former Spanish colonies → 2-year citizenship track
const EX_COLONY = new Set(["AR","BO","CL","CO","CR","CU","DO","EC","GT","GQ","HN","MX","NI","PA","PE","PH","PR","PY","SV","UY","VE"]);

// Nationals of countries where Spanish is an official language → exempt from the DELE A2 exam
// for naturalisation. NOT the same set as EX_COLONY: the Philippines gets the 2-year citizenship
// track but Spanish is not official there, so Filipino applicants still need DELE (this split is
// why the two sets exist — a single "ex-colony" flag mis-gated DELE for PH).
const SPANISH_SPEAKING = new Set([...EX_COLONY].filter(c => c !== "PH"));

const INCOME_BAND_MIDPOINT: Record<string, number> = {
  "under €20k":   10_000,
  "€20k–€28k":   24_000,
  "€28k–€34k":   31_000,
  "€34k–€60k":   47_000,
  "€60k+":        80_000,
};

const ASSETS_BAND_MIDPOINT: Record<string, number> = {
  "under €50k":       25_000,
  "€50k–€200k":      125_000,
  "€200k–€700k":     450_000,
  "over €700k":    1_000_000,
  "prefer not to say": 0,
};

function deriveVisaType(p: Profile): string | null {
  if (p.is_eu) return "eu_citizen";
  const work = p.work_situation as string | undefined;
  if (!work) return null;
  if (work === "employed_remote") {
    if (p.employer_country_is_foreign === undefined) return null;
    return p.employer_country_is_foreign ? "dnv" : "work_permit";
  }
  if (work === "contractor_freelance") return "dnv";
  if (work === "student") return "student";
  if (work === "self_employed" || work === "business_owner") return "self_employment";
  // retired, passive_income, job_seeker, none → NLV if income qualifies
  return "nlv";
}

type Derivation = { field: string; from: string[]; compute: (p: Profile) => unknown };

// Exported so core/catalog-audit.ts can verify the catalog↔interview contract (invariant 2).
export const DERIVATIONS: Derivation[] = [
  { field: "is_eu", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => EU.has(n)) },

  { field: "nationality_has_dgt_agreement", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => DGT_AGREEMENT.has(n)) },

  // Passport-derived, with the interview's explicit yes/no as an OR-fallback — catches dual
  // nationals who under-report their passports but confirm ex-colony nationality when asked.
  { field: "is_ex_colony_national", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => EX_COLONY.has(n))
                 || p.previously_ex_spanish_colony_nationality === true },

  // Gates the DELE A2 exemption (naturalisation). Deliberately passport-only: the explicit
  // ex-colony answer can't distinguish Spanish-speaking (exempt) from PH (not exempt), so we
  // only exempt when a passport positively shows a Spanish-speaking country.
  { field: "is_spanish_speaking_national", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => SPANISH_SPEAKING.has(n)) },

  { field: "is_tax_resident", from: ["intends_long_stay"],
    compute: (p) => p.intends_long_stay === true },

  { field: "foreign_assets_eur", from: ["foreign_assets_eur_band"],
    compute: (p) => ASSETS_BAND_MIDPOINT[p.foreign_assets_eur_band as string] ?? 0 },

  { field: "annual_income_eur", from: ["annual_income_eur_band"],
    compute: (p) => INCOME_BAND_MIDPOINT[p.annual_income_eur_band as string] ?? 0 },

  { field: "family_extra_count", from: ["has_spouse_or_partner", "has_children"],
    compute: (p) => (p.has_spouse_or_partner ? 1 : 0) + (p.has_children ? 1 : 0) },

  { field: "nlv_income_threshold", from: ["family_extra_count"],
    compute: (p) => 28_800 + 7_200 * (p.family_extra_count as number) },

  { field: "dnv_income_threshold", from: ["has_spouse_or_partner", "has_children"],
    compute: (p) => 34_000 + (p.has_spouse_or_partner ? 13_000 : 0) + (p.has_children ? 4_000 : 0) },

  { field: "visa_type", from: ["is_eu", "work_situation"],
    compute: (p) => deriveVisaType(p) },

  { field: "is_self_employed_in_spain", from: ["work_situation"],
    compute: (p) => ["contractor_freelance", "self_employed", "business_owner"].includes(p.work_situation as string) },
];

export function derive(p: Profile): void {
  for (const d of DERIVATIONS)
    if (d.from.every(f => f in p)) p[d.field] = d.compute(p);
}

// A slot counts toward the interview if it's already answered, or it's unanswered but its
// `required_if` gate is currently satisfied (so it will be asked). Shared by interviewProgress
// and the weighted completeness metric (core/completeness.ts) so gating semantics stay identical.
export function isSlotApplicable(s: Slot, p: Profile): boolean {
  if (s.field in p) return true;
  return !s.required_if || evaluate(s.required_if, p);
}

// Rough interview progress for the UI. `total` is answered + currently-applicable
// unanswered slots; it can tick up by one when a branch opens (e.g. saying you have a
// partner reveals the marriage question), so callers should clamp progress monotonically.
export function interviewProgress(p: Profile): { answered: number; total: number } {
  const answered = SLOTS.filter(s => s.field in p).length;
  const remaining = SLOTS.filter(s => !(s.field in p) && (!s.required_if || evaluate(s.required_if, p))).length;
  return { answered, total: answered + remaining };
}

export function nextSlot(p: Profile): Slot | null {
  const pool = SLOTS.filter(s =>
    !(s.field in p) &&
    (!s.required_if || evaluate(s.required_if, p))
  );
  if (!pool.length) return null;
  // Designed sequence: lowest `order` first (front-loads roadmap payoff, defers sensitive).
  pool.sort((a, b) => a.order - b.order);
  return pool[0];
}
