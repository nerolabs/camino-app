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

- `core/interview-controller.ts` — **slots → derivations → nextSlot.** 17 slots. The
  keystone derivation is `visa_type` (eu_citizen / nlv / dnv / student / self_employment /
  work_permit). Almost every obligation branches on it. EU/DGT/ex-colony country sets
  live here too. Date slots: `arrival_date`, `property_purchase` (required when
  `owns_property_in_spain`). Other recent slots: `owns_property_in_spain`, `has_pets`.
  Derivation: `is_self_employed_in_spain` (from `work_situation`).
- `core/engine-controller.ts` — **filter → topoSort → resolve timing → bucket phases.**
  54-obligation CATALOG. `buildPlan(profile)` is the entry point. Dependency order is
  inviolable; dates bucket into phases but never reorder a task ahead of a prerequisite.
  Every obligation carries a required `source: 'webinar' | 'domain' | 'official'` field
  (provenance). Currently **28 `webinar`, 26 `official`, 0 `domain`** — the entire `domain`
  audit queue was researched and flipped to `official` (see `core/SOURCING.md`). Obligations
  resolve real dates from `arrival_date` and `property_purchase`; residency-anchored items are
  estimated from arrival and flagged `estimated`. `Objective` also carries `depends_on` (used
  by the plan detail drawer).
- `core/OBLIGATIONS_BACKLOG.md` — 4 real obligations pulled from the live catalog because
  no transcript backs them (`sworn-translation`, `convenio-especial`, `modelo-390`,
  `citizenship-jura`). Full definitions preserved there; re-add once sourced.
- `core/test-personas.ts` — 7 personas covering NLV / DNV / EU / property / freelancer
  paths. Used by the interview screen's dev panel to replay a full interview without typing.

### The screens

- `app/index.tsx` — landing page (rotating Spain photos, hero, CTA).
- `app/interview.tsx` — Lola chat. `phraseQuestion()` + `extractAnswer()` call Haiku
  (`claude-haiku-4-5-20251001`) and are **conversation-aware** — both receive the full transcript,
  so Lola asks natural follow-ups (no per-turn greeting) and the extractor infers from earlier
  answers. `STATIC_QUESTIONS` are the non-LLM fallback phrasings (also used for clarify reprompts).
- `app/plan.tsx` — renders `buildPlan()` output grouped by phase. Cards open a detail drawer with
  an **"Action taken"** section: mark done / done-on-a-date. Completion writes `progress` onto the
  profile; the engine re-anchors downstream steps to the real date (the "living plan").
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

## What was just done (most recent first)

**Desktop interview polish + dictation pass:**
- Interview chat is now a **centered ~640px column** with the composer **directly below the
  conversation** (not docked to the viewport bottom). Added a **progress bar + time estimate**
  under the nav (`interviewProgress()` in the controller, clamped monotonic). Added a **mic
  dictation** button (Web Speech API; web/Chrome, hidden where unsupported).
