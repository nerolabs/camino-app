# BUILD.md — pipeline & resources

The build process for Camino. Mostly forward-looking — the native app isn't
scaffolded yet (see `CLAUDE.md` → Immediate next task).

## Pipeline (one codebase → iOS, Android, web)

1. **Local dev** — `create-expo-app` (Expo Router, TS). On macOS you get the iOS
   Simulator + Android emulator locally.
2. **Source** — GitHub (this repo).
3. **Cloud builds — EAS Build** — signed iOS + Android binaries in the cloud.
   Profiles live in `eas.json`.
4. **Store submit — EAS Submit** — to App Store Connect + Google Play.
5. **OTA — EAS Update** — JS-only changes over the air, no new store build. Most
   day-to-day iteration goes here.
6. **Web** — `expo export -p web` → any static host.
7. **CI/CD** — EAS Workflows or GitHub Actions: on push to `main`, test + build/update.

Backend in parallel: Supabase (Postgres for the catalog + profiles, auth, storage,
cron), Anthropic API key (Lola's two surface calls), Google Places key.

## `eas.json` starting point (add once the Expo app exists)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

## Resources to acquire

| Resource | For | Cost | When |
|---|---|---|---|
| Apple Developer Program | iOS + TestFlight | $99/year | Before iOS distribution (enroll early — 1–2 day approval) |
| Google Play Developer | Android store | $25 one-time | Before Android distribution |
| Expo / EAS | Cloud builds, OTA | Free tier (15 iOS + 15 Android builds/mo, OTA to 1,000 MAU); Starter $19/mo; Production $199/mo | Free covers build + launch |
| GitHub | Version control | Free | Now |
| Supabase | Backend | Free tier to start; ~$25/mo Pro at scale | At first real data |
| Anthropic API | Lola's two calls | Usage-based | At integration |
| Google Maps/Places | "Nearest office" | Usage-based, monthly free credit | When maps are added |
| Xcode + Android Studio | Local simulators | Free | Now |

**To reach both stores: ~$124** ($99 Apple + $25 Google). Everything else has a free
tier through build and launch.

## Push this repo to GitHub (from your Mac)

```bash
brew install gh && gh auth login          # one-time
cd camino
git init && git add . && git commit -m "Camino: walking skeleton"
gh repo create camino --private --source=. --push
```

## Open in Claude Code

```bash
npm install -g @anthropic-ai/claude-code   # one-time
cd camino
claude                                      # reads CLAUDE.md automatically
```
