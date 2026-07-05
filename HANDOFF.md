# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-05 (late — post-localization bug-fix pass; session closed out).

---

## ⭐ RESUME HERE (2026-07-05 — five languages LIVE + build 30 in TestFlight; bug-fix pass done)

**getcamino.app is LIVE in five languages (en/es/fr/de/it)** and **iOS build 30** (all
languages) is on TestFlight, device-tested by the user + wife with **everything working** —
full Spanish interview, PDF, multi-language roadmap tasks on web and native. 157 vitest tests
(+10 opt-in). The localization arc (L0–L3) and a full bug-fix pass are complete; the codebase
is in a clean, well-tested state. **THIS SESSION'S FIXES (all live in production):**

1. **🔴 SILENT PRODUCTION DATA LOSS — profiles never saved for signed-in users (fixed).** The
   biggest find: the STAFF.md is_staff hardening left `authenticated` without `UPDATE(user_id)`,
   and PostgREST's upsert puts the conflict key in `ON CONFLICT DO UPDATE SET` → every signed-in
   save failed 42501, and `core/profileDb.ts` SWALLOWED the error → unnoticed for days. Only
   pre-hardening Google profiles survived (timing, not provider). Fix: `grant update (user_id)`
   on BOTH DBs (verified by throwaway-user probe: insert+update persist, is_staff still blocked);
   profileDb now `captureError`s on failure (5-test regression); `scripts/sql/profiles-grants.sql`
   + STAFF.md warning + memory [[profiles-upsert-grant-gotcha]]. **E2E was structurally blind —
   it asserts in-memory UI, not DB persistence.**
2. **Auth code email localized** (user-found: Italian UI → English code email). That email is
   sent by Supabase Auth, not our Resend pipeline. Fix: signInWithOtp always sends `data.lang`;
   both dashboard templates (magic-link + confirm-signup) rewritten with 5-language nil-safe
   branching (`printf "%v" .Data.lang`), pasted+verified on both projects (Claude drove Chrome).
   Subjects compacted to Supabase's 255-char cap. Source of truth: docs/design/supabase-auth-emails.md.
3. **Interview responds to mid-interview language switch** (was: required reload → lost progress).
   Chrome re-renders via useTranslation; now the CURRENT question also re-issues in the new
   language (translated static question, instant). Verified in-browser.
4. **"How I was built" hidden in non-English menus** (English-only page by decision). Web live;
   **native shows it until the next build** (build 30 predates this).
5. **German "Guides" anglicism → "Ratgeber"** across all de catalogs (fr "Guides" is correct
   French, kept; es/it already localized).
6. Earlier same session: welcome-once dedupe regression test; capture-flow users seed `lang`;
   e2e-ios run #10 green (flow-03 trim CI-verified); weekly-cron inspected (admin metadata
   MERGES — verified); HANDOFF history archived to docs/archive/.

**NEXT SESSION = THE APP-RELEASE PUSH** (nothing is blocking; the product is release-quality;
179 vitest tests + 10 opt-in; all work through dae56d4 pushed to origin/main).
- **(a) FIRST: Native build 31** — carries the menu-hide fix + mid-interview language switch +
  "Ratgeber" + route-handler tests + all web fixes since build 30. **Dispatch `e2e-ios` FIRST**
  (big-builds-only rule) — note: run #11 was CANCELLED at session close because it was testing
  pre-push (stale) code; re-dispatch against the now-pushed main, wait for green, then
  `npx eas-cli build --platform ios --profile production --auto-submit`.
- **(b) Store paperwork (TODO Phase 4)** — ASC fields, DSA trader status, screenshots (consider
  an es-ES localized listing now that L1 shipped).
- **(c) Android track (TODO Phase 3)** — user buys the test device + Play account → start the
  14-day closed-test clock (burns calendar time in parallel; English build is fine to start).
- **(d) Watch the first natural weekly cron** — Monday 2026-07-07 06:00 UTC; check the run's
  JSON output (roundups/nudges/skipped/errors). Localized emails ride it now.
- **(e) [USER] native-speaker passes** over live es/fr/de/it — corrections are pure data edits;
  the lint gates + snapshots re-verify each change.

**DONE this session (was next-session item (b)):** ✅ route-handler integration tests — every
API route (welcome/feedback/account-delete/unsubscribe/weekly) now covered; the audit's last
unit gap is closed. TEST-COVERAGE.md §1 updated.

## Current state (one paragraph — rewritten 2026-07-05 evening; history: docs/archive/)

Web is live at **getcamino.app** in **five languages** (en/es/fr/de/it — L0–L3 shipped
2026-07-05; native-speaker verification passes pending, user-side). iOS is at **TestFlight
build 30** (device-tested working by user + wife; carries all languages) — Apple + Google +
email sign-in all WORKING, dictation, Lola voice, universal links, PDF export, delete-account.
Signed-in **profiles now persist** (a grant bug silently blocked all saves until 2026-07-05 —
fixed on both DBs; see resume block). The catalog holds **60 obligations** (55 `official` with
`source_url` / 5 `recommendation`), invariant-2-audited (`npm run audit`, a deploy gate). The
email loop is live (welcome + weekly cron Mondays 06:00 UTC + one-click unsubscribe), localized
per `user_metadata.lang` (admin metadata updates MERGE — verified empirically); the Supabase
auth code emails are also localized (dashboard templates, 5-language). Quality gates: **157
vitest tests + 10 opt-in** on every push; Playwright (12) + API contract (10) on every staging
deploy, 6 public on production deploys; 3 Maestro flows on big builds (run #10 green, pinned
Maestro 2.6.1). Android is a launch platform (Play closed-test clock not yet started —
user-side). Next phases: TODO.md → store paperwork (4), submissions (5).

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
