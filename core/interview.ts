/**
 * Interview → Profile controller.
 *
 *   catalog  ──derives──▶  required slots
 *   slots    ──drive────▶  the conversation (deterministic controller)
 *   answers  ──extract──▶  typed Profile        (LLM only here, at the surface)
 *   Profile  ──feeds────▶  the engine (turn 1) ──▶ the report (turn 4)
 *
 * The controller never improvises a question and never invents a field.
 * It asks exactly enough to resolve every `applies_if` in the catalog — no
 * more (adaptive length), no less (you cannot finish with a required slot empty).
 */

// ── shared vocabulary (same DSL as the engine) ───────────────────────────────
type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { field: string; op: "eq" | "gt" | "in" | "exists"; value?: unknown };

type Profile = Record<string, unknown>;

function evaluate(c: Condition, p: Profile): boolean {
  if ("all" in c) return c.all.every((x) => evaluate(x, p));
  if ("any" in c) return c.any.some((x) => evaluate(x, p));
  if ("not" in c) return !evaluate(c.not, p);
  const a = p[c.field];                       // unknown field → undefined → dormant
  switch (c.op) {
    case "exists": return a != null;
    case "eq": return a === c.value;
    case "gt": return typeof a === "number" && a > (c.value as number);
    case "in": return Array.isArray(c.value) && (c.value as unknown[]).includes(a);
  }
}

// ── the catalog (subset of turn 1, enough to exercise every slot path) ───────
type Obligation = { id: string; title: string; severity: "info"|"recommended"|"required"|"penalty"; applies_if: Condition; depends_on: string[] };
const CATALOG: Obligation[] = [
  { id:"empadronamiento", title:"Register at the town hall", severity:"required",
    applies_if:{ field:"has_spanish_address", op:"eq", value:true }, depends_on:[] },
  { id:"residencia", title:"Residence card (TIE)", severity:"required",
    applies_if:{ field:"is_eu", op:"eq", value:false }, depends_on:["empadronamiento"] },
  { id:"tarjeta-sanitaria", title:"Health card", severity:"required",
    applies_if:{ field:"has_spanish_address", op:"eq", value:true }, depends_on:["residencia"] },
  { id:"modelo-720", title:"Modelo 720", severity:"penalty",
    applies_if:{ all:[{ field:"is_tax_resident", op:"eq", value:true }, { field:"foreign_assets_eur", op:"gt", value:50000 }] }, depends_on:[] },
  { id:"dgt-exchange", title:"Exchange driving licence", severity:"required",
    applies_if:{ all:[{ field:"owns_or_drives", op:"eq", value:true }, { field:"nationality_has_dgt_agreement", op:"eq", value:true }] }, depends_on:["residencia"] },
  { id:"dgt-exam", title:"Spanish driving test", severity:"required",
    applies_if:{ all:[{ field:"owns_or_drives", op:"eq", value:true }, { not:{ field:"nationality_has_dgt_agreement", op:"eq", value:true }}] }, depends_on:["residencia"] },
  { id:"escolarizacion", title:"Enrol child in school", severity:"required",
    applies_if:{ field:"has_children", op:"eq", value:true }, depends_on:["empadronamiento"] },
];

// ── slot library: every ASKED field gets prompt + type; some are gated ───────
type Slot = {
  field: string; type: "list"|"bool"|"band";
  prompt_hint: string; options?: string[]; sensitive?: boolean;
  required_if?: Condition;          // dormant until satisfied by what's known
  gates?: string[];                 // ordering hint: ask gates before what they unlock
};
const SLOTS: Slot[] = [
  { field:"nationalities", type:"list", gates:["intends_long_stay"],
    prompt_hint:"where everyone in the household holds citizenship" },
  { field:"has_spanish_address", type:"bool",
    prompt_hint:"whether they already have a Spanish address (rented or owned)" },
  { field:"intends_long_stay", type:"bool", gates:["foreign_assets_eur"],
    prompt_hint:"whether this is a long-term move (more than ~6 months a year) or a shorter stay" },
  { field:"owns_or_drives", type:"bool",
    prompt_hint:"whether anyone will drive here" },
  { field:"has_children", type:"bool",
    prompt_hint:"whether they're bringing school-age children" },
  { field:"foreign_assets_eur", type:"band", sensitive:true,
    required_if:{ field:"is_tax_resident", op:"eq", value:true },
    options:["under €50k","€50k–€200k","€200k–€700k","over €700k","prefer not to say"],
    prompt_hint:"roughly, total assets held OUTSIDE Spain — banded, this drives Modelo 720" },
];

