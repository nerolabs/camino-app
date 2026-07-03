# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-03.

---

## ⭐ RESUME HERE (2026-07-03 — email loop is LIVE)

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

### Still open on email (small)
- **Staging Supabase SMTP + styled auth templates** — user pastes the Resend key (Auth → Emails
  → SMTP settings, mirror production), then restyle the two templates like production's.
- nerolabs@gmail.com wasn't directly testable (not signed into Chrome); tested with the user's
  andrewnedmond@gmail.com account instead. The weekly run's `skipped:1` is expected (account
  under 24h old, or nothing pressing).

### Env/dashboard state (don't redo)
- EAS envs: RESEND_API_KEY / SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET present as **sensitive**
  in BOTH production and preview. GitHub repo secret CRON_SECRET matches.
- **Resend**: `getcamino.app` domain **verified** (eu-west-1). Free plan (1 domain, 2 req/s —
  `serverEmail`/`weekly` already spaced for it).
- **Production Supabase** (`oftrpaleqtmuvolwsocd`): custom SMTP **ON** (host `smtp.resend.com`,
  port 465, user `resend`, sender `lola@getcamino.app` / "Lola from Camino"; password = Resend
  key, pasted by user). Auth email templates **styled + saved**: Magic-link/OTP and Confirm-signup
  (Camino brand, button + 6-digit `{{ .Token }}` for cross-device). Redirect allowlist already
  covers `getcamino.app/**` + `caminoapp://**`.
- **Staging Supabase** (`gsnsgfobfswazqhfcstx`): redirect allowlist OK. ⚠️ **SMTP NOT yet
  configured, templates NOT yet styled** — do this when convenient (mirror production; the
  Chrome UX flow: Auth → Emails → SMTP Settings, then the two templates).
- GitHub `CRON_SECRET` repo secret: **set by user** (via the browser form I opened).

### Other open threads (after email is live)
- **Apple Sign-In still failing on iOS build 17.** Now instrumented + captured in Sentry
  (project `camino`, org `camino-ko`): **"The authorization attempt failed for an unknown reason"**,
  tag `flow: apple_signin`, handled, iOS 26.5.1. App-ID config is CORRECT (ASC API confirmed
  `APPLE_ID_AUTH` + `PRIMARY_APP_CONSENT`, fresh build-17 profile). Since Apple's OWN sheet
  rejects before our code runs, likely causes: Apple server propagation, or a stale
  Apple-ID-app trust from builds 12–15 (user tried Settings → Sign-In & Security → remove Camino
  → retry; still failing). Next diag ideas: confirm the Services-ID/return-URL isn't required for
  the *native* token flow; check Supabase Apple provider "Client IDs" contains `com.nerolabs.camino`
  on BOTH projects (verified earlier, re-confirm); try a sign-in on a SECOND Apple ID to rule out
  account-specific state. The failure now also fires PostHog `apple_signin_failed` + an in-app Alert.
- **iOS build 18 is pending and INTENTIONALLY not yet kicked** — hold it so ONE build carries
  BOTH the native email sign-in (shipped in code this session) AND whatever Apple-sign-in fix we
  land. Don't auto-build until Apple is understood.
- **60 SEO pages** (`/guide/<id>`) — the next major feature after email (TODO.md item 4).

### Verify-clean checklist for the new session
- `git log -1` should show `73732f5 Email loop, part one…` (+ this handoff commit on top).
- Working tree clean. `npm test` → 26 passed / 7 skipped. `npm run audit` → 0 warnings, 9 personas.
- Web deploy of `73732f5` is already live; `/api/email/*` routes return **501** until the env
  vars land (that's expected, not a bug).

---

## Current state (one paragraph)

Web is live at **getcamino.app** (EAS Hosting, staging + production, separate Supabase DBs). iOS
is at **TestFlight build 17**: native Google sign-in, dictation, Lola voice (expo-audio), Sentry,
PostHog. **Sign in with Apple is wired but failing on device (see open threads).** The catalog
holds **60 obligations** (55 `official`, all with `source_url` / 5 `recommendation`), each mapped
to the interview via the audited invariant-2 contract (`npm run audit`, a deploy gate). This
session added: hamburger nav (<768px), the overdue roadmap treatment, the public roadmap page
(`/how-i-was-built/roadmap`), and **the email loop** (passwordless magic-link auth, "email me my
roadmap", welcome + weekly-roundup engine + cron). Android deferred to the very end; localization
sequenced last.

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
- `core/test-personas.ts` — 9 staff personas, each documenting the branch it tests.
- `app/api/lola+api.ts`, `app/api/tts+api.ts` — server proxies (Anthropic / ElevenLabs).
- `app/api/email/{welcome,weekly,unsubscribe}+api.ts` — **email routes** (Workers runtime, Web
  APIs only). welcome = token-verified, once-ever (dedupe via `welcomed_at` auth metadata).
  weekly = `CRON_SECRET`-gated; roundups + one-time interview nudges; RFC-8058 List-Unsubscribe.
  unsubscribe = HMAC one-click, no session. **All bookkeeping in auth user metadata** (`welcomed_at`
  / `nudged_at` / `last_roundup_at` / `weekly_optout` / `pending_profile`) — no schema migration.
- `lib/serverEmail.ts` (Resend HTTP), `lib/emailTemplates.ts` (hand-rolled inline-style HTML for
  welcome/roundup/nudge), `lib/emailTokens.ts` (Web-Crypto HMAC unsubscribe tokens).
- `components/EmailSignIn.tsx` — shared passwordless flow (email → link sent → 6-digit fallback),
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

1. **Email-loop leftovers** — staging Supabase SMTP + styled templates (user pastes the Resend
   key; see open items above). Native email sign-in rides iOS build 18.
2. **Apple sign-in fix** (open thread above) → then iOS build 18 carries email + Apple together.
3. **60 SEO pages** (`/guide/<id>` from the catalog) — next major feature.
4. Later: "This week" view, roadmap PDF export, region slot, reminders/push.
5. App Store submission (screenshots/age-rating/copyright are user-side; see docs/APP_STORE.md).
6. Monetization at the very end (affiliate programs first); localization last.
