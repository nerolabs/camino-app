# Camino — Session Handoff

Quick-start context for a fresh Claude Code session working on the **camino-app**
(the Expo app). The canonical project memory — thesis, design invariants, roadmap —
lives in the sibling repo at `../camino/CLAUDE.md`. **Read that first.**

Last updated: 2026-06-30.

## Where things live

- `../camino/CLAUDE.md` — **source of truth.** What Camino is, the four-piece design,
  the invariants you must not break. Read it before touching anything load-bearing.
- `~/Desktop/camino-app/` (here) — the Expo Router app (iOS / Android / web).
- `core/` — the framework-agnostic domain layer (engine + interview). Pure, no UI.

## Architecture in one breath

A deterministic engine turns a user **Profile** into a sequenced **plan**. No LLM runs
in the engine. The interview collects the Profile; an LLM runs in exactly two places —
phrasing a question in Lola's voice, and extracting a free-text answer into a typed
value (`app/interview.tsx`). Everything load-bearing (which obligations apply, order,
deadlines) is deterministic code.

### The core files (the spine)

- `core/interview-controller.ts` — **slots → derivations → nextSlot.** 13 slots. The
  keystone derivation is `visa_type` (eu_citizen / nlv / dnv / student / self_employment /
  work_permit). Almost every obligation branches on it. EU/DGT/ex-colony country sets
  live here too.
- `core/engine-controller.ts` — **filter → topoSort → resolve timing → bucket phases.**
  20-obligation CATALOG. `buildPlan(profile)` is the entry point. Dependency order is
  inviolable; dates bucket into phases but never reorder a task ahead of a prerequisite.
- `core/test-personas.ts` — 6 personas covering NLV / DNV / EU paths. Used by the
  interview screen's dev panel to replay a full interview without typing.

### The screens

- `app/index.tsx` — landing page (rotating Spain photos, hero, CTA).
- `app/interview.tsx` — Lola chat. `phraseQuestion()` + `extractAnswer()` call Haiku
  (`claude-haiku-4-5-20251001`). `STATIC_QUESTIONS` are the non-LLM fallback phrasings.
- `app/plan.tsx` — renders `buildPlan()` output grouped by phase.
- `app/how-it-works.tsx` — marketing explainer (deferred, not iterated recently).
- `components/NavBar.tsx` — shared nav across all screens.

### State & data

- `core/ProfileContext.tsx` — cross-screen profile (React context).
- `core/AuthContext.tsx` — Supabase Google OAuth.
- `core/supabase.ts` — platform-aware client (AsyncStorage native / web).
- `core/profileDb.ts` — load/save profile to the `profiles` table (RLS, one row per user).
- `.env` — `EXPO_PUBLIC_ANTHROPIC_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`. **Gitignored — never commit it.** Metro bundles any
  `EXPO_PUBLIC_`-prefixed var automatically (read via `process.env`, not Constants).

## What was just done (this session)

Expanded the interview + catalog from the "Spain Visas 101" MovingToSpain.com webinar:
- Interview: 6 → **13 slots** (work_situation, employer_country_is_foreign,
  annual_income_eur_band, has_spouse_or_partner, partner_is_married, us_resident,
  previously_ex_spanish_colony_nationality + existing).
- Derivations added: `visa_type`, income/asset midpoints, NLV/DNV income thresholds,
  family counts, ex-colony flag. EU set is now complete (27 + EEA + CH).
- Catalog: 7 → **20 obligations** — visa-path (consulate appt, criminal check, medical
  cert), NLV-specific (income proof, private health insurance), DNV-specific (remote-work
  proof, coverage certificate), NIE, family reunification, citizenship milestones.
- Verified: James (UK retiree) → NLV produces a 14-item sequenced plan; Andrew (US+ES
  spouse) correctly routes as EU-family.

## Suggested next tasks

1. **Remove the DEBUG block in `app/plan.tsx`** (the `JSON.stringify(profile)` dump) and
   design the richer plan view properly — 20 obligations needs better visual grouping,
   severity emphasis (penalty/required), and the consulate-wait warning surfaced.
2. **Test the live interview end-to-end** with the new slots (the LLM extraction prompt
   was updated for `work_situation` and bands — confirm it routes real answers correctly).
3. **Mine more webinars** (health insurance, tax, banking, schools) to widen the catalog
   toward the real ~100 obligations. Highest leverage; touches data, not the engine.
4. Deeper interview: emotional capture, urgency, known-later slots (anchors like
   `arrival_date`, `residency_established` that today render as "starts once X happens").

## Conventions / guardrails

- TypeScript strict. `core/` is pure and side-effect-free — keep it that way.
- The catalog is **data**, not code. New obligations are CATALOG entries, never engine logic.
- Don't break the four invariants in `../camino/CLAUDE.md`. If a change would, stop and flag it.
- Expo SDK is pinned — read https://docs.expo.dev/versions/v56.0.0/ before writing Expo code.
- Run the legacy core demos: `npm run engine`, `npm run interview`.
