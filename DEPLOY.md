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

### Use the deploy scripts (don't run export/deploy by hand)

```
npm run deploy:staging      # -> preview env + staging DB, alias camino--staging.expo.app
npm run deploy:production    # -> production env + prod DB, getcamino.app
```

⚠️ **Why:** `EXPO_PUBLIC_*` values (Supabase URL/key, `EXPO_PUBLIC_ENV`) are inlined into the
client bundle by Metro at `expo export` time. Two traps: (1) Metro's cache does not bust when only
env values change, and (2) the local dev `.env` (which holds **staging**) can win over the pulled
target-env values. The script defends against both: `eas env:pull` the target environment →
**`source` those vars into the shell** (Metro reads `process.env` at the highest priority, above
every `.env` file) → clear `dist` + `node_modules/.cache` → `export --clear` → deploy → remove
`.env.local`. It prints `[deploy] Baking: EXPO_PUBLIC_ENV=… SUPABASE=…` — **eyeball that line**.

> 🐞 Real incident (2026-07-01): running `deploy:staging` then `deploy:production` back-to-back
> baked the **staging** Supabase into the production bundle (prod briefly pointed at the staging
> DB). Fixed by sourcing the pulled env into the shell. Always verify the baked ref after deploy:
> `curl -s https://getcamino.app/interview | grep -oE '/_expo/static/js/web/[^"]+\.js'` then grep
> the bundle for the Supabase project ref (`oftrp…` = prod, `gsnsg…` = staging).

### Environments / databases

| Env | URL | Supabase project |
|---|---|---|
| production | getcamino.app / camino.expo.app | `oftrpaleqtmuvolwsocd` (real data) |
| preview / staging | camino--staging.expo.app | `gsnsgfobfswazqhfcstx` (camino-staging, test data) |
| local dev | `expo start` | `gsnsgfobfswazqhfcstx` (staging — never writes prod) |

Staging auth (Google sign-in) still needs configuring in the camino-staging Supabase project
(Site URL + redirect allowlist + Google OAuth). Until then staging sign-in won't work; the
interview runs without it.

### Live URLs

- **Production:** https://getcamino.app (custom domain) and https://camino.expo.app
- Custom domains require a **paid EAS plan** (the Free tier can't attach one). Configured in the
  Expo dashboard → Hosting → Settings → Custom domain; it prints the DNS records (A / TXT / CNAME)
  to add at the registrar. Point the apex `@` A record at the given IP and delete any registrar
  default URL-redirect on `@` (it conflicts).

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
