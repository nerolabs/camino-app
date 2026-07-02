# Monitoring (Sentry)

Error + performance monitoring runs through **one Sentry project** — `camino` in org `camino-ko`
(DE region) — with everything tagged by `platform` (web / ios / android / server) and
`environment` (production / staging), so a single Issues/Performance view covers all surfaces and
you filter by tag.

## Config

- **DSN** (public, safe to embed): set as `EXPO_PUBLIC_SENTRY_DSN` in the EAS **preview** +
  **production** environments (baked into the web bundle at export, like the PostHog key). Not set
  locally, so `expo start` reports nothing.
- The DSN lives in Sentry → Settings → Project `camino` → Client Keys (DSN).

## What's captured (as of 2026-07-02)

| Surface | Module | What |
|---|---|---|
| **Web** | `lib/monitoring.ts` (`@sentry/browser`) | JS errors + `browserTracing` (page-load / navigation transactions + Web Vitals: LCP/CLS/INP = "time to load"). `tracesSampleRate` 0.2 prod / 1.0 staging. |
| **Backend** | `lib/sentryServer.ts` | Minimal event envelope via `fetch` (the Node/Cloudflare SDKs don't fit the EAS Hosting Workers runtime). Wired into `/api/lola` + `/api/tts` catch + upstream-error paths, tagged `platform=server`. |
| **Native** | `lib/monitoring.native.ts` | **No-op stub for now** — see below. |

`initMonitoring()` is called once in `app/_layout.tsx`. `captureError()` is available for manual
client captures. Both no-op when there's no DSN.

## Native (next)

Native uses `@sentry/react-native` + its Expo config plugin (crashes, app-start time, navigation
perf). To wire it:

1. `npx @sentry/wizard@latest -i reactNative` (or add `@sentry/react-native` + the
   `@sentry/react-native/expo` plugin to `app.config.ts` manually), and replace the
   `lib/monitoring.native.ts` stub with a real `Sentry.init`.
2. Set **`SENTRY_AUTH_TOKEN`** (a **secret** — you set it, not Claude) in the EAS build
   environments so EAS Build uploads source maps for readable stack traces.
3. Rebuild (dev/preview) — native only reports from a build that includes the SDK.

## Alerting / uptime (todo)

- Sentry alert rules currently default to "high priority issues." Tune them per surface.
- Add an uptime monitor hitting the site + `/api/lola` (Better Stack / Grafana Cloud / Sentry
  Uptime) for paging when the backend is down.
- Optional: backend latency tracing (transaction envelopes), not just error capture.

## Verifying

Load a deployed URL and trigger an error; it should POST to
`https://o4511666388598784.ingest.de.sentry.io/api/4511666670469200/envelope/` (HTTP 200) and
appear in Issues within seconds, tagged with its environment + platform. (Verified on staging
2026-07-02.)
