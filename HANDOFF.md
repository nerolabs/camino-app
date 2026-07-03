# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-03.

---

## ⭐ RESUME HERE (2026-07-03 evening — guides LIVE, build 18 in TestFlight)

**Batch 2 of today (after the email loop below): the 60 SEO guide pages are LIVE on production**
(`/guide` index + `/guide/<id>` ×60, prerendered titles/descriptions/canonicals, `/sitemap.xml`
(64 URLs, generated from the catalog), robots Sitemap line, "Guides" in the nav menu). The nav
also unified: ONE hamburger at every width (user decision), Sign out inside the menu. **iOS
build 18 built + auto-submitted to TestFlight** (commit `d33d7bb`, finished 18:42Z) — it carries
native email sign-in, the nav, and the Apple diagnostics. **User still needs to device-test it.**

### Apple sign-in investigation — CLOSED on our side (2026-07-03)
Definitive: **build 17's signed IPA contains `com.apple.developer.applesignin` = [Default]**
(verified by downloading the EAS artifact and running `codesign -d --entitlements`). App-ID
capability ✓ (ASC API), fresh profile ✓, Supabase Apple provider ✓ (re-confirmed in dashboard:
Enabled, Client IDs = `com.nerolabs.camino`), client code ✓ (textbook signInAsync →
signInWithIdToken). Everything on our side is correct → the "unknown reason" sheet rejection is
Apple-side. **On-device next steps (user):** on build 18, confirm the Apple ID has 2FA enabled
(hard requirement for Sign in with Apple), retry, and if still failing try a SECOND Apple ID to
rule out account-specific state. If a second ID works, it's the account; if not, wait out
capability propagation and retry in a day.

### Also fixed this batch
- **CI flake**: the determinism test's two buildPlan calls could straddle a millisecond tick
  (dates differ by 1ms) — the test now freezes the clock (`vi.setSystemTime`). CI green since.
- `shortClause()` (guide titles): titles with an em-dash inside a parenthetical would truncate
  to an unbalanced "(" — now cuts back to before the parenthetical.

---

## Earlier today (2026-07-03 — email loop is LIVE)

**The email loop is live and verified end-to-end in production.** User added the 3 secrets to
EAS as `sensitive` (prod + preview), both envs redeployed, routes flipped 501 → 401. Live test:
forced weekly run via the GitHub Actions `workflow_dispatch` (run #1, green) → 200 with
`{roundups:0, nudges:2, skipped:1, errors:0, users:3}`; nudge + welcome received, styled
correctly, in a real Gmail inbox. Welcome fired on a real Google sign-in at getcamino.app
(account andrewnedmond@gmail.com), and a page reload after the fix sent nothing (dedupe holds).

### Two bugs the live test caught (both FIXED + redeployed both envs)
1. **Email links leaked the per-deploy origin** (`camino--<id>.expo.app` instead of
   getcamino.app): behind EAS Hosting's custom domain, `request.url` carries the internal
   deploy host. Fix: `siteOrigin()` in `lib/serverEmail.ts` — canonical origin per
   `EXPO_PUBLIC_ENV` (production → getcamino.app, staging → camino--staging.expo.app, dev →
   request origin). Never build user-facing links from the request URL.
2. **Welcome email sent 3× on one sign-in.** Two stacked races: the client effect keyed on the
   `user` OBJECT re-fired per auth event (INITIAL_SESSION / SIGNED_IN / USER_UPDATED from the
   pending_profile clear), and the server checked `welcomed_at` before sending, non-atomically.
   Fix: module-level once-per-user guard + effect keyed on `user?.id` (`app/_layout.tsx`);
   server now CLAIMS `welcomed_at` before the send and rolls back if Resend fails
   (`app/api/email/welcome+api.ts`).

### Gotchas learned this batch
- **`eas-cli deploy` can print "deploy command failed" (ECONNRESET) yet exit 0** — deploy.sh's
  `set -e` won't catch it. If a deploy looks odd, check the dashboard/deployment URL; rerun.
- Gmail-API readers may double-decode quoted-printable (`uid=3a…` renders as `uid:…`) — the
  emails themselves are fine; check the raw source before "fixing" links.

### Still open on email (tiny)
- nerolabs@gmail.com wasn't directly testable (not signed into Chrome); tested with the user's
  andrewnedmond@gmail.com account instead. The weekly run's `skipped:1` is expected (account
  under 24h old, or nothing pressing).
