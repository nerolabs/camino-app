# THESIS.md — Camino's design thesis & invariants

The canonical design memory for Camino: what it is, the thesis, and the four invariants
you must not break. This was folded in from the original `nerolabs/camino` seed repo
(now archived) so the app has a single source of truth.

**For current state — what's built, where things live, what's next — see [`../HANDOFF.md`](../HANDOFF.md).**
This file is the timeless *why*; HANDOFF is the living *now*.

## What Camino is

An AI guide that turns relocating to a new country (Spain first) into a sequenced,
personal, deadline-aware plan, and coaches the user through it in the voice of a warm
guide named **Lola**.

## The thesis (don't lose this)

Don't model *journeys* — they're infinite. Model *obligations* — finite, ~100 atomic
units whose combinations generate the 10,000 journeys for free. The catalog is content;
the engine is small and fixed.

## The four pieces and their invariants

These invariants are the whole design. Preserve them. If a change would break one, stop
and flag it rather than working around it.

1. **The deterministic spine (`core/engine-controller.ts`).** Filter obligations by
   `applies_if` (a small Condition DSL) → topological sort by `depends_on` → resolve
   `timing` → bucket into phases.
   - Dependency order is **inviolable**. Dates bucket into phases; they never reorder a
     task ahead of a prerequisite.
   - Unknown anchors stay unknown. A date you don't have yet (e.g. residency-relative
     clocks) renders as "starts once X happens" — never a fabricated date.
   - **No LLM runs in the engine.** Given a profile, the plan is deterministic.

2. **The catalog-derived interview (`core/interview.ts` / `core/interview-controller.ts`).**
   The question set is *derived* from the catalog: every field any `applies_if` tests is a
   required slot.
   - `auditCatalog()` fails the build if any obligation references a field the interview
     can't fill. The interview cannot drift from the rules. Keep it that way.
   - Ask human questions; *derive* machine fields (don't ask "are you EU?", derive it from
     nationality).
   - The `Extractor` interface is the **only** place a model runs. Keep it swappable — it's
     also the eval harness.

3. **The bounded persona (`design/persona-lola-system-prompt.md`).**
   - Disposition (1–5) controls information *density*, not just tone.
   - One rule outranks warmth: **never trade truth for comfort.** Lola may not invent a
     deadline/cost/law (those come only from plan data) and may never soothe a penalty
     obligation into sounding optional. Every obligation carries a `source`
     (`official` / `webinar` / `domain`); grounding is auditable in `core/SOURCING.md`.

4. **The report (`design/report-prototype.html`).** A pure function of the plan. Honesty as
   UI: one hero step, estimated vs firm dates, dateless pending steps.

## Where AI runs — and where it must not

Exactly two surface calls: (a) phrase a question in Lola's voice, (b) extract a free-text
answer into a typed value. Everything load-bearing — which obligations apply, in what
order, by when — is deterministic code the model does not touch.

## Brand & voice (build UI to this)

Full identity in [`design/brand.md`](./design/brand.md). The invariants for any UI work:

- **Palette:** cobalt `#2B5AA3` (Camino/system), indigo `#15243B` (text), sherry amber
  `#BD8318` (Lola), olive `#5E7355` (done), cal `#FBFAF7` (ground). **Amber means Lola is
  present** — never use it for ordinary buttons.
- **Type:** Fraunces = the voice (Lola, headlines); Hanken Grotesk = the interface (labels,
  data).
- **Lola is a breathing glyph, not a face** (decision on record). The azulejo compass-star
  with six states (Present / Listening / Finding the way / Guiding / Holding / Done). When
  the user is overwhelmed, the glyph *slows* — presence does the disposition work.
- **Two voice registers:** Camino (plain system labels) vs Lola (warm, narrates the why,
  bilingual, never trades truth for comfort). Canonical lines are in `brand.md`.
- **Spoken voice:** warm, lightly Spanish-inflected English, accurate Spanish only on
  Spanish terms. Clarity beats accent when they conflict. (Now live via ElevenLabs TTS.)

## Conventions

- TypeScript, strict. The core is pure and side-effect-free; keep it that way.
- The catalog is **data**, not code. New obligations are catalog entries, never engine
  changes.

## Scope

Guidance, not legal or tax advice. Lola keeps the map; a gestor signs the papers.
