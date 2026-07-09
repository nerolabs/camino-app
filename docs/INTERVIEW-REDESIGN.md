# Interview redesign — living-roadmap design doc

**Status:** DRAFT for build. Scope = the three load-bearing decisions Phase 0 builds
against. Cosmetic layers (animations, copy, chip visuals) are deliberately left to
iterate on the running app.

## Why (grounded in PostHog, 2026-07-06→08 traffic)

- Interview funnel: **179 visitors → 59 started → 18 completed** (~31% of starters finish;
  ~69% who start never do).
- Intent split (first-touch): **Reddit ~60% finish, LinkedIn 0/17** — the interview is
  fine for high-intent traffic and irrelevant to curiosity traffic. Optimize for the former.
- Worst questions by `interview_clarify_needed` (extractor fumbles a real answer):
  **work_situation 15 clarifies/10 people (and it's Q2)**, annual_income_eur_band 10/4,
  owns_or_drives 9/7, arrival_date 6/4 — *every one has fixed options or is yes/no but is
  currently free-typed.*
- Median completion time **7.2 min** vs the landing page's promised "3 minutes."
- Replays: the LLM-phrased `work_situation` question rendered **grammatically broken**
  ("…freelancing, still be, or something else?"); even completers grind (560 keystrokes).

**Root cause:** value is 100% deferred to the end, so the funnel is *subtractive* — every
question is a chance to quit before any payoff. The redesign makes it *additive*: the
roadmap visibly grows with each answer. This is the existing "living roadmap" thesis moved
one screen earlier — the interview *becomes* the act of growing the roadmap.

## The architecture already supports this

`buildPlan(profile: Profile): Objective[]` is a **pure function** — it evaluates every
catalog objective's `applies_if` against the (derived) profile and returns the ordered
applicable set. `app/interview.tsx` already calls `derive(next_profile)` on *every* answer.
So the plan is recomputed each turn today; we simply don't render it. The live roadmap is a
**rendering + delta-animation** job, not an engine change.

---

## Decision 1 — the plan-delta primitive (`core/plan-delta.ts`)

The single abstraction every surface renders from. Web two-pane, mobile "+6 steps", and
resume all consume this — design it once so presentation can diverge while logic can't.

```ts
export type PlanChange = {
  id: string;
  objective: Objective;                 // the AFTER version
  fields: Array<'timing' | 'severity' | 'phase' | 'title' | 'regional'>;
};

export type PlanDelta = {
  added:   Objective[];                 // ids in after, not before
  removed: Objective[];                 // ids in before, not after
  changed: PlanChange[];                // same id, salient field differs
  after:   Objective[];                 // full current plan, already topo-sorted
};

// Pure. Keyed by objective.id. Compares a stable projection of each objective
// (serialized timing, phase, severity, title, regional) so Date identity never
// causes false "changed". Ignores done/completedOn by default (no completions
// happen mid-interview; the plan page can opt back in).
export function diffPlans(
  before: Objective[],
  after: Objective[],
  opts?: { include?: Array<'done'> },
): PlanDelta;
```

**Per-answer flow** (in `submit()`):
```ts
const next = { ...profile, [slot.field]: value };
derive(next);
const after  = buildPlan(next);
const delta  = diffPlans(beforeRef.current, after);   // beforeRef = last turn's buildPlan
beforeRef.current = after;
```

**Rendering contracts**
- **Web two-pane:** render `after` in roadmap order; on delta, slide+highlight `added` in
  their sorted position, pulse `changed` (e.g. a deadline just got a date), soft-collapse
  `removed`.
- **Mobile:** summarize → "Your answer added {added.length} steps" (+ "updated N dates",
  "removed N"). A button opens a sheet listing the delta. No two-pane.
- **Resume:** show `after` + "You've built {after.length} steps so far."

**Honesty rules (invariant 3 — no unsourced/flickering steps)**
- `added` animate in immediately.
- `removed` are **never silently popped** — narrate them: *"You're an EU citizen, so the
  visa-application steps don't apply — removed 5. Simpler for you."* Removal-as-relief.
- A step that could appear then vanish across answers must use the soft/narrated removal
  path, never a flicker.

---

## Decision 2 — the completeness metric (`interviewProgress` v2)

Replace "Question 3 of 11 · 3 min left" (frames the interview as a chore with an end) with
a **roadmap-anchored % complete** that (a) encourages continuing and (b) drives the resume
nudge. Raw `answered / total` is wrong: gating makes `total` tick up mid-flow, and it
treats `has_pets` as equal to `nationalities`.

**Definition — weighted coverage of currently-applicable slots:**
```
completeness_raw = Σ weight(answered applicable slots)
                 / Σ weight(all currently-applicable slots)     // answered + remaining
```
- `weight(slot)` = number of catalog objectives whose `applies_if` references that slot's
  field — **directly or transitively via `DERIVATIONS.from`** — floored at 1. High-leverage
  slots (nationalities, work_situation, intends_long_stay) move the bar a lot; low-leverage
  ones barely nudge it. This ties "% complete" to "how much of your roadmap is determined."
- Compute `SLOT_WEIGHT: Record<field, number>` **statically once** by walking each
  objective's `applies_if` condition tree, collecting referenced fields, and mapping derived
  fields back to their source slots through the `DERIVATIONS` closure.

**Display rules**
- Clamp **monotonic** across the session (reuse the existing `progressRef` pattern) so a
  branch opening never moves the bar backward.
- Cap at **95%** while `nextSlot(profile) !== null`; show **100%** only when no applicable
  slot remains. (Never "100%" with questions left; never a backward jump.)

**Resume** (Phase 0, anonymous): persist `{ answers, completeness, lastSlotField, updatedAt }`
to `localStorage` on every answer. On return: *"Welcome back — your roadmap is 60% complete.
Pick up where you left off?"* (Signed-in users already persist to the DB via `saveProfileDb`.)

---

## Decision 3 — final slot list, ordering & input model

### Slot type additions
```ts
export type Slot = {
  field: string;
  type: "list" | "bool" | "band" | "date";
  input: "multi" | "single" | "yesno" | "date";   // NEW — UI affordance
  options?: string[];
  allowOther?: boolean;   // NEW — show Lola text/voice "Other". default: list/band → true
  order: number;          // NEW — explicit designed sequence
  sensitive?: boolean;
  required_if?: Condition;
  gates?: string[];
};
```
`nextSlot()` changes from "most-gating first" to **sort the applicable pool by `order` asc**,
so the sequence is designed, not emergent.

### Chips + "Other" (the interaction)
- Chip questions render **static, pre-written, localized** copy — **no per-question Haiku
  phrasing call.** This kills the "still be" mangling *and* removes a model call + spinner
  from every turn.
- `allowOther` reveals the existing text/voice composer. The extraction pipeline
  (`extractionPrompt` + `phraseClarify`) runs **only on "Other"** — where it earns its keep:
  captures richer data to refine chip sets later, and disambiguates. Keep opportunistic
  autofill for rich Other answers. **User decision (2026-07-09): keep Lola for Other.**
- Make chips exhaustive so Other is rare. `work_situation` options already cover
  employed_remote / contractor_freelance / self_employed / business_owner / student /
  retired / passive_income / job_seeker — surface all as chips.

### Ordering principle: front-load *roadmap payoff*, defer *refinement & sensitive*
Order by "how many visible steps does answering this add/settle," not by logical grouping.
Lead with easy, relatable, high-payoff taps; push sensitive/low-payoff to the end.

| order | field | input | payoff | notes |
|--|--|--|--|--|
| 10 | **speaks_spanish** (NEW) | single | med | Easy warm-up; **adds a language-classes step on Q1** for most → instant reward |
| 20 | nationalities | multi | **hi** | country multiselect; unlocks is_eu → whole visa branch |
| 30 | work_situation | single | **hi** | chips incl. retired/student/job_seeker |
| 40 | intends_long_stay | yesno | **hi** | gates tax residency, Modelo 720, citizenship |
| 50 | arrival_date | date | **hi** | anchors deadlines → many steps get dates (visible `changed`) |
| 60 | employer_country_is_foreign | yesno | med | (gated) DNV vs work-permit |
| 70 | has_spouse_or_partner | yesno | med | family income thresholds |
| 80 | partner_is_married | yesno | lo | (gated) |
| 90 | has_children | yesno | med | school steps |
| 100 | has_spanish_address | yesno | med | empadronamiento branch |
| 110 | owns_property_in_spain | yesno | med | **rephrase — see below** |
| 120 | property_purchase | date | med | (gated) notary/registry/tax anchors |
| 130 | knows_where_to_live | yesno | lo | (gated) advisory scouting |
| 140 | region | single | lo | personalizes regional notes |
| 150 | owns_or_drives | yesno | lo | **rephrase — see below** |
| 160 | has_pets | yesno | lo | |
| 170 | annual_income_eur_band | band | **hi** | sensitive → deferred despite leverage; drives visa qualification |
| 180 | foreign_assets_eur_band | band | med | sensitive; Modelo 720 |
| 190 | us_resident | yesno | lo | consulate wait times |
| 200 | previously_ex_spanish_colony_nationality | yesno | med | citizenship timeline |
| 210 | wants_citizenship | yesno | med | (gated) citizenship track |

*(Gaps of 10 leave room to insert without renumbering.)*

### New slot: `speaks_spanish`
```ts
{ field: "speaks_spanish", type: "band", input: "single", order: 10, allowOther: false,
  options: ["None yet", "A little", "Conversational", "Fluent or native"],
  prompt_hint: "how much Spanish they already speak" }
```
- **Drives one NEW advisory catalog objective** — `language-classes`, `severity:
  'recommended'`, gated `applies_if: { field: 'speaks_spanish', op: 'in',
  value: ['None yet', 'A little'] }`. Advisory items may omit `source_url` (severity conveys
  strength — see engine-controller header). Requested unprompted by real users (2026-07-08).
- **Does NOT touch the DELE A2 exemption.** ⚠️ Correction to an earlier suggestion: the
  exemption is **legally passport-based** (`is_spanish_speaking_national`, nationality of a
  Spanish-official country) and is already implemented correctly — including the Philippines
  split. A fluent *non-native* still must sit DELE A2, so self-reported fluency must not gate
  it. `speaks_spanish` is **advisory-only.**

### Rephrase (replaces broken/ambiguous phrasing — confirmed friction)
- `owns_or_drives` (9 clarifies/7 people): "owns *or* drives" conflates two things →
  *"Will anyone in your household drive in Spain?"*
- `work_situation`: retire the LLM phrasing; use static copy with the chips.

---

## Phase plan (each phase ships and is measurable against the funnel above)

- **Phase 0 — spine (invisible):** `plan-delta.ts` (+ tests), `SLOT_WEIGHT` +
  completeness v2 (+ tests), anonymous `localStorage` resume. Pure logic, no UI risk.
- **Phase 1 — chips + "Other":** works in today's single column. Add `speaks_spanish`,
  reorder, rephrases. Ship → watch `interview_clarify_needed` on work_situation fall.
- **Phase 2 — web two-pane live roadmap:** consumes the Phase-0 delta; "% complete" reframe.
  The hypothesis test: does watching it grow move drop-off?
- **Phase 3 — mobile "+N steps" + delta sheet:** same delta, different skin. Needs a native
  build → **batch it** (EAS credits are user-gated) and only after Phase 2 proves it on web.

## Standing rules each phase must honor
- Add/adjust tests in the layer that owns the change; update `docs/TEST-COVERAGE.md` same change.
- Update `app/how-i-was-built/log.tsx` + `roadmap.tsx` per shipped batch.
- Any catalog/slot change → run `npm run audit` (catalog↔interview contract, invariant 2).

## Open decisions (need a call before/while building)
1. **Other's reply depth:** accept-and-advance except on true ambiguity (lean, cheap) vs.
   always let Lola give a contextual reply (richer, slower, more spend). *Leaning lean.*
2. **Completeness weighting:** pure objective-count leverage (above) vs. also weight by
   `severity` (required steps worth more than recommended). *Leaning count-only for v1.*
3. **Cold-start seed:** pre-populate the 1–2 universal steps (empadronamiento/NIE) so the
   Q1 canvas isn't empty — confirm which are truly universal in the catalog.
