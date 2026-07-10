# ANALYTICS.md — product analytics: events, funnels, and the pre/post methodology

Written at the interview-redesign release (2026-07-10) after a fresh-eyes audit of the
instrumentation. PostHog (EU), web only. Keep this honest the same way TEST-COVERAGE.md is kept
honest: **change an event → update this file in the same PR.**

## How the pipeline works
- `lib/analytics.ts` (web): PostHog, **cookieless** (`persistence: 'memory'` — consent-banner-free
  by design, user decision 2026-07-04). Consequence: **anonymous visitors get a new person per
  session** — cross-session funnels only stitch for signed-in users (`identify`). Within-session
  funnels are exact.
- `lib/analytics.native.ts`: posthog-react-native, **live since iOS build 31** (a stale comment
  claimed it was a stub — corrected 2026-07-10). Same project/key; native events carry platform
  context automatically. The `interview_version: 2` stamp reaches iOS with the next build.
- Local dev sends nothing (no key in `.env`); every event carries `environment`
  (staging/production) — filter dashboards to production.

## Pre/post integrity (the redesign changes what the numbers MEAN)
1. **`interview_version: 2` super-property** is stamped on every event by redesign bundles.
   Absent = pre-redesign bundle. Segment ALL pre/post comparisons on this, not on dates — stale
   cached clients keep reporting v1 events after the deploy.
2. **`interview_started` changed meaning.** v1: clicking "Let's get started" (a button on an intro
   screen). v2: **answering the first question** (the interview auto-starts; the intro screen is
   gone). v2 "started" is deeper-funnel, so start→complete conversion jumps partly by definition.
   The honest v2 top-of-funnel is `$pageview` on `/interview`.
   - v1 funnel: pageview → started(click) → completed
   - v2 funnel: pageview(/interview) → started(first answer) → completed
   - Comparable cross-version metric: **pageview(/interview) → completed.**
3. **`interview_clarify_needed` denominator changed.** Clarifies can only happen on LLM-extracted
   turns; chips eliminated extraction for most questions. Falling clarify counts are mostly the
   input model, not extractor quality. The per-question rate that stays meaningful:
   clarifies / `interview_question_answered where input in (composer, other)`.
4. **Time-to-complete**: v1 measured from the start click; v2 from the first answer. Directionally
   comparable; don't over-read small deltas.

## Event dictionary (interview surface, v2)

| Event | When | Properties | What it answers |
|---|---|---|---|
| `$pageview` /interview | route view | — | Top of funnel (v2 "arrived") |
| `interview_started` | FIRST answer | `from` (guide id) | Engagement, attribution |
| `interview_resumed` | draft restored on mount | `completeness`, `answered` | Do people come back? At what depth? |
| **`interview_question_answered`** | every answered question | `field`, `input` (chip/composer/other/typeahead), `ms` (since question shown), `added_steps`, `removed_steps`, `plan_steps`, `completeness` (0–100), `two_pane`, `ack_shown` | THE per-question funnel: drop-off point (last event per person), per-question latency, payoff-vs-continuation, exit-completeness distribution |
| `interview_other_opened` | "Something else…" tapped | `field` | Chip-coverage gaps (which chip sets are incomplete) |
| `interview_other_answered` | free text sent via Other | `field`, `answer` (≤200 chars) | The raw phrasing to refine chip sets from (user decision 2026-07-09). Other is never offered on sensitive slots |
| `interview_clarify_needed` | extractor fumbled a real answer | `field`, `answer` (≤200) | Extraction quality on composer/Other turns only |
| `interview_slots_autofilled` | extras filled other slots | `fields`, `from` | Extraction opportunism value |
| `interview_turn_failed` | a turn errored | `field` | Reliability (pairs with Sentry) |
| `interview_final_note` | the optional end note (or Skip) | `skipped`, `answer` (≤500) | Free-form context to distill into obligations; skip-rate |
| `interview_completed` | after the final note/skip | `answered` | Bottom of interview funnel |
| `roadmap_sheet_opened` | mobile strip tapped | `plan_steps` | Does the mobile living-roadmap get used? |

Post-interview surface (unchanged): `roadmap_viewed`, `task_opened`, `task_coach_asked`,
`plan_view_toggled`, `plan_pdf_exported`, `plan_remodelled`/`_noop`, `roadmap_item_completed`,
`email_me_roadmap_opened`, `email_signin_requested`/`_verified`, `sample_plan_*`, `guide_*`,
`feedback_*`, `account_deleted`.

**Privacy rules (hold these):** no answer VALUES on analytics events — income/assets bands never
leave the device via PostHog (signed-in profiles live in Supabase, which is where distribution
questions belong). Free text is captured only on `clarify` and `other_answered`, capped at 200
chars, and Other is structurally unavailable on sensitive slots (`allowOther: false`).

## The KPI frame for the redesign (what "it worked" looks like)
Baselines from the 2026-07-06→08 soft-launch traffic (PostHog, hand-dug):

| Metric | v1 baseline | v2 hypothesis | Where to look |
|---|---|---|---|
| pageview(/interview) → completed | ~10% of visitors | up | funnel, split by `interview_version` |
| started → completed | ~31% | up (note semantics ↑) | funnel |
| Median time to complete | ~7.2 min (promised "3") | → ~3–4 min | completed-minus-started per person |
| Worst-question drop-off | work_situation @ Q2 | no single cliff | last `question_answered.field` per non-completer |
| Clarify rate (per composer/Other turn) | high (15 on work_situation) | near-zero on ex-chip fields | clarify ÷ answered(input≠chip) |
| Exit completeness | unknown (binary before) | distribution; mass ≥60% | max `completeness` per non-completer |
| Other usage per field | n/a | <10% per chip field, else chips are incomplete | `other_opened` by field |
| Resume rate | 0 (didn't exist) | any — it's new | `interview_resumed` count, completeness dist |
| Mobile sheet engagement | n/a | opened ≥1× by most mobile completers | `roadmap_sheet_opened` where `two_pane=false` |
| Payoff→continuation (the thesis) | n/a | higher `added_steps` → higher next-answer rate | `question_answered` self-join by person/order |

## Known gaps / decisions queued
- **App Privacy label** (App Store questionnaire, at submission): analytics is live on native —
  disclose Product Interaction data, not linked to identity for anonymous users (see
  docs/STORE_PAPERWORK.md).
- Anonymous cross-session stitching is off by design (cookieless). `interview_resumed` partially
  recovers the story client-side via the localStorage draft.
- ~~Reaction (ack) drop-rate~~ — done: `ack_shown` on `question_answered` (false-rate = how often
  the 2s cap drops the reaction; the tuning signal for `REACTION_WAIT_MS`).
- Income-check exposure (`nlv/dnv-income-check` appearing in a plan) is derivable from Supabase
  profiles (band + household + visa route); no event needed yet.
- Dashboards: BUILT (2026-07-10) — PostHog dashboard **"Interview v2 — living roadmap"**
  (`/project/214229/dashboard/808581`): the core funnel (visit → started → completed), per-question
  drop-off (last field per non-completer), exit-completeness histogram, Other-usage by field,
  clarify rate on LLM turns, and the clarify raw log. SQL tiles are 30-day windows; they populate
  as v2 production data arrives (v1 baseline already visible: 60 clarifies / 0 v2 LLM turns).
