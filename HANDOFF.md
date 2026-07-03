# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

Last updated: 2026-07-03.

## Current state (one paragraph)

Web is live at **getcamino.app** (EAS Hosting, staging + production, separate Supabase DBs).
iOS is at **TestFlight build 9** with full web parity: native Google sign-in, dictation,
Lola voice (expo-audio), Sentry crash/perf reporting, PostHog analytics. The catalog holds
**59 obligations** (54 `official` / 5 `recommendation`), every one mapped to the interview via
the audited invariant-2 contract (`npm run audit`, also a deploy gate). Android is deferred
to the very end (no test device). Localization is explicitly sequenced **last**.

## Where things live

- `docs/THESIS.md` — the thesis + four invariants. Do not break them.
- `docs/STAFF.md` — the `profiles.is_staff` DB flag (gates dev personas + webinar links).
- `docs/MONITORING.md` — Sentry setup (web + server + native), uptime monitor.
- `core/engine-controller.ts` — **the deterministic engine + 59-obligation CATALOG.**
  `buildPlan(profile)` = filter by `applies_if` → topoSort by `depends_on` → resolve timing →
  bucket phases. Completing `residencia`/`empadronamiento` back-fills the
  `residency_established`/`padron_done` anchors (`ANCHOR_FROM_COMPLETION`) so downstream dates
  go firm. Every obligation carries `source: 'official' | 'recommendation'`, optionally
  `source_url` (user-facing canonical link) and `webinar_url` (staff-only cross-check).
- `core/interview-controller.ts` — slots → derivations → `nextSlot`. 19 slots. Key derivations:
  `visa_type`, `is_eu`, `is_ex_colony_national` (passport ∪ explicit answer),
  `is_spanish_speaking_national` (gates the DELE exemption — NOT the same as ex-colony; PH).
  Newer slots: `wants_citizenship` (citizenship track vs rolling renewal),
  `knows_where_to_live` (gates the scouting step).
- `core/catalog-audit.ts` + `scripts/audit-catalog.ts` — **invariant 2, enforced.**
  `npm run audit`: applies_if↔slot contract, depends_on/timing refs, personas. Deploy-gated.
- `core/test-personas.ts` — 9 staff personas, each documenting exactly which branch it tests
  (renewal-only, PH/DELE regression, unmarried partner, property cluster, EU floor…).
- `app/api/lola+api.ts`, `app/api/tts+api.ts` — server-side proxies (Anthropic / ElevenLabs);
  keys never reach clients. TTS serves POST (web) and GET `?text=` (native streaming).
- Platform splits (`.native.ts` twins): `hooks/useLolaVoice` (Web Audio / expo-audio),
  `hooks/useDictation`, `lib/analytics` (posthog-js / posthog-react-native),
  `lib/monitoring` (@sentry/browser / @sentry/react-native). `lib/sentryServer.ts` covers the
  API routes (fetch-based envelopes — the Workers runtime fits no Sentry SDK).
- `app/_layout.tsx` — root providers + `SessionSync` (loads profile + `is_staff` on every
  route, so reloads on /plan survive) + monitoring/analytics init.
- `app/plan.tsx` — roadmap. Step sheet: tappable `official ↗` pill (canonical source, new tab)
  + staff-only `▶ webinar ↗` pill (YouTube at timestamp); Lola task coach; "what changed"
  re-plan flow (`KNOWN_LATER_FIELDS` lets users set `residency_established` post-move).
- `scripts/deploy.sh` — env-pull → **catalog audit** → cache-cleared export → deploy.
  Guards the prod-baked-with-staging-DB failure mode. `npm run deploy:staging|production`.

## Commands

- `npm run audit` — catalog↔interview contract + personas (run after ANY catalog/slot change).
- `npm run typecheck` — tsc, strict.
- `npm run deploy:staging` / `deploy:production` — web deploys (audit-gated).
- iOS: `npx eas-cli build --platform ios --profile production --auto-submit --non-interactive`
  (needs EXPO_TOKEN + ASC key env vars from `~/.zshrc`; auto-submits to TestFlight).

## Guardrails

- The four invariants in `docs/THESIS.md`. The engine stays deterministic; the catalog is data.
- **Claude never handles secrets** (API keys, tokens, passwords) — the user sets those in EAS /
  dashboards. Public identifiers (PostHog key, Sentry DSN, Supabase anon key) are fine.
- Expo SDK 56 pinned — check https://docs.expo.dev/versions/v56.0.0/ before Expo API work.
- Verify before claiming: deploys are checked live (curl / browser), engine changes get a
  persona/regression run, TestFlight builds get on-device confirmation from the user.

## What's next (see TODO.md for detail)

1. **Source re-verification pass** — 28 `official` items still lack a `source_url`
   (`npm run audit` warns on each). Re-verify one by one against official sources; also add the
   missing **EU-registration obligation** (Certificado de registro UE) found during the audit.
2. **B5 — E2E tests** (Playwright web + Maestro native + engine-level deterministic pass).
3. PostHog insights (funnel/retention) once real usage accumulates.
4. Full App Store submission (metadata/screenshots/review), Google Play at the very end.
5. Localization — **last**, per explicit decision.
