# Camino — your road to Spain

An AI-guided relocation planner. Camino turns moving to Spain into a sequenced, personal,
deadline-aware roadmap, and coaches you through it in the voice of a warm guide named **Lola**.

**Live:** [getcamino.app](https://getcamino.app) · iOS on TestFlight

## The idea

Don't model *journeys* — they're infinite. Model **obligations**: finite, atomic legal/practical
steps (get your NIE, register on the padrón, file Modelo 720…) whose combinations generate the
thousands of individual journeys for free. A short conversational interview builds your profile;
a **deterministic engine** — no LLM — selects which obligations apply, orders them by real
dependencies, and resolves real deadlines. Lola explains the *why*; she never invents the *what*.

The full design thesis and its four invariants: [`docs/THESIS.md`](docs/THESIS.md).

## Where AI runs — and where it must not

An LLM appears at exactly three bounded surfaces: phrasing interview questions, extracting typed
answers from free text, and advisory step-coaching. Everything load-bearing — which obligations
apply, in what order, by when — is deterministic, auditable code. Every obligation is tagged
`official` (verified government requirement, with its canonical source linked) or
`recommendation` (Camino's practical advice), with provenance logged in
[`core/SOURCING.md`](core/SOURCING.md).

## Stack

- **Expo SDK 56 / Expo Router** — one codebase for web, iOS, Android
- **EAS Hosting** (web + API routes on a Workers runtime) · **EAS Build** (native → TestFlight)
- **Supabase** — auth (Google OAuth) + profiles, separate staging/production databases
- **Anthropic Claude** (Lola, via a server-side proxy) · **ElevenLabs** (Lola's voice)
- **Sentry** (errors + performance, web/native/server) · **PostHog** (product analytics)

## Repo map

| Path | What |
|---|---|
| `core/engine-controller.ts` | The deterministic engine + the obligation catalog |
| `core/interview-controller.ts` | Interview slots, derivations, question sequencing |
| `core/catalog-audit.ts` | Enforces the catalog↔interview contract (invariant 2) |
| `app/` | Expo Router screens + server API routes (`app/api/*+api.ts`) |
| `hooks/`, `lib/` | Platform-split modules (`.native.ts` twins for iOS/Android) |
| `docs/` | Thesis, staff flag, monitoring, design assets |

## Development

```sh
npm install
npm run web          # local dev (web)
npm run typecheck    # strict tsc
npm run audit        # catalog↔interview contract + persona smoke tests
```

Deploys are audit-gated: `npm run deploy:staging` / `npm run deploy:production`
(see `scripts/deploy.sh`). Secrets live in EAS environments — never in the repo.

## Scope

Guidance, not legal or tax advice. Lola keeps the map; a gestor signs the papers.