// ── derivations: machine fields the catalog needs, computed not asked ─────────
const EU = new Set(["ES","FR","DE","IT","PT","IE","NL"]);
const DGT_AGREEMENT = new Set(["GB","AR","CO","EC","CH","KR","JP"]); // illustrative; USA absent
type Derivation = { field: string; from: string[]; compute: (p: Profile) => unknown };
const DERIVATIONS: Derivation[] = [
  { field:"is_eu", from:["nationalities"], compute:(p)=> (p.nationalities as string[]).some(n=>EU.has(n)) },
  { field:"nationality_has_dgt_agreement", from:["nationalities"], compute:(p)=> (p.nationalities as string[]).some(n=>DGT_AGREEMENT.has(n)) },
  { field:"is_tax_resident", from:["intends_long_stay"], compute:(p)=> p.intends_long_stay === true },
];

// ── build-time audit: can EVERY applies_if field be resolved? (anti-drift) ────
function collectFields(c: Condition, acc = new Set<string>()): Set<string> {
  if ("all" in c) c.all.forEach(x=>collectFields(x,acc));
  else if ("any" in c) c.any.forEach(x=>collectFields(x,acc));
  else if ("not" in c) collectFields(c.not,acc);
  else acc.add(c.field);
  return acc;
}
function auditCatalog(): string[] {
  const asked = new Set(SLOTS.map(s=>s.field));
  const derived = new Set(DERIVATIONS.map(d=>d.field));
  const needed = new Set<string>();
  CATALOG.forEach(o=>collectFields(o.applies_if).forEach(f=>needed.add(f)));
  return [...needed].filter(f=> !asked.has(f) && !derived.has(f)); // empty ⇒ no drift
}

// ── the extractor seam: the ONLY place a model runs ──────────────────────────
// In production this is one Anthropic call per answer, e.g.:
//   messages:[{role:"user", content:`Slot: ${slot.field} (${slot.type}). User said: "${text}".
//             Return ONLY JSON {"value": <typed>} or {"clarify": "<one short question>"}.`}]
// Tool-use / structured output keeps it inside the typed schema — the model maps
// language to a value, it never decides which questions exist or which laws apply.
type Extraction = { value: unknown } | { clarify: string };
interface Extractor { phrase(slot: Slot): string; extract(slot: Slot, text: string): Extraction; }

// ── the deterministic controller ─────────────────────────────────────────────
function derive(p: Profile): void {
  for (const d of DERIVATIONS)
    if (d.from.every(f => f in p)) p[d.field] = d.compute(p);
}
function relevantUnfilled(p: Profile): Slot[] {
  return SLOTS.filter(s =>
    !(s.field in p) &&                                   // not yet known
    (!s.required_if || evaluate(s.required_if, p)));     // relevant given what's known
}
function nextSlot(p: Profile): Slot | null {
  const pool = relevantUnfilled(p);
  if (!pool.length) return null;
  // ask gating slots first so we never ask a dependent question prematurely
  pool.sort((a,b)=> (b.gates?.length??0)-(a.gates?.length??0));
  return pool[0];
}

