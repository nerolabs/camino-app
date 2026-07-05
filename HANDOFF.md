# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-05.

---

## ⭐ RESUME HERE (2026-07-05 EVENING — L0–L3 ALL SHIPPED: five languages LIVE in production)

**The entire localization arc (L0→L3) shipped in one day and is LIVE at getcamino.app:**
en/es/fr/de/it — chrome, interview (+static questions), 60 catalog titles ×4, 60 guide
explainers ×4, emails/report/digest per language (user_metadata.lang; SessionSync mirrors
browser-detected language into metadata — user-spotted gap, fixed), legal (es full courtesy
translation, fr/de/it English + native notice), per-locale sample couples, per-locale web
trees app/{es,fr,de,it} (STATIC dirs — a dynamic [locale] segment shadowed every
single-segment route incl. /sitemap.xml; the post-deploy gate caught it, production never
exposed), hreflang ×5 + x-default, sitemap 334 URLs. 146 vitest tests (+10 opt-in); all
per-locale gates iterate core/i18n/registry.ts (add a language there or it can't ship).
**Since then (same evening):** e2e-ios run #10 GREEN first-attempt (flow-03 trim now
CI-verified) → **iOS build 30 kicked** (f262aae3, auto-submit to TestFlight, all languages) ·
welcome-once dedupe regression test landed (151 tests) · weekly-cron inspection: admin
metadata updates MERGE (verified empirically on staging — no wipe risk), capture-flow users
now get `lang` seeded with `pending_profile` · HANDOFF history archived to docs/archive/.
**NEXT:** (a) Cristina/native passes over live es/fr/de/it (user-side; corrections = data
edits, gates re-verify); (b) build-30 device test (languages incl. es TTS voice, PDF in es);
(c) remaining route-handler tests (weekly/feedback/delete/unsubscribe — welcome pattern
established); (d) first natural cron fire Monday 2026-07-07 06:00 UTC — check the run output.

## Earlier that morning (2026-07-05 — testing audit DONE, localization gate CLEAR → then: L0)

