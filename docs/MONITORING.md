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
- **`SENTRY_AUTH_TOKEN`** (secret, user-set) in the EAS build env lets EAS Build upload native
  source maps, so iOS stack traces are readable rather than minified.

## What's captured (refreshed 2026-07-12)

| Surface | Module | What |
|---|---|---|
| **Web** | `lib/monitoring.ts` (`@sentry/browser`) | JS errors + `browserTracing` (page-load / navigation transactions + Web Vitals: LCP/CLS/INP = "time to load"). `tracesSampleRate` 0.2 prod / 1.0 staging. |
| **Backend** | `lib/sentryServer.ts` | Minimal event envelope via `fetch` (the Node/Cloudflare SDKs don't fit the EAS Hosting Workers runtime). Wired into the catch + upstream-error paths of `/api/lola`, `/api/feedback`, and the email/account routes, tagged `platform=server`. |
| **Native** | `lib/monitoring.native.ts` (`@sentry/react-native` + its Expo plugin in `app.config.ts`) | Real `Sentry.init` since build 8 (2026-07-02): crashes, errors, app-start, tagged `platform=ios` + environment. Source maps upload during EAS Build via `SENTRY_AUTH_TOKEN`. |

`initMonitoring()` is called once in `app/_layout.tsx`. `captureError()` is available for manual
client captures. Both no-op when there's no DSN.

## Alerting / uptime (live)

- **Issue alerts** (per-surface since 2026-07-12): "high priority issues" (the original
  catch-all, all surfaces) + "Native iOS — new production issue" (`platform=ios`) +
  "Server — new production issue" (`platform=server`) — both new-issue triggers,
  production environment only, notify → email. Add a `platform=android` twin when the
  Android build ships.
- **Uptime monitor** on `https://getcamino.app` — GET every 1 min, environment=production,
  3 consecutive fails → issue → email. Downtime pages laptop-independently.
- The **slow-turn alarm** (interview turns slower than they should be) rides the same project
  (added with the family-testing rounds).
- Optional later: backend latency tracing (transaction envelopes), not just error capture.

## Verifying

Load a deployed URL and trigger an error; it should POST to
`https://o4511666388598784.ingest.de.sentry.io/api/4511666670469200/envelope/` (HTTP 200) and
appear in Issues within seconds, tagged with its environment + platform. (Web verified on
staging 2026-07-02; native verified on device from build 8.)
