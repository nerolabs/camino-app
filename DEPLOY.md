# Camino — deployment runbook

Target: a **dev / staging / production** pipeline on **EAS**, web first (EAS Hosting) so
family can test, then iOS/Android via EAS Build. The Anthropic key is server-side only
(`app/api/lola+api.ts`), never shipped to the client.

## Prerequisites (one-time)

1. **Create a free Expo account** → https://expo.dev (needed for hosting + builds).
2. Install the CLI: `npm i -g eas-cli` (or use `npx eas-cli …`).
3. `eas login`
4. `eas init` — links this repo to an EAS project (writes the project ID into `app.config.ts`
   / `extra.eas.projectId`). Commit that change.

## Environment variables

Local dev (`.env`, gitignored) — already set up:
- `ANTHROPIC_API_KEY` — **server-side** key read by `app/api/lola+api.ts`. (Added as a copy of
  the old `EXPO_PUBLIC_ANTHROPIC_API_KEY`; the `EXPO_PUBLIC_` one is no longer used and can be
  deleted.)
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — safe to be public (RLS).

On EAS, set the secret **per environment** (never commit it):
```
eas env:create --name ANTHROPIC_API_KEY --value <key> --environment production --visibility secret
eas env:create --name ANTHROPIC_API_KEY --value <key> --environment preview   --visibility secret
# (repeat the two EXPO_PUBLIC_SUPABASE_* as plain env vars per environment)
```

## Phase 1 — Web (family testing)

`app.config.ts` sets `web.output: 'server'`, which enables the API route on EAS Hosting.

```
# Staging (default alias) — share this URL with family:
eas deploy --environment preview

# Production alias:
eas deploy --prod --environment production
```
`eas deploy` builds the web bundle + API routes and returns a URL. Verify the interview and
the plan's "Ask Lola" both work (they call `/api/lola`).

## Phase 2 — Mobile (iOS / Android)

Bundle IDs are set (`com.nerolabs.camino`). Build profiles live in `eas.json`
(development / preview / production, each on its own EAS Update channel + environment).

- Native fetch to the API route needs an absolute origin: set `EXPO_PUBLIC_API_URL` to the
  deployed web origin for the mobile environments (the client already respects it — see
  `lib/lola.ts`).
- Dev client: `eas build --profile development --platform ios` (and android).
- Store builds: `eas build --profile production --platform all`, then `eas submit`.
- OTA updates: `eas update --channel preview` / `--channel production`.
- Requires an **Apple Developer** account ($99/yr) and **Google Play** account ($25 once).

## CI/CD (later)

EAS Workflows (`.eas/workflows/*.yml`) can gate builds/deploys on PR merges to `main`.