type Turn = { lola: string; user: string; got: string };
function runInterview(ex: Extractor, scriptedUser: (s: Slot)=>string): { profile: Profile; transcript: Turn[] } {
  const p: Profile = {}; const transcript: Turn[] = [];
  let slot: Slot | null;
  while ((slot = nextSlot(p))) {                          // exits ONLY when nothing relevant is unfilled
    const lola = ex.phrase(slot);
    let text = scriptedUser(slot);
    let res = ex.extract(slot, text);
    if ("clarify" in res) { text = scriptedUser(slot); res = ex.extract(slot, text); } // one re-ask
    p[slot.field] = (res as {value:unknown}).value;
    derive(p);                                            // refresh machine fields → may unlock/lock slots
    transcript.push({ lola, user:text, got:`${slot.field} = ${JSON.stringify(p[slot.field])}` });
  }
  return { profile: p, transcript };
}

// ── hand-off to the engine (turn 1) — same evaluate(), proves the seam ───────
const SEV: Record<string,number> = { penalty:4, required:3, recommended:2, info:1 };
function plan(p: Profile): Obligation[] {
  const applicable = CATALOG.filter(o => evaluate(o.applies_if, p));
  const present = new Set(applicable.map(o=>o.id));
  const indeg = new Map(applicable.map(o=>[o.id,0]));
  const adj = new Map<string,string[]>(applicable.map(o=>[o.id,[]]));
  for (const o of applicable) for (const d of o.depends_on) if (present.has(d)) { adj.get(d)!.push(o.id); indeg.set(o.id, indeg.get(o.id)!+1); }
  const ready = applicable.filter(o=>indeg.get(o.id)===0).sort((a,b)=>SEV[b.severity]-SEV[a.severity]||a.id.localeCompare(b.id));
  const out: Obligation[] = [];
  while (ready.length){ const o = ready.shift()!; out.push(o); for (const n of adj.get(o.id)!) if (indeg.set(n, indeg.get(n)!-1).get(n)===0){ ready.push(applicable.find(x=>x.id===n)!); ready.sort((a,b)=>SEV[b.severity]-SEV[a.severity]||a.id.localeCompare(b.id)); } }
  return out;
}

// ── DEMO: two people, one catalog, totally different conversations ───────────
const phraseLola = (s: Slot) => ({
  nationalities:"Quick one — where's everyone in the household a citizen?",
  has_spanish_address:"Do you already have a place here, rented or owned?",
  intends_long_stay:"Is this a proper long-term move, or more of a long stay?",
  owns_or_drives:"Will anyone be driving while you're here?",
  has_children:"Any school-age kids coming with you?",
  foreign_assets_eur:"Slightly nosy, and you only pick a range: roughly how much do you hold OUTSIDE Spain?",
}[s.field] ?? s.prompt_hint);

function scriptedExtractor(answers: Record<string,unknown>): Extractor {
  return {
    phrase: phraseLola,
    extract: (slot) => ({ value: answers[slot.field] }), // stands in for the LLM JSON parse
  };
}

const PEOPLE: Record<string, Record<string,unknown>> = {
  "Andrew — US family, staying": {
    nationalities:["US"], has_spanish_address:true, intends_long_stay:true,
    owns_or_drives:true, has_children:true, foreign_assets_eur:700_000,
  },
  "Mara — German remote worker, short stay": {
    nationalities:["DE"], has_spanish_address:true, intends_long_stay:false,
    owns_or_drives:false, has_children:false,
  },
};

console.log("catalog audit — unresolvable fields:", auditCatalog().length === 0 ? "none ✓ (no drift)" : auditCatalog(), "\n");

for (const [name, answers] of Object.entries(PEOPLE)) {
  const ex = scriptedExtractor(answers);
  const { profile, transcript } = runInterview(ex, (s)=>String(answers[s.field]));
  console.log("━".repeat(64));
  console.log(name, `— ${transcript.length} questions asked`);
  console.log("━".repeat(64));
  for (const t of transcript) console.log(`  Lola: ${t.lola}\n   You: ${t.user}\n        → ${t.got}`);
  console.log("\n  PLAN →", plan(profile).map(o=>o.title).join("  ·  "), "\n");
}