- The layer-2 re-plan now surfaces a **centered celebratory modal** ("That was useful — I've
  remodelled your plan!" + the deterministic diff) instead of the inline banner (`app/plan.tsx`).

**Conversation + living-roadmap pass:**
- **Conversation-aware interview** — `phraseQuestion`/`extractAnswer` now take the transcript. Lola
  stopped greeting every turn and asks follow-ups that reuse context (mention a "wife" → the spouse
  question becomes a confirmation). Clarify reprompts re-ask in Lola's voice instead of leaking the
  extractor's internal "…extract?" wording.
- **Living roadmap, foundation (deterministic).** Per-obligation `progress` on the profile; an
  "Action taken" drawer section marks a step done (today or a specific date). Done items go olive
  with a ✓ badge + "Completed DATE · N days late/early"; a "done" stat chip shows. A real completion
  date re-anchors downstream `relative_to_obligation` steps to the actual date (firm). No LLM in the
  engine — `progress` is just more profile input.
- **Living roadmap, layer 2 (LLM half).** The drawer's "Something changed?" box takes free text; a
  Haiku Extractor (`parseProfileChange` in `app/plan.tsx`, fields built from `SLOTS`) maps it to a
  **profile-field delta** only, then `derive()` + `buildPlan()` re-run and an amber Lola banner
  narrates a deterministic before/after diff. The model never authors obligations or dates.

**Latest follow-up pass:**
- Promoted `autonomo-social-security` `webinar` → `official` (catalog mix now **28/26/0**).
- Gated `tarjeta-sanitaria` off the NLV path (NLV holders carry private cover, no public card).
- Added a `property_purchase` date slot (required when `owns_property_in_spain`) and wired
  `anchorDate('property_purchase')` so notary / registry / transfer-tax items get firm dates.
- Surfaced the `source` tag on plan cards (coloured dot + short label), not just the drawer.
- Fixed the long-standing `ExternalLink.tsx` `tsc` error — `tsc --noEmit` is now fully green.

**Earlier this session (see `TODO.md` for the full checklist):** added `arrival_date` slot with
live LLM date parsing (arrival-anchored items now emit firm dates; `residency_established`
estimated from arrival); added obligation **detail drawers** (`app/plan.tsx`); ran the full
**sourcing queue** — researched all 14 `domain` obligations and flipped them to `official`
(fixed the Modelo 720 "150% penalty" and Modelo 037 "abolished 2025" errors); audited the
original 21 obligations (10 → `official`, fixed the `family-reunification` timing bug).

---

**Plan view redesign** (`app/plan.tsx`):
- Removed `JSON.stringify(profile)` debug dump.
- Added stats chips (total / required / penalty risk), `ConsulateBanner` (amber, US
  non-EU users), `PenaltyBanner` (red, penalty-count), phase icons, severity badges,
  category pills. Penalty cards get red tint + red title + red timing.

**Catalog expansion** — mined 15 YouTube webinar transcripts (5 parallel Opus 4.8 agents)
across: Tax+Healthcare, Property+Renting, NLV+DNV+Retiring, Citizenship+Pre-move,
Cities+CostOfLiving. After dedup, drafted 37 new obligations; **33 kept** in the CATALOG
(catalog now 54 total), 4 pulled to the backlog pending sourcing. The kept set:
- Pre-departure: `tax-planning-consultation`, `apostille-documents`
- Visa docs: `nlv-letter-of-intent`, `nlv-non-work-declaration`, `dnv-qualification-proof`,
  `dnv-company-activity-proof`, `dnv-employer-permission-letter`
- Banking: `spanish-bank-account`; Digital: `digital-certificate`
- Tax (residents): `modelo-030`, `modelo-100`, `wealth-tax`, `beckham-law`
- Autónomo (self-employed): `register-autonomo`, `autonomo-social-security`, `modelo-130`,
  `modelo-303`; Business: `modelo-200`
- Healthcare: `student-visa-health-insurance`
- Renewals: `nlv-renewal`, `dnv-renewal`, `permanent-residence`
- Property: `property-legal-due-diligence`, `completion-deed-notary`, `land-registry-registration`,
  `property-transfer-tax`, `ibi-property-tax`, `community-fees`, `nonresident-property-tax`
- Misc: `pet-import`
- Citizenship steps: `dele-a2-exam`, `ccse-exam`, `citizenship-application`
- _(Pulled to backlog: `sworn-translation`, `convenio-especial`, `modelo-390`, `citizenship-jura`)_

**Interview expanded** (13 → 15 slots):
- New slots: `owns_property_in_spain`, `has_pets`
- New derivation: `is_self_employed_in_spain` (from `work_situation`)

**Test personas** — added Susan (US retiree, NLV, drives the ConsulateWarning banner).

### ⚠️ Provenance / grounding status of the new obligations

A grounding pass grepped all 15 transcripts for the claims behind each new entry. Findings:

- **The obligations themselves are well-grounded** — autónomo, wealth tax, transfer tax,
  NLV renewal, pets, Beckham, permanent residence etc. are all genuinely discussed.
- **Verbatim-grounded figures (safe):** autónomo €87/mo first year; NLV renew 60 days
  before expiry; pet microchip + EU standards + vet check within 10 days of travel;
  Beckham flat 24% (employed only, not freelancers); transfer tax ~7% (Andalucía) to 10%
  regional; wealth-tax €700k per-person allowance; permanent residence after 5 years.
- **Stripped invented precision** (figures NOT in any transcript — titles corrected):
  Beckham "Modelo 149 / 6 years / file within 6 months"; transfer-tax "30 days";
  land-registry "30 days"; permanent-residence "10-month absence"; DNV "3yr/2yr permit";
  IBI "Sep/Oct"; digital-cert "Cl@ve" naming.
- **NOT sourced from these webinars — domain knowledge, needs official-doc citation
  (AEAT / extranjería) before launch:** every `Modelo NNN` number (030/100/130/200/210/
  303/714 — none appear verbatim in any transcript). These are real and correct, but
  unverified against a citable source, so they carry `source: 'domain'`.

**Resolved (this session):**
- Added a required `source: 'webinar' | 'domain' | 'official'` field to the `Obligation`
  type (and surfaced it on `Objective`, passed through `buildPlan`). `tsc` enforces that
  every entry is classified. The 14 `domain` entries are the audit queue: find an official
  source, correct the specifics if needed, then flip to `source: 'official'`.
- Pulled 4 entirely-ungrounded obligations to `core/OBLIGATIONS_BACKLOG.md` (full defs
  preserved): `sworn-translation`, `convenio-especial`, `modelo-390`, `citizenship-jura`.

**Caveat on the original 21 obligations:** their `source: 'webinar'` tags are inherited
from the prior session's "Spain Visas 101" mining and were NOT re-verified against a
transcript this pass (that webinar isn't among the 15 files mined here). The two carrying
precise statutory figures (`nlv-income-proof` €28,800/€7,200, `dnv-income-proof`
€34,000/€13,000/€4,000) are marked `domain` to flag them for official verification.

## Suggested next tasks

1. **Capture `residency_established` as a known-later field** — let users update it post-move so
   residency-anchored items become firm instead of estimated. Needs a post-move edit flow.
2. **More webinars** — health insurance detail, school enrolment, banking (account types,
   non-resident opening), inheritance tax. Push toward 80+ obligations.
3. **Re-add backlog items once sourced** — `sworn-translation`, `convenio-especial`,
   `modelo-390`, `citizenship-jura` (see `core/OBLIGATIONS_BACKLOG.md`).
4. **Freelancer/autónomo persona** — add Kenji (JP contractor) to test-personas with
   `owns_property_in_spain: true`, `property_purchase`, and `has_pets: true` to exercise the
   property + autónomo + pet clusters end-to-end.
5. **Solidarity tax** — €3M+ net assets threshold. Needs a higher asset band first.

## Conventions / guardrails

- TypeScript strict. `core/` is pure and side-effect-free — keep it that way.
- The catalog is **data**, not code. New obligations are CATALOG entries, never engine logic.
- Don't break the four invariants in `../camino/CLAUDE.md`. If a change would, stop and flag it.
- Expo SDK is pinned — read https://docs.expo.dev/versions/v56.0.0/ before writing Expo code.
- Run the legacy core demos: `npm run engine`, `npm run interview`.