- Production's two auth templates were styled by hand in a previous session and could NOT be
  read back (extension DLP blocks the template body; plus a Supabase dashboard incident). The
  repo now has canonical versions at `docs/design/supabase-auth-emails.md` — staging runs
  exactly those; production's are the same style but may differ in wording. Optionally paste
  the repo versions into production for exact parity.

### Env/dashboard state (don't redo)
- EAS envs: RESEND_API_KEY / SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET present as **sensitive**
  in BOTH production and preview. GitHub repo secret CRON_SECRET matches.
- **Staging Supabase SMTP: DONE 2026-07-03** (smtp.resend.com:465, user `resend`, sender
  lola@getcamino.app "Lola from Camino"; key pasted by user). Both auth templates styled from
  `docs/design/supabase-auth-emails.md` and verified live: a real magic-link request from
  camino--staging.expo.app delivered the branded email to a real inbox.
- **Resend**: `getcamino.app` domain **verified** (eu-west-1). Free plan (1 domain, 2 req/s —
  `serverEmail`/`weekly` already spaced for it).
- **Production Supabase** (`oftrpaleqtmuvolwsocd`): custom SMTP **ON** (host `smtp.resend.com`,
  port 465, user `resend`, sender `lola@getcamino.app` / "Lola from Camino"; password = Resend
  key, pasted by user). Auth email templates **styled + saved**: Magic-link/OTP and Confirm-signup
  (Camino brand, button + one-time `{{ .Token }}` code for cross-device). Redirect allowlist already
  covers `getcamino.app/**` + `caminoapp://**`.
- **Staging Supabase** (`gsnsgfobfswazqhfcstx`): redirect allowlist OK. Custom SMTP **ON** +
  both auth templates styled (2026-07-03; source of truth `docs/design/supabase-auth-emails.md`).
- GitHub `CRON_SECRET` repo secret: **set by user** (via the browser form I opened).

### Verify-clean checklist for the new session
- Working tree clean. `npm test` → 26 passed / 7 skipped. `npm run audit` → 0 warnings, 9 personas.
- Live spot-checks: `/guide` + `/guide/nie` → 200; `/sitemap.xml` → 64 `<loc>` entries;
  POST `/api/email/weekly` without bearer → 401. CI (GitHub Actions) green on the last push.

---

## Current state (one paragraph)

Web is live at **getcamino.app** (EAS Hosting, staging + production, separate Supabase DBs). iOS
is at **TestFlight build 18** (awaiting device test): native Google + email sign-in, dictation,
Lola voice (expo-audio), Sentry, PostHog. **Sign in with Apple is wired but failing on device —
our side is fully verified correct; see the resume block.** The catalog holds **60 obligations**
(55 `official`, all with `source_url` / 5 `recommendation`), each mapped to the interview via the
audited invariant-2 contract (`npm run audit`, a deploy gate). Today shipped: **the email loop
live end-to-end** (passwordless magic-link auth, "email me my roadmap", welcome + weekly roundup
+ cron, both Supabase SMTP configs), **the 60 public guide pages** (`/guide/*` + sitemap), and
the unified hamburger nav. Android deferred to the very end; localization sequenced last.

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

## What's next (see TODO.md for detail)

1. **Email loop: DONE.** **60 guide pages: DONE.** **Build 18: submitted to TestFlight.**
2. **User device-tests build 18** — native email sign-in + the Apple retry (2FA check / second
   Apple ID; see resume block).
3. **The three pre-release features (user priority 2026-07-03):** ~~"This week" view~~ (SHIPPED
   2026-07-03: `core/this-week.ts` + toggle on /plan) → **roadmap PDF export (NEXT)** →
   region-aware steps. All land before the App Store push, which is ALSO gated on significant
   family testing / edge-case cleanup. **Reminders/push: STRUCK** (user decision — the weekly
   email is the retention loop).
4. Later: guide-page polish (JSON-LD, curated prose); per-step problem-report link.
5. App Store submission (screenshots/age-rating/copyright are user-side; see docs/APP_STORE.md).
6. Monetization at the very end (affiliate programs first); localization last.
