# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-03.

---

## ⭐ RESUME HERE (warm handoff — 2026-07-03, mid email-loop rollout)

**We just built the email loop (commit `73732f5`, pushed). Code is done, tests green (26).
It is NOT yet live — blocked on one env-var step by the user.** Previous session's CLI UX got
corrupted; this is a clean restart at the exact same point.

### The blocker (user action, then I proceed)
The 3 email secrets must exist in EAS as **`sensitive` visibility, NOT `secret`.** I proved
(throwaway-var probe) that **Secret-visibility vars come through EMPTY to the web API routes** —
`eas env:pull` (what `deploy.sh` uses) only delivers Plain-text + Sensitive values. The user
originally added them as `secret`; I deleted those copies (they'd never have worked). They need
re-adding **once** as sensitive (values can't be read back, so re-entry is unavoidable):

```
# production (unblocks the live test):
npx eas-cli env:create --environment production --name RESEND_API_KEY --visibility sensitive --scope project --force
npx eas-cli env:create --environment production --name SUPABASE_SERVICE_ROLE_KEY --visibility sensitive --scope project --force
npx eas-cli env:create --environment production --name CRON_SECRET --visibility sensitive --scope project --force
# preview (staging): same three, --environment preview, staging's own service_role key
```
- `CRON_SECRET` must MATCH the value already set as the GitHub repo secret (Actions → secrets).
- `SUPABASE_SERVICE_ROLE_KEY`: each project's own `service_role` (prod key → production env,
  staging key → preview). Supabase → Settings → API Keys → "Secret keys" (`sb_secret_…`).
- Claude must NOT handle these values — user runs the commands / pastes when prompted.

### Then I do (no further input needed)
1. Redeploy web both envs: `npm run deploy:production && npm run deploy:staging` (env changes
   only reach the routes on a fresh deploy). Verify routes flip **501 → 200/401**:
   `curl -s -o /dev/null -w '%{http_code}' -X POST https://getcamino.app/api/email/weekly` (401
   without the bearer = configured; 501 = still missing keys).
2. **Live end-to-end test against the user's own account** (nerolabs@gmail.com): trigger a
   welcome email + a forced weekly run (`curl -X POST …/api/email/weekly -H "Authorization:
   Bearer <CRON_SECRET>"`), confirm delivery in Resend's dashboard + that the styled template
   renders. Report before calling it done.

### Env/dashboard state already done this session (don't redo)
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

1. **Finish the email loop** — env vars (blocker above) → redeploy → live test. Then style
   staging SMTP + templates. Native email sign-in rides iOS build 18.
2. **Apple sign-in fix** (open thread above) → then iOS build 18 carries email + Apple together.
3. **60 SEO pages** (`/guide/<id>` from the catalog) — next major feature.
4. Later: "This week" view, roadmap PDF export, region slot, reminders/push.
5. App Store submission (screenshots/age-rating/copyright are user-side; see docs/APP_STORE.md).
6. Monetization at the very end (affiliate programs first); localization last.
