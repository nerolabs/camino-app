# BUILD.md — release pipeline & the pre-ship gate

How Get Camino ships, and the checks that gate a release. (Historical scaffolding notes were
removed 2026-07-04 — the app is long since real; see HANDOFF.md for current state.)

## Surfaces & how each ships

- **Web** — `./scripts/deploy.sh {staging|production}` (pulls that env's vars, clears the Metro
  cache, exports, deploys to EAS Hosting). Verify a content marker ON THE UNIQUE DEPLOYMENT URL
  (the alias/custom domain lag on CDN edges). This is the day-to-day surface; deploy freely.
- **iOS** — `eas build --platform ios --profile production --auto-submit` → TestFlight. **Only
  on user command** (free-tier build credits). Batch native changes between builds.
- **Android** — same EAS build path; Google Play is a launch platform now (personal Play
  account → 12-tester/14-day closed test applies — start it early).

## Two tiers of checks (small builds vs big builds — user decision 2026-07-05)

- **Every push / small iteration** (web deploys, JS-only changes, day-to-day): the fast
  deterministic CI only — **typecheck · audit · test**. No E2E. Runs automatically, no spend,
  no simulator. This is the routine loop.
- **Big builds only** (a native EAS build headed for TestFlight/Play, and any store
  submission): ALSO run the two E2E suites below — **`test:e2e`** (Playwright web) and the
  **`e2e-ios`** workflow (Maestro native). Both are **manual dispatch on purpose**: each spends
  live LLM calls, e2e-ios takes ~30–45 min, and iOS-simulator-on-CI is inherently slow — so we
  run them deliberately before a build that matters, never on every small change. Native E2E is
  a release gate, not an iteration gate.

## The pre-ship gate (all green before a big build / store submission)

1. **`npm run typecheck`** — tsc strict. *(also every push)*
2. **`npm run audit`** — catalog ↔ interview contract (invariant 2) + all personas. Runs in
   deploy.sh and CI on every push.
3. **`npm test`** — deterministic engine + email-digest + report + this-week + date + digit-lint
   suites (vitest). Deploy gate + CI.
4. **`npm run test:e2e`** — Playwright, 12 tests vs deployed staging: the public smoke suite +
   the **authed** suite (sign in → saved roadmap → This-week → mark-done → no-op re-model →
   sign-out). Needs `E2E_SUPABASE_SERVICE_ROLE_KEY` in env (skips cleanly without it). Manual +
   pre-release (each run spends a few live LLM calls; our own rate limits apply to us too).
5. **`e2e-ios` GitHub workflow** (manual dispatch; **big builds only**) — Maestro on an iOS
   simulator, on a free macОS runner via `eas build --local` (zero EAS credits). Gates the
   **3 deterministic native flows**: launch/home, sample plan, interview (a real LLM turn).
   ~30–45 min. Dispatch before cutting a release-candidate native build; tolerate the occasional
   re-run for CI-simulator flakiness (that's why it's a deliberate gate, not a per-push check).

### Why the native authed flow is NOT in the gate

The `04-authed-roadmap` Maestro flow (deep-link sign-in) is tagged `authed` and
**`--exclude-tags=authed`** in CI. Opening iOS deep links via Maestro on CI runners is a
documented, unresolved flake — the "Open in app" SpringBoard alert isn't in the app's
accessibility tree on Maestro 2.x / iOS 18.x, so it can't be tapped
([Maestro #2610](https://github.com/mobile-dev-inc/Maestro/issues/2610); confirmed in our runs
2–4). We don't gate on a known tool bug. That journey is fully covered by the authed **Playwright
web** suite (identical React components) and by **manual on-device sign-in** every build. The
flow stays in `.maestro/` — runnable locally on a Maestro version where the dialog pattern works;
re-fold into CI when #2610 is fixed or when we pin a known-good Maestro version.

## Release checklist (per store submission)

- [ ] Gate green: typecheck · audit · test · test:e2e (12) · e2e-ios (3 native).
- [ ] Target build device-verified by the user (TestFlight / Play internal) — mic, voice,
      dictation, deep-link sign-in, the current fix list.
- [ ] Store metadata / screenshots / privacy answers current (docs/APP_STORE.md).
- [ ] iOS: DSA trader status + privacy-policy URL in ASC.
- [ ] Android: closed-test 14-day window cleared.

## Resources / costs

| Resource | For | Cost |
|---|---|---|
| Apple Developer Program | iOS + TestFlight | $99/year |
| Google Play Developer | Android store | $25 one-time (personal account → 12-tester rule) |
| EAS | Cloud builds, hosting | Free tier + paid domain plan (in use) |
| Supabase · Anthropic · ElevenLabs · Resend · PostHog · Sentry | Backend / AI / email / analytics / errors | Free tiers + usage; provider spend caps set |

CI-secret setup for the E2E workflows: `EXPO_TOKEN`, `E2E_SUPABASE_URL`,
`E2E_SUPABASE_SERVICE_ROLE_KEY` (staging) as GitHub repo secrets.