**The fresh-eyes testing audit ran 2026-07-05 morning and is COMPLETE** (mandate was
`docs/archive/AUDIT-BRIEF-TESTING.md` (archived — executed); all 5 deliverables in `docs/TEST-COVERAGE.md` — critical-path
verdicts in its §5). Outcomes: map verified against reality (2 per-file counts corrected);
**localization HARD GATE CLEAR** — Spanish extraction proven LIVE (3 cases, real prompt via new
pure `lib/extractionPrompt.ts`) + email/report render snapshots (`tests/render-snapshot.test.ts`);
suite now 86 (+10 opt-in). Gates hardened: deploy.sh fails loudly when the E2E gate can't run,
API contract tests run on every STAGING deploy, seed.mjs allowlists staging (was a prod
denylist), Maestro pinned 2.6.1. Decisions re-verified, all upheld: flow-03 trim (still confirm
on next deliberate big-build run), flow-04 exclusion (#2610 closed-stale, NOT fixed), two-tier
policy (9 runs → 1 green says native CI can't be an iteration gate). Biggest named gaps: full
interview→roadmap web journey (build as opt-in pre-release Playwright project, not per-deploy);
welcome-once dedupe + route handlers have no regression test (the 3×-send bug reached a person).
**NEXT: Phase 2 L0** — i18next plumbing + full string extraction + the 4 i18n lint gates built
in, re-run plan-snapshot + full suite after (still green = behavior untouched). See TODO.md
Phase 2.

**Session digest (2026-07-04→05, the marathon):** backlog audited twice (TODO "SEQUENCED BACKLOG
v2" is canonical) · source-link QA 55/55 (2 fixed) · rebrand **Get Camino** (~100 strings, ASC
name fits 30 chars) · @getcamino.app mailboxes (feedback@/privacy@/legal@) · operator finalized
**AELaboratories, Inc, Sanford NC** (entity gate LIFTED — sole prop until revenue; NC governing
law) · API volume-limiting shipped+verified (durable Supabase counters, strict CORS, provider
caps) · a11y focus ring · family-testing rounds 4–5 fixed (voice turn-taking, clipping both ends,
composer growth, eternal-loading redirect, 35s spinner TTL + Sentry slow-turn alarm) · builds
27–29 (29 on device: TTS/mic "finally working correctly") · E2E built: 12-test authed Playwright
suite (per-deploy gate in deploy.sh — caught a real seed-ordering bug on first run) + Maestro
native (9 CI runs → lessons: Xcode 26 needed, driver timeout, text-entry race, deep-link #2610
excluded, Q2-LLM-wait trimmed) · two-tier policy (web per-deploy / native big-builds-only) ·
44→82 vitest tests incl. the plan-structure snapshot (localization guard) · localization design
APPROVED (docs/LOCALIZATION.md; es pre-launch, tú, Cristina verifies, visible switcher) · Android
promoted to launch platform (personal Play acct → 12-tester×14d closed test) · store-badge stub +
back-to-top shipped · homework pages + essay revised · docs: BUILD.md (pipeline+gate),
TEST-COVERAGE.md (living map), AUDIT-BRIEF-TESTING.md (next session's mandate).

**Where we are:** the E2E gate (Phase 1) is basically closed and the deep testing investment for
localization is in place. **The morning's job is Phase 2 — Localization — but it has a HARD
TESTING GATE in front of it (user directive): the localization-testing prerequisites in TODO.md
Phase 2 must be green before ANY L0 code.** Design is approved in docs/LOCALIZATION.md; testing
strategy in docs/TEST-COVERAGE.md §4A.

1. **Web E2E is now a per-deploy regression gate** — `scripts/deploy.sh` runs the Playwright
   suite against the unique deployment URL after every deploy (staging = all 12; production = 6
   public; `DEPLOY_SKIP_E2E=1` to skip). It already caught a real seed-ordering bug on its first
   run. Small builds = fast CI (typecheck/audit/test); big builds add the two E2E suites.
2. **Native E2E (Maestro) — 3 flows, retry-tolerant, BIG BUILDS ONLY** (manual `e2e-ios`
   workflow). Run #7 all-green; since then, environment flakiness (cold-boot splash, LLM latency)
   → fixes: retry-once + generous boot waits. **Run #9 finding: flow 03 failed BOTH retries on the
   "Question 2 appears" wait (needs a 2nd sequential LLM call — CI-latency-nondeterministic), while
   01/02 and everything up to answer-sent were solid. So 03 was TRIMMED** to prove the
   native-critical path (launch → interview starts via a real LLM turn → native keyboard answer
   lands → send posts it) and NOT the flaky second LLM round-trip. **UNVERIFIED in CI — confirm on
   the next deliberate big-build e2e-ios run (do NOT burn runs chasing it; it's big-builds-only).**
   The authed deep-link flow (04) stays excluded — Maestro #2610. Rationale: docs/BUILD.md +
   docs/TEST-COVERAGE.md §3.
3. **Testing deepened for localization (44 → 82 vitest tests):** the crown jewel is
   `tests/plan-snapshot.test.ts` — every persona's plan frozen as `id|phase|severity|timing-state`,
   so localization surgery that changes engine behavior fails loudly. Plus a vitest RN-stub +
   `@/` alias unlocking the display layer, and units for api-guard/server-email/regions/
   sample-profile/plan-format/plan-coach. docs/TEST-COVERAGE.md is the living map (CLAUDE.md rule
   to keep it current).
4. **Immediate next actions (morning):** (a) do the localization-testing prerequisites
   (TODO Phase 2 gate) — the highest-value one is the Spanish-input extraction test (proves the
   interview already understands Spanish); (b) then L0 plumbing, building the 4 i18n lint gates
   AS PART of L0; (c) re-run the full suite + plan-snapshot after string extraction (still green =
   behavior untouched). Parallel, user-side: Android device + Play closed-test clock (Phase 3).

---

## Current state (one paragraph — rewritten 2026-07-05 evening; history: docs/archive/)

Web is live at **getcamino.app** in **five languages** (en/es/fr/de/it — L0–L3 shipped
2026-07-05; native-speaker verification passes pending, user-side). iOS is at **TestFlight
build 30** (in flight; carries all languages) — Apple + Google + email sign-in all WORKING,
dictation, Lola voice, universal links, PDF export, delete-account. The catalog holds **60
obligations** (55 `official` with `source_url` / 5 `recommendation`), invariant-2-audited
(`npm run audit`, a deploy gate). The email loop is live (welcome + weekly cron Mondays
06:00 UTC + one-click unsubscribe), localized per `user_metadata.lang` (admin metadata
updates MERGE — verified empirically on staging 2026-07-05). Quality gates: **151 vitest
tests + 10 opt-in** on every push; Playwright (12) + API contract (10) on every staging
deploy, 6 public on production deploys; 3 Maestro flows on big builds (run #10 green,
pinned Maestro 2.6.1). Android is a launch platform (Play closed-test clock not yet
started — user-side). Next phases: TODO.md → store paperwork (4), submissions (5).

## Where things live

- `docs/THESIS.md` — the thesis + four invariants. Do not break them.
- `docs/STAFF.md` — the `profiles.is_staff` DB flag (gates dev personas + webinar links).
- `docs/MONITORING.md` — Sentry setup (web + server + native), uptime monitor.
- `docs/APP_STORE.md` — submission pack + the provisioning/entitlement playbook (why profiles
  must be re-minted when a capability changes — learned the hard way on builds 12–15).
- `core/engine-controller.ts` — **the deterministic engine + 60-obligation CATALOG.**
  `buildPlan(profile)` = filter by `applies_if` → topoSort by `depends_on` → resolve timing →
  bucket phases. `isOverdue(o, today?)` = scheduled + past date-level due + not done (due-today
  gets grace). Completing `residencia`/`empadronamiento` back-fills anchors so downstream dates
  go firm. Every obligation carries `source`, optionally `source_url` + `webinar_url`.
- `core/interview-controller.ts` — slots → derivations → `nextSlot`. Key derivations: `visa_type`,
  `is_eu`, `is_ex_colony_national`, `is_spanish_speaking_national` (DELE exemption, ≠ ex-colony),
  `wants_citizenship`, `knows_where_to_live`.
- `core/email-digest.ts` — **pure weekly-roundup digest** (feeds the email, mirrors the roadmap):
  overdue-first, ≤5 items, 45-day window, deterministic per-category tips, `null` when nothing
  pressing (no spam). `interviewComplete(profile)` gates roundup vs nudge.
- `core/catalog-audit.ts` + `scripts/audit-catalog.ts` — **invariant 2, enforced.** Deploy-gated.
- `core/guide-content.ts` + `app/guide/{index,[id]}.tsx` — **the 60 public guide pages**, pure
  functions of the catalog (timing RULE in words, blurbs, prerequisite links, category tip, CTA).
  `app/sitemap.xml+api.ts` generates the sitemap from the same catalog.
- `core/test-personas.ts` — 9 staff personas, each documenting the branch it tests.
- `app/api/lola+api.ts`, `app/api/tts+api.ts` — server proxies (Anthropic / ElevenLabs).
- `app/api/email/{welcome,weekly,unsubscribe}+api.ts` — **email routes** (Workers runtime, Web
  APIs only). welcome = token-verified, once-ever (dedupe via `welcomed_at` auth metadata).
  weekly = `CRON_SECRET`-gated; roundups + one-time interview nudges; RFC-8058 List-Unsubscribe.
  unsubscribe = HMAC one-click, no session. **All bookkeeping in auth user metadata** (`welcomed_at`
  / `nudged_at` / `last_roundup_at` / `weekly_optout` / `pending_profile`) — no schema migration.
- `lib/serverEmail.ts` (Resend HTTP), `lib/emailTemplates.ts` (hand-rolled inline-style HTML for
  welcome/roundup/nudge), `lib/emailTokens.ts` (Web-Crypto HMAC unsubscribe tokens).
- `components/EmailSignIn.tsx` — shared passwordless flow (email → link sent → one-time-code fallback),
  used by both sign-in dialogs + the plan page's "email me my roadmap" card.
- `components/SignInButtons.{tsx,native.tsx}` — "Sign in" → dialog. Web: Google + email. Native:
  Apple (official button, guideline 4.8) + Google + email. Failures now Alert + log (no silent catch).
- `components/NavBar.tsx` — width-split: ≥768px full bar; <768px logo + Sign-in + CTA + ☰ (browse
  links in the menu; future SEO sections slot here too).
- `.github/workflows/weekly-email.yml` — Mondays 06:00 UTC + manual dispatch → POST /api/email/weekly.
- `app/_layout.tsx` — root providers + `SessionSync` (loads profile + `is_staff`; adopts
  `pending_profile` from "email me my roadmap" on first sign-in; fires the welcome email once).
- `app/plan.tsx` — roadmap. Overdue red treatment; signed-out "email me my roadmap" card; step
  sheet with source pills + "what changed" re-plan flow.
- `app/how-i-was-built/{index,log,roadmap}.tsx` — the 3 unlisted "homework" pages (robots-disallowed).
- `scripts/deploy.sh` — env-pull → **catalog audit** → cache-cleared export → deploy.

## Commands

- `npm run audit` — catalog↔interview contract + personas (after ANY catalog/slot change).
- `npm test` — deterministic engine + email-digest suite (vitest; deploy gate + CI).
- `npm run test:api` / `test:e2e` — API contract / Playwright smoke vs staging (opt-in, network).
- `npm run typecheck` — tsc, strict.
- `npm run deploy:staging` / `deploy:production` — web deploys (gated on audit + tests).
- iOS: `npx eas-cli build --platform ios --profile production --auto-submit --non-interactive`
  (needs EXPO_TOKEN + ASC key env vars from `~/.zshrc`). **autoIncrement burns build numbers on
  failed builds** — that's why we're at 17.

## Guardrails

- The four invariants in `docs/THESIS.md`. Engine stays deterministic; the catalog is data.
- **Claude never handles secrets** (API keys, tokens, passwords) — user sets those in EAS /
  dashboards. Public identifiers (PostHog key, Sentry DSN, Supabase anon key) are fine.
- **EAS env visibility gotcha:** web API routes only receive **Plain-text + Sensitive** vars
  (via `eas env:pull` in deploy.sh). **`secret`-visibility vars arrive EMPTY** — always use
  `sensitive` for anything a server route reads. Secret is only for EAS Build (native).
- **Standing rule (CLAUDE.md):** every PR/release batch updates BOTH homework pages —
  `app/how-i-was-built/log.tsx` (a build-log row) and `app/how-i-was-built/roadmap.tsx` (move
  items, bump `UPDATED`). Source of truth = TODO.md's roadmap.
- Expo SDK 56 pinned — check https://docs.expo.dev/versions/v56.0.0/ before Expo API work.
- Verify before claiming: deploys checked live (curl/browser), engine changes get a persona run,
  TestFlight builds get on-device confirmation from the user.

## What's next

**Canonical priority order = TODO.md → "🎯 THE SEQUENCED BACKLOG" (full audit 2026-07-04).**
Six phases: (1) verify what's built — build 27 on user command, device verification, family
testing (THE release gate), source-link QA; (2) hardening — API volume-limiting (site is now
public+indexed; overdue), Maestro/authed E2E, a11y round 2; (3) store paperwork — legal entity
swap (hard gate), ASC fields, screenshots, bus-factor hour; (4) submission; (5) growth —
region specifics content pass, regulatory changelog, SEO expansion, share links, launch
moment; (6) the tail — Android, localization, monetization. Immediate next action: **user
kicks build 27**, then Phase 1 verification.
