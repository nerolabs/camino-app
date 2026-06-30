type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { field: string; op: "eq" | "gt" | "in" | "exists"; value?: unknown };

export type Profile = Record<string, unknown>;

export type Slot = {
  field: string;
  type: "list" | "bool" | "band";
  prompt_hint: string;
  options?: string[];
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

export const SLOTS: Slot[] = [
  // ── Round 1: who they are ──────────────────────────────────────────────────
  {
    field: "nationalities", type: "list",
    gates: ["work_situation", "has_spouse_or_partner", "has_children", "annual_income_eur_band",
            "intends_long_stay", "us_resident", "previously_ex_spanish_colony_nationality"],
    prompt_hint: "what passport(s) everyone in the household holds",
  },

  // ── Round 2: work & income ─────────────────────────────────────────────────
  {
    field: "work_situation", type: "list",
    gates: ["annual_income_eur_band", "employer_country_is_foreign"],
    options: ["employed_remote", "contractor_freelance", "self_employed", "business_owner",
              "student", "retired", "passive_income", "job_seeker"],
    prompt_hint: "their work situation when they move — remote employee, freelancer, retired, studying, etc.",
  },
  {
    field: "employer_country_is_foreign", type: "bool",
    required_if: { field: "work_situation", op: "eq", value: "employed_remote" },
    prompt_hint: "whether their employer is based outside Spain (vs a Spanish company hiring them)",
  },
  {
    field: "annual_income_eur_band", type: "band",
    required_if: { field: "is_eu", op: "eq", value: false },
    options: ["under €20k", "€20k–€28k", "€28k–€34k", "€34k–€60k", "€60k+"],
    prompt_hint: "their rough annual household income in euros — determines which visa they qualify for",
  },

  // ── Round 3: family ─────────────────────────────────────────────────────────
  {
    field: "has_spouse_or_partner", type: "bool",
    gates: ["partner_is_married"],
    prompt_hint: "whether a spouse or partner will be relocating with them",
  },
  {
    field: "partner_is_married", type: "bool",
    required_if: { field: "has_spouse_or_partner", op: "eq", value: true },
    prompt_hint: "whether they are legally married or in a registered civil partnership",
  },
  {
    field: "has_children", type: "bool",
    prompt_hint: "whether school-age children will be making this move",
  },

  // ── Round 4: life in Spain ──────────────────────────────────────────────────
  {
    field: "intends_long_stay", type: "bool",
    gates: ["foreign_assets_eur_band"],
    prompt_hint: "whether this is a long-term move (more than 183 days a year) or a shorter extended stay",
  },
  {
    field: "has_spanish_address", type: "bool",
    prompt_hint: "whether they already have a Spanish address — rented or owned",
  },
  {
    field: "owns_or_drives", type: "bool",
    prompt_hint: "whether anyone in the household will drive in Spain",
  },

  // ── Round 5: sensitive / background ────────────────────────────────────────
  {
    field: "foreign_assets_eur_band", type: "band", sensitive: true,
    required_if: { field: "is_tax_resident", op: "eq", value: true },
    options: ["under €50k", "€50k–€200k", "€200k–€700k", "over €700k", "prefer not to say"],
    prompt_hint: "roughly, total assets held outside Spain — only a range is needed, drives Modelo 720",
  },
  {
    field: "us_resident", type: "bool",
    required_if: { field: "is_eu", op: "eq", value: false },
    prompt_hint: "whether they are currently based in the US — affects consulate and wait times",
  },
  {
    field: "previously_ex_spanish_colony_nationality", type: "bool",
    required_if: { field: "is_eu", op: "eq", value: false },
    prompt_hint: "whether they hold nationality from a former Spanish colony (most Latin American countries, Philippines) — this affects citizenship timelines",
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

const DERIVATIONS: Derivation[] = [
  { field: "is_eu", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => EU.has(n)) },

  { field: "nationality_has_dgt_agreement", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => DGT_AGREEMENT.has(n)) },

  { field: "is_ex_colony_national", from: ["nationalities"],
    compute: (p) => (p.nationalities as string[]).some(n => EX_COLONY.has(n)) },

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
];

export function derive(p: Profile): void {
  for (const d of DERIVATIONS)
    if (d.from.every(f => f in p)) p[d.field] = d.compute(p);
}

export function nextSlot(p: Profile): Slot | null {
  const pool = SLOTS.filter(s =>
    !(s.field in p) &&
    (!s.required_if || evaluate(s.required_if, p))
  );
  if (!pool.length) return null;
  pool.sort((a, b) => (b.gates?.length ?? 0) - (a.gates?.length ?? 0));
  return pool[0];
}
