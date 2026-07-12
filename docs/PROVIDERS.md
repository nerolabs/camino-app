# PROVIDERS.md — the SaaS accounts behind Get Camino

The complete list of third-party services the app depends on, who charges money,
and where each account's contact/billing email lives. Written 2026-07-12 from an
evidence-based audit (repo env vars, dependencies, workflows, and getcamino.app DNS —
not from memory). **Standing goal: all billing/notification email routes to
`andrew@getcamino.app`** so charges and renewal notices land in one monitored inbox.

Keep this file honest: if a provider is added or dropped, update it in the same PR
(same discipline as the privacy page — the two lists should always agree).

## Paid — money moves (or can)

| Provider | Role | Billing shape | Contact/billing lives at |
|---|---|---|---|
| **Anthropic** | Claude API behind `/api/lola` (Lola's phrasing + extraction) | Per-token; Console spend cap is the hard backstop for `LOLA_GLOBAL_PER_DAY=25000` | console.anthropic.com → Settings → Organization/Billing |
| **Expo / EAS** | Native builds, TestFlight submits, web hosting (+ API routes), env vars | Plan + build credits (credits are limited — builds only on user command) | expo.dev → `nerolabs-team` account → Billing |
| **Apple Developer** | $99/yr program; App Store Connect | Annual | developer.apple.com → Membership. **⚠️ Do NOT change account contact while the Proxim.us → AELaboratories identity/trader case is open** |
| **Google Workspace** | Hosts getcamino.app mail itself (MX = smtp.google.com; andrew@ / feedback@ / privacy@) | Per user/mo | admin.google.com — this account is the *destination* inbox, so its own billing contact matters most |
| **Namecheap** | Registrar + DNS for getcamino.app (NS = registrar-servers.com) | Annual renewal — **silent-failure risk if renewal notices go astray; domain expiry kills everything** | namecheap.com → Profile → contacts + WHOIS contacts + renewal alerts |
| **ElevenLabs** | ~~TTS voice~~ — plan cancelled 2026-07-12; code, `/api/tts`, and EAS env vars all removed | Final invoice may still arrive | Keep login reachable until the last invoice clears, then delete the account |
| **Google Play** | Android track ($25 one-time) | Not yet purchased as of 2026-07-12 (per ANDROID_LAUNCH.md) | play.google.com/console → Developer account, when created |

## Free tier today — could start charging as usage grows

| Provider | Role | Watch for |
|---|---|---|
| **Supabase** | Auth + database — **TWO projects**: production (`oftrpaleqtmuvolwsocd`) + staging. Don't miss the second | Free-tier inactivity pausing; billing email at org level |
| **PostHog** | Product analytics (EU cloud, cookieless on web; dashboard 808581) | 1M events/mo free — launch spikes could cross it |
| **Sentry** | Error reporting (org `camino-ko`, EU ingest) + 1-min uptime monitor + alert emails | **Alerts go to member emails** — add/route andrew@getcamino.app or incidents go unseen |
| **Resend** | All app email (welcome, weekly roundup, feedback relay), EU region; domain verified (DKIM + SPF via SES) | 3K emails/mo free tier; the weekly cron scales with users |
| **GitHub** | Repo (org `nerolabs`, **public** → Actions free, incl. macOS e2e-ios runners) | Org billing email anyway, in case a private repo appears |
| **Google Cloud** | OAuth consent screen behind Google sign-in | Two emails: the **support email is public-facing** on the consent screen + a developer-contact email. Both can be andrew@getcamino.app (Workspace hosts it) |
| **Cloudflare** | Indirect only — the site's A record (172.66.x) is EAS Hosting's edge on *Expo's* account. **Nothing to migrate.** Turnstile (TODO #20) would create a direct account later |

Nothing else touches money or accounts: Maestro is a local CLI, fonts ship in the
bundle, and Apple/Google sign-in ride the accounts above.

## Migration plan → andrew@getcamino.app

Change **billing/notification emails first** (zero-risk, immediate visibility).
Be careful with **login-identity emails**: several accounts likely authenticate via
Google OAuth with a personal gmail; changing login identities means re-doing 2FA and
risks lockouts. Billing contact ≠ login email on almost all of these — billing is
what needs monitoring.

Priority order (by consequence of a missed email):

- [ ] **Namecheap** — WHOIS + renewal notices (domain expiry is the worst failure)
- [ ] **Apple Developer** — AFTER the trader/identity case closes
- [ ] **Anthropic** — the biggest variable spender
- [ ] **Expo/EAS** — the other real spender (build credits)
- [ ] **Sentry** — alert routing to andrew@ (this is the incident pager)
- [ ] **Google Workspace** — its own billing contact
- [ ] **Supabase** (org-level; covers both projects)
- [ ] **Resend**
- [ ] **PostHog**
- [ ] **GitHub** (org billing email)
- [ ] **Google Cloud** — OAuth consent-screen support email (public-facing) + developer contact
- [ ] **ElevenLabs** — nothing to migrate; delete account after final invoice
- [ ] **Google Play** — set correctly at account creation (not yet purchased)

## Evidence trail (how this list was derived, 2026-07-12)

- Env vars: `.env` + `eas env:list` across production/preview/development
  (ANTHROPIC, SUPABASE, RESEND, SENTRY, POSTHOG, CRON_SECRET; ELEVENLABS_* deleted 2026-07-12).
- Dependencies: `@anthropic-ai/sdk`, `@supabase/supabase-js`, `@sentry/*`, `posthog-*`, `expo-*`.
- Workflows: `.github/workflows/{ci,e2e-ios,weekly-email}.yml` (GitHub Actions; repo public).
- DNS: NS → registrar-servers.com (Namecheap); MX → smtp.google.com (Google Workspace);
  A → 172.66.0.241 (Cloudflare edge, via EAS Hosting); DKIM/SPF on send.getcamino.app (Resend/SES).
- Cross-checked against the privacy page's processor list (`app/privacy.tsx`) — the two agree.
