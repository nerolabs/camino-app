# Camino — TODO / status tracker

Living list of what we're tracking against. Update as work moves. Newest context at top.
See `HANDOFF.md` for the fuller picture and `core/SOURCING.md` for obligation provenance.

Last updated: 2026-07-01.

## 🔒 Security — TOP PRIORITY

- [ ] **Verify no secrets are ever committed to the (public) GitHub repo.** Re-check before every
      push and before sharing the repo. Standing guarantees: `.env` is gitignored; the Anthropic
      key now lives server-side only (`app/api/lola+api.ts`). Quick audit:
      `git ls-files | grep -iE '(^|/)\.env'` → empty, and `git grep -I 'sk-ant-' HEAD` → no matches.
      **Last audited 2026-07-01: CLEAN** — `.env` never committed; no `sk-ant-` keys in any tracked
      file or in full history; the one `eyJ…` match in `package-lock.json` is an npm integrity hash,
      not a secret. Also confirm the Supabase URL/anon key are the only `EXPO_PUBLIC_` values (anon
      key is public-safe under RLS).

## 🥇 Priority order (set by user 2026-07-02)

1. **Security** (above) — always first.
2. ~~**Webinar → obligation mapping.**~~ **DONE (2026-07-02).** All 16 transcripts captured;
   mapped **43/55 obligations** to their source video with transcript-verified timestamps.
   `webinar_url` is supplementary (kept even when `source_url` exists), staff-only for now, and
   becomes user-facing content with a potential **MovingToSpain.com** partnership. The 12 unmapped
   are tax-form technicalities + admin items the webinars don't cover specifically enough to cite.
   See `core/SOURCING.md` "batch 2". **→ Next active item is #3.**
3. ~~**Re-add backlog obligations.**~~ **DONE (2026-07-02).** All 4 (`sworn-translation`,
   `convenio-especial`, `modelo-390`, `citizenship-jura`) verified against official `.gob.es`
   sources (with detail corrections) and re-added as `source: 'official'` + `source_url`.
   Catalog **55 → 59** (44 official / 15 webinar). Smoke-tested in `buildPlan` — no cycles.
   See `core/SOURCING.md` "Backlog re-add". **→ Next active item is #4 (deep cross-check).**
4. **Full deep cross-check / testing pass of ALL obligations** — **top priority, but only AFTER the
   webinar content is captured to obligations.** Obligations are still changing, so this final
   verification pass is saved for near the end (source accuracy, dates, links, webinar↔official).

## ✅ Done (this session)

- [x] **Plan view redesign** — removed debug dump; stats chips, consulate/penalty banners,
      phase grouping, severity emphasis (`app/plan.tsx`).
- [x] **Catalog expansion** — mined 15 webinars (5 Opus agents); catalog 20 → **54** obligations.
- [x] **Grounding pass** — verified new obligations against transcripts; stripped invented
      precision; pulled 4 ungrounded → `core/OBLIGATIONS_BACKLOG.md`.
- [x] **Provenance field** — required `source: 'webinar' | 'domain' | 'official'` on every
      obligation (`Obligation` + `Objective`, threaded through `buildPlan`).
- [x] **Anchor dates** — added `arrival_date` slot (type `date`) + live LLM parsing; engine
      now emits firm dates for arrival-anchored items and estimates `residency_established`
      from arrival; `estimated` flag is now honest. Verified end-to-end on 3 personas.
- [x] **Obligation detail drawers** — tap a plan card → modal with severity/category/source
      chips, timing explanation, prerequisites, and a provenance note (`app/plan.tsx`).
- [x] **Sourcing queue** — researched all 14 `domain` obligations against official sources;
      **flipped all 14 → `official`**; logged in `core/SOURCING.md`. Two real errors fixed:
      Modelo 720 "150% penalty" (struck down 2022) and Modelo 037 (abolished 2025).
- [x] **Live end-to-end test** — real Haiku extraction verified on 8 cases incl. new slots
      (arrival_date / owns_property_in_spain / has_pets), all correct; engine plan generation
      verified for NLV / DNV / EU personas.
- [x] **Audited the original 21 obligations** — promoted **10 → `official`** (with corrections),
      left 7 as `webinar` (generic process / soft estimates), 3 already done. Catalog source mix
      is now **29 `webinar` / 25 `official`**. Fixed a real bug: `family-reunification` was timed
      at residencia+30d → now ~1 year of residence. Also corrected the `medical-certificate`
      apostille mislabel, the criminal-check framing, the school-enrollment window, and added the
      6-month driving-licence limit. All logged in `core/SOURCING.md`.

## ✅ Done (follow-up session, 2026-06-30)

- [x] **Promoted `autonomo-social-security`** `webinar` → `official` (~€87–88 tarifa plana;
      logged in SOURCING.md). Catalog mix now **28 `webinar` / 26 `official`** (0 `domain`).
- [x] **Gated `tarjeta-sanitaria` off the NLV path** — `applies_if` now excludes
      `visa_type === 'nlv'` (NLV holders carry private cover, no public card on arrival).
      Title rewritten to explain the condition.
- [x] **`property_purchase` anchor** — added a `property_purchase` date slot (required when
      `owns_property_in_spain`), wired `anchorDate('property_purchase')` to read it. The notary /
      registry / transfer-tax items now resolve to firm dates instead of `pending_anchor`.
- [x] **Source tag on plan cards** — small coloured dot + short label (official / webinar /
      unverified) in each card's meta row, alongside the full chip in the detail drawer.
- [x] **Fixed the `ExternalLink.tsx` `tsc` error** — cast `href` to `Href`. `tsc --noEmit`
      is now fully green.
- [x] **Conversation-aware interview** — `phraseQuestion` + `extractAnswer` now receive the full
      transcript. Lola stops greeting on every turn ("Hey!"/"Hola!"), asks natural follow-ups,
      reuses context (mentioning a "wife" → the spouse question becomes a confirmation), and the
      extractor infers downstream values from earlier answers. Verified live.
- [x] **Clarify reprompt no longer leaks internals** — an unparseable answer now re-asks in Lola's
      voice via the friendly static question, instead of surfacing the extractor's raw "…you'd like
      me to extract?" string (`app/interview.tsx`).
- [x] **Living roadmap — foundation** (deterministic, invariant-safe). Per-obligation `progress`
      stored on the profile; engine reads it. "Action taken" section in the plan drawer: mark done
      (today) or **done on a specific date**. Done items render olive with a ✓ badge and a
      "Completed DATE · N days late/early" line; a "done" stat chip appears. **The living part:**
      a real completion date re-anchors downstream `relative_to_obligation` steps to the actual
      date (firm, not estimated) — verified live (empadronamiento filed 20 days late → tarjeta &
      Modelo 030 re-flowed from 14 Apr est. → 4 May firm). No LLM in the engine; the plan stays a
      pure function of the profile. (`core/engine-controller.ts`, `app/plan.tsx`)

## ✅ Done (living roadmap — layer 2)

- [x] **Living roadmap — layer 2 (the LLM half).** The plan drawer's "Something changed?" box now
      takes free text ("we had a baby", "we decided to rent instead of buy"); a Haiku Extractor maps
      it to a **profile-field delta** (fields derived from `SLOTS`, so it can't drift), then
      `derive()` + `buildPlan()` re-run and an amber Lola banner narrates a **deterministic diff**
      (added / removed / shifted, computed from before/after plans — Lola never invents the facts).
      The model emits typed profile values only; the engine still authors every obligation/date.
      Verified live: "we had a baby" → `has_children=true` → school-enrolment step added (38→39).

## ✅ Done (desktop interview polish + dictation)

- [x] **Tightened, centered interview for desktop** — chat is a centered ~640px column; the
      composer now sits **directly below the conversation** (not pinned to the viewport bottom),
      in a rounded pill. Landing copy/dev panel constrained too (`app/interview.tsx`).
- [x] **Progress bar + time estimate** — thin olive bar under the nav: "Question N of ~M" +
      "About X min left". `interviewProgress()` in the controller; clamped monotonic so the bar
      never goes backwards when a branch opens.
- [x] **Microphone dictation** — Web Speech API mic button in the composer (web/Chrome; hidden where
      unsupported). Tap to dictate into the answer field. Verified the button renders; live
      dictation needs the user's mic-permission grant.
- [x] **Celebratory "plan remodelled" modal** — replaced the inline banner with a centered amber
      popup ("That was useful — I've remodelled your plan!" + the deterministic diff). Verified live:
      "we'll rent instead of buy" → removed 6 property steps (38 → 32) (`app/plan.tsx`).
- [x] **Chat-first task drawer redesign** — rebuilt the messy detail sheet around a **context-aware
      Lola coach**: on open she explains how to tackle the step (plain text, defers specifics to a
      gestor — invariant 3), and the user can ask threaded follow-ups (`askLola` in `app/plan.tsx`).
      Cluttered sections replaced with compact pills + a compact action row (the full-width "I've
      done this" button is now a small "✓ Mark done" chip; "on a date"/"Details" are links; details
      collapse). Verified live incl. follow-up Q&A. Note: this is a 3rd LLM surface (advisory only,
      never authors plan data) — flag for the invariants review.

## ✅ Done (roadmap width + nav)

- [x] **Centered the roadmap on desktop** — `plan.tsx` content is now a max-width 820px column
      (`alignSelf: center`), matching the interview's centered layout. Stats chips kept.
- [x] **Added a "Home" nav link** to the left of "How it works" (`components/NavBar.tsx`), routing
      to `/` for a clean way back to the start.
- [x] **Capped the task sheet width on desktop** — the detail drawer now maxes at 640px and centers
      (`modalBackdrop` alignItems center + `sheet` maxWidth/alignSelf), instead of spanning full width.

## 🚀 Deployment (in progress)

- [x] **Moved the Anthropic key server-side** — new `app/api/lola+api.ts` proxy + `lib/lola.ts`
      client helper; interview + plan LLM calls now hit `/api/lola` (no key in the client bundle).
      `web.output` → `'server'`; removed the key from `app.config.ts extra`. Verified the route
      end-to-end locally (`POST /api/lola` → `{text}` 200). Added server-side `ANTHROPIC_API_KEY`
      to local `.env`.
- [x] **Scaffolded EAS config** — `eas.json` (development / preview / production profiles, channels,
      environments), iOS/Android bundle IDs (`com.nerolabs.camino`), and `DEPLOY.md` runbook.
- [x] ~~**User: create Expo account + `eas login` / `eas init`**~~ — **DONE (long since).** EAS
      account + project live (`@nerolabs-team/camino`); all secrets set per environment; web deploys
      + iOS builds run non-interactively.
- [x] **Separate databases per environment — DONE.** Created a second Supabase project
      **`camino-staging`** (`gsnsgfobfswazqhfcstx`) with the same schema (`profiles` table + RLS
      via SQL). Wiring:
      - **production** (getcamino.app) → prod DB `oftrpaleqtmuvolwsocd` (unchanged).
      - **preview / staging** (`camino--staging.expo.app`) → staging DB `gsnsgfobfswazqhfcstx`
        (EAS `preview` env vars repointed via `eas env:update`).
      - **local dev** (`.env`) → staging DB too, so `expo start` never writes prod data.
      Verified the baked Supabase ref in each live bundle (staging=gsnsg, prod=oftrp).
      ⚠️ **Gotcha found & fixed:** `EXPO_PUBLIC_*` values are baked by Metro at `expo export` time
      and Metro's cache does NOT bust on env-value changes — so a rebuild silently shipped the
      *old* DB. Fix: always export with `--clear` when env changes. Codified in `scripts/deploy.sh`
      + `npm run deploy:staging` / `deploy:production` (pull EAS env → clear cache → export →
      deploy → clean up). Use these instead of manual export/deploy.
      - [x] **Staging auth (sign-in) — DONE.** Set the staging Supabase Site URL
            (`https://camino--staging.expo.app`) + redirect allowlist (staging + localhost:8081),
            reused the same Google OAuth client id/secret as prod, added the staging callback
            (`https://gsnsgfobfswazqhfcstx.supabase.co/auth/v1/callback`) in Google Cloud, and
            enabled the Google provider. Verified Google sign-in works live on staging.
- [x] **Custom domain: getcamino.app — LIVE.** Registered at Namecheap; attached to EAS Hosting
      production (requires a paid EAS plan — Free tier can't). DNS at Namecheap: A `@` →
      172.66.0.241, TXT `_cf-custom-hostname`, CNAME `_acme-challenge` (deleted Namecheap's default
      URL-redirect record that conflicted with the apex A record). Verified: https://getcamino.app
      serves the app + `/api/lola` over HTTPS. Owner account: nerolabs-team (the upgraded one).
- [~] **Harden the `/api/lola` proxy — PARTIAL (payload caps live; volume-limiting still needed).**
      Added, verified live on getcamino.app + staging:
      - **Payload caps ENFORCED** — ≤40 messages, ≤24k total chars, max_tokens≤1024, strict message
        shape. Oversized → 413. This is the real per-request cost limiter.
      - Origin/Referer allowlist + per-IP rate limit are in the code but **fail-open**: the EAS
        Hosting (Cloudflare Workers) runtime does **not forward `Origin` or `Referer`** to the route
        handler (confirmed live — foreign origin/referer still return 200), so the allowlist is a
        no-op in prod (works on other runtimes). Rate limit is best-effort and skipped when no client
        IP is available, so it never throttles legit users.
      - [ ] **Still to do before a wide/public launch:** real volume-limiting the Workers runtime
            can't do in-process — a **Cloudflare WAF rate-limit rule** and/or **Turnstile** challenge,
            or a KV-backed counter. Today an abuser who finds the URL can still send many small
            (payload-capped, cheap-Haiku) calls. Fine for an unlisted family test; not for public.
- [x] ~~**Native API base URL**~~ — **DONE.** `EXPO_PUBLIC_API_URL: "https://getcamino.app"` set in
      every `eas.json` build profile, so native `/api/lola` + `/api/tts` resolve off-web.

## 📱 Mobile (iOS / Android) — in progress

Goal: ship installable iOS + Android apps. No local simulator/emulator on this machine
(no Xcode / Android SDK), so all native builds run in the **EAS cloud** and install on real
devices. The app has **no custom native code** (only standard Expo modules), so no dev client
is strictly required — a normal EAS build works.

- [x] **Native-readiness code fixes.** (1) `core/AuthContext.tsx` used `typeof window` to detect
      web, which crashes on native (RN defines a global `window` without `.location`) — switched to
      `Platform.OS === 'web'`. (2) `EXPO_PUBLIC_API_URL=https://getcamino.app` added to the native
      build profiles in `eas.json` (build-only, so web deploys keep same-origin `/api/lola`); native
      has no same-origin so it needs the absolute URL. Audit found everything else already
      `Platform.OS`-guarded (mic hidden off-web, supabase storage, index resize, etc.).
- [x] **First build — Android preview APK BUILT** (build `a538b9d7`, finished 2026-07-01). APK:
      https://expo.dev/artifacts/eas/UhQ5NVtbsZ4rrjR3nvsqBopLRUhGvikflJOlD1IfVho.apk — staging DB +
      `EXPO_PUBLIC_API_URL=getcamino.app` baked in. **Not yet verified on-device** (user hit Android
      emulator trouble; deferred to focus on iOS). Re-test the APK later to validate native rendering
      + the interview/`api/lola` path.
- [x] **iOS build + TestFlight submission — DONE (2026-07-01).** Real iPhone via TestFlight.
      - Apple auth: **App Store Connect API key** (.p8), key id `8PM8N955UX`, team `VB9CHJM4AN`,
        stored on EAS servers + in `~/.zshrc` env vars. Distribution cert + provisioning profile
        created (one-time interactive `eas build`; now non-interactive for Claude).
      - App Store Connect app created (bundle `com.nerolabs.camino`, **ASC App ID `6786412055`**,
        wired into `eas.json` submit). Name landed as "Camino (51e654)" ("Camino" was taken) —
        renamable in App Store Connect later.
      - Build `4c7a1cd7` (production profile, store dist, buildNumber 3) submitted to TestFlight;
        `ITSAppUsesNonExemptEncryption=false` set so no manual export-compliance step. Awaiting
        Apple processing → installs via the TestFlight app.
      - ⚠️ Prod-DB build: fine because native sign-in is a no-op right now (nothing writes to the
        DB until native OAuth is wired).
- [x] **Native Google sign-in (OAuth deep-link) — DONE (verified on device, build 7).**
      `core/AuthContext.tsx` now does the native flow: `signInWithOAuth({skipBrowserRedirect})` →
      `WebBrowser.openAuthSessionAsync` → complete the session from the `caminoapp://auth-callback`
      redirect (handles both PKCE code-exchange and implicit token setSession). Web path unchanged.
      `caminoapp://**` added to BOTH Supabase projects' redirect allowlists (prod + staging). No
      Google Cloud change needed (round-trips through Supabase's existing callback). Building iOS
      `24178b4c` (buildNumber 4) with this → TestFlight to verify on-device. Branch
      `native-google-signin`.
- [x] **Native dictation — DONE (verified on device, build 7).** Platform-split
      `hooks/useDictation` (web = browser SpeechRecognition, native = `expo-speech-recognition`,
      Metro picks `.native` so the web bundle never imports the native module). Mic button now
      shows + streams live transcription on iOS/Android. Config plugin adds mic + speech permission
      strings; iOS deploymentTarget pinned 16.4 (lib minimum). In build 5 (`3f6446a8`).
- [x] **Dynamic Island / safe-area — DONE (verified on device, build 7).** `SafeAreaProvider` at
      the root + `NavBar` pads by top/left/right insets so it clears the Dynamic Island / notch /
      status bar (reported on iPhone 17 Pro Max). Web insets are 0 → web unchanged. Dark status-bar
      style for the light UI. In build 5 (`3f6446a8`).
- [~] **Store submission — TestFlight DONE; full public submission pending.** iOS builds auto-submit
      to **TestFlight** (ASC App ID 6786412055) and are testable on device. Still to do for public
      release: App Store metadata / screenshots / privacy nutrition + review submission; **Google
      Play** ($25 one-time) deferred to the very end (no Android device to test).

## 📥 Feedback backlog (captured 2026-07-01) — suggested order below

- [x] **B1a — Dev personas + staff gating — MOVED TO DB FLAG (2026-07-02).** Retired the hardcoded
      `EXPO_PUBLIC_STAFF_USER_IDS` allowlist and the env-based `showDevTools`. Staff is now the
      **`profiles.is_staff`** column (defaults false, admin-set), read via `loadProfileRow()` →
      `ProfileContext` (`useProfile().isStaff`). Dev personas (interview) **and** the ▶ Webinar
      cross-check link (roadmap drawer) both gate on it. Ready for extended testers — grant staff
      with a one-line SQL upsert. **Setup + hardening SQL in `docs/STAFF.md` (run on both DBs).**
      Old note (env approach, superseded): staff were the auth `user_id`s set in the production EAS
      env; profiles.id ≠ auth user_id (verified via SQL).
      - [x] **DONE 2026-07-02:** migration run on staging + production; testers granted staff; the
            now-unused `EXPO_PUBLIC_STAFF_USER_IDS` EAS env var deleted from production. Fully DB-driven.
- [x] **B1b — Lola intro (DONE 2026-07-01).** Interview landing now opens with an eyebrow
      ("YOUR ROAD TO SPAIN"), "Hola, I'm Lola," a warm experienced-companion line, and a quieter
      what-happens-next line. Verified live on prod + staging.
- [x] **B9 — Lola text-to-speech (web) DONE 2026-07-02.** `/api/tts` proxies **ElevenLabs**
      (key server-side, same hardening as `/api/lola`) → `audio/mpeg`, cached. Client: platform-split
      `hooks/useLolaVoice` (web plays via `Audio` + in-memory cache; native = no-op stub). Opt-in 🔊
      toggle next to the mic (off by default — no surprise audio); speaks each new Lola turn.
      Voice = **Kate 2** (warm, Spanish accent), swappable via `ELEVENLABS_VOICE_ID`. Needs the
      ElevenLabs **Starter** plan (free tier blocks library voices via API).
      - [x] **Autoplay DONE 2026-07-02 (user-confirmed "works!").** Rewrote `useLolaVoice` to play via
            the **Web Audio API** (create + `AudioContext.resume()` inside the user gesture, then
            fetch→`decodeAudioData`→`BufferSource`) — the old `new Audio().play()` was blocked by the
            autoplay policy because the clip plays after the async fetch. Voice now **on by default**
            (mute persists as `'0'`) and unlocks on the "Let's get started" click, so Lola speaks with
            no separate "sound on" tap. Moved the toggle out of the composer to a **"🔊 Voice on/off"
            pill** under the nav (composer holds only input/mic/send).
      - [x] **Native voice — DONE 2026-07-02, in TestFlight build 8.** `hooks/useLolaVoice.native.ts`
            uses `expo-audio` (on by default, `playsInSilentMode`); streams the new GET `/api/tts?text=`
            variant (expo-audio plays a URL, not a body). On-device verify once build 8 finishes Apple
            processing.


Recommended sequence (rationale in each item): **B1 quick UX/config wins → B7 analytics (time-
sensitive: capture family-testing funnel data now) → B4 scouting obligation → B5 E2E tests → B6
observability → B8 blog stub → B2 app icon (needs an asset decision).**

### Product / UX (quick–medium)
- [x] ~~**B1a — Hide dev test personas in production**~~ — **DONE** (see the reconciled B1a entry above:
      now the DB-backed `profiles.is_staff` flag, which superseded the env-gate/allowlist plan).
- [x] ~~**B1b — Interview intro**~~ — **DONE** (see the reconciled B1b entry above: eyebrow +
      "Hola, I'm Lola" + warm companion line, live on prod + staging).
- [x] **B2 — App icon from the brand mark (DONE 2026-07-01).** White 8-pointed azulejo compass-star
      on a cobalt tile with an amber waypoint dot. `scripts/gen-icon.mjs` renders the full set from
      one SVG (`assets/images/icon-source.svg`): iOS/store icon (flattened opaque — Apple rejects
      alpha), Android adaptive foreground/background(cobalt)/monochrome, splash, favicon. User-approved
      preview (`docs/design/icon-preview.*`). Favicon live on web; icon in TestFlight **build 7**.
      Regenerate anytime with `node scripts/gen-icon.mjs`.

### Catalog / engine (medium)
- [x] **B4 — "Where to live in Spain" scouting obligation (DONE 2026-07-02).** Added
      `scout-where-to-live` (`core/engine-controller.ts`): recommends a scouting trip + a framework
      to evaluate regions (cost of living, healthcare, climate, transport, expat/English support,
      schools). Advisory (`recommended`), early in `before_you_go`, gated to movers who don't own
      Spanish property. Asserts no deadlines/costs/laws (invariant 3 safe); `source: 'domain'`,
      logged in SOURCING.md. Engine-tested + live on web; in the next native build.
      - [x] **Tighter gating DONE 2026-07-02.** New `knows_where_to_live` interview slot (asked only
            when they don't own property); `scout-where-to-live` now gated on `not owns_property` +
            `knows_where_to_live === false`, so it only shows to movers still deciding. Verified.
      - [ ] *Still optional:* make it more prominent/first if the severity-sort buries it; deepen the
            in-drawer Lola coaching for region evaluation.

### Infra / ops (large — before wider launch)
- [ ] **B5 — Automated end-to-end test suite (on-demand + on prod pushes).** We're spot-testing;
      time for real E2E. Cover: interview → extraction → plan generation for key personas;
      `/api/lola` contract; sign-in; living-plan re-model. Runs locally + in CI on deploy. Consider
      Playwright (web) + Maestro (native), and an engine-level deterministic test pass.
- [~] **B6 — Observability (Sentry). Web + backend DONE 2026-07-02; native + alerts next.**
      One Sentry project (**camino**, org **camino-ko**, DE region), tagged by platform
      (web/ios/android/server) + environment (production/staging). DSN in EAS preview + production.
      - [x] **Web** — `lib/monitoring.ts` (@sentry/browser): JS errors + `browserTracing` (page-load
            / Web Vitals = time-to-load). `initMonitoring()` in `_layout`, DSN-gated (local dev
            silent). **Verified live**: staging POSTed an event → 200, landed in Issues tagged
            `environment=staging` + `platform=web`.
      - [x] **Backend** — `lib/sentryServer.ts` posts a minimal event envelope via fetch (Node/CF
            SDKs don't fit the EAS Hosting Workers runtime); wired into `/api/lola` + `/api/tts`
            catch + upstream-error paths, tagged `platform=server`.
      - [x] **Native Sentry — DONE 2026-07-02, in TestFlight build 8.** `@sentry/react-native` + its
            Expo plugin + Sentry Metro wrapper; `lib/monitoring.native.ts` does a real `Sentry.init`
            (same project, tagged `platform=ios` + env). `SENTRY_AUTH_TOKEN` set in EAS → source maps
            uploaded during the build (readable traces). On-device verify once build 8 processes.
      - [x] **Alerting + uptime DONE 2026-07-02.** Issue alert "high priority issues" → email
            (verified: fired on the test error). **Sentry Uptime monitor** on `https://getcamino.app`
            (GET every 1 min, environment=production, 3 consecutive fails → issue → email). Downtime
            now pages. Optional later: backend latency tracing (transactions), not just errors.
- [x] **B7 — Product analytics (web) DONE 2026-07-01.** PostHog (EU, project 214229) via
      `posthog-js`, `lib/analytics.ts` (native = no-op stub). Live on prod + staging (verified
      events POST → 200). Events: `interview_started`, `interview_completed`, `roadmap_viewed`,
      `roadmap_item_completed`, `task_opened`, `task_coach_asked`, `plan_remodelled`; autocapture
      pageviews; `identify()` on sign-in; person profiles for retention. Key/host in EAS
      preview+production only (dev sends nothing); every event stamped with `environment`.
      - [ ] **Native analytics (posthog-react-native)** — fast follow; needs the RN SDK + a rebuild.
      - [ ] **Build the PostHog insights** — funnel (pageview `/` → interview_started →
            interview_completed → roadmap_viewed), retention on roadmap_viewed, feature-health
            (% completing items / using task coach). Filter to `environment = production`.
            **Note:** PostHog's step picker only lists events it has already ingested. As of setup,
            only `$pageview` + `interview_started` had fired; `interview_completed`/`roadmap_viewed`
            /etc. become selectable once real usage fires them (or complete one full interview to
            seed them). Verified events reach PostHog EU (POST → 200). Finish the funnel then.

### Catalog grounding (ongoing, high-value)
- [x] **B10 — source grounding + taxonomy — DONE (2026-07-02).** Every catalog item now carries a
      user-facing `source`: **`official`** (a codified government requirement, verified + `source_url`
      shown as "View the official source →") or **`recommendation`** (Camino's practical advice, no
      law to cite). `severity` stays the orthogonal "how important" signal; `webinar_url` stays the
      staff-only cross-check link. **Final mix: 54 official / 5 recommendation.** Drawer/dot UI updated
      (retired the "From webinar"/"Needs sourcing"/"unverified" labels). See `core/SOURCING.md`.
      - [x] **Grounding pass DONE.** Researched all remaining items; **promoted 9** to `official` with
            `source_url` + title corrections (community-fees→LPH art.9; land-registry→corrected to
            *voluntary*/recommended; nlv-renewal→60-before/90-after; apostille→Hague/issuing-country;
            dnv-renewal→Startups Law; completion-deed-notary; student-visa-insurance; nlv-letter-of-
            intent; nlv-non-work-declaration).
      - [x] **Taxonomy DONE.** Retired `webinar`/`domain` source values. 5 genuinely-advisory items →
            `recommendation` (scout-where-to-live, tax-planning-consultation, exit-tax-return,
            spanish-bank-account, property-legal-due-diligence; last two also severity required→
            recommended). The 2 required-but-uncited steps were *sourced* not downgraded:
            choose-visa-type → inclusión authorisations catalog, consulate-appointment → MAEC cita
            previa (both `official`, still `required`).
      - [x] **Populate `webinar_url` — DONE (2026-07-02).** Re-fetched all 16 transcripts (yt-dlp
            + Chrome cookies), read each, and mapped **43/55 obligations** to their topic-dedicated
            webinar with transcript-verified timestamps (option b, evidence-based). Kept as
            supplementary even where `source_url` exists. 12 unmapped = tax-form technicalities +
            admin items not covered specifically enough. See `core/SOURCING.md` "batch 2".
- [x] **B11 — Repo structure — DONE 2026-07-02: combined into camino-app.** Folded the thesis + four
      invariants into `docs/THESIS.md`; repointed `CLAUDE.md` / `HANDOFF.md` / `TODO.md` there.
      **User archived the `nerolabs/camino` GitHub repo** (the last manual step). camino-app is now
      the single source of truth. (Local `../camino/` checkout is vestigial — safe to delete anytime.)
- [x] ~~**B11 — investigation (superseded by the resolution above).**~~
      Findings: two separate GitHub repos. `nerolabs/camino` (`../camino/`) is the original
      **design-seed/thesis repo**, frozen since Jun 30 ("skeleton + brand identity"): CLAUDE.md
      (thesis + four invariants), a 257-line `core/engine.ts` walking skeleton (~7 obligations) +
      `interview.ts`, `design/` (Lola persona, report prototype), `docs/BUILD.md`. `nerolabs/camino-app`
      (this repo) is the **live product** (875-line engine, 59 obligations, full Expo app, active today).
      **Three facts that matter:** (1) camino/'s `design/*` + `docs/BUILD.md` are **byte-identical
      copies already present in camino-app** → redundant. (2) camino/`core/engine.ts` is a **stale
      ancestor** of `core/engine-controller.ts` → risk of editing the wrong engine. (3) The ONLY
      load-bearing dependency is `camino-app/CLAUDE.md` line 7 pointing agents to `../camino/CLAUDE.md`
      as "canonical project memory" — **and that file is stale/misleading** ("Status: walking skeleton
      (pass 1)… ~7 obligations. The native app is not scaffolded yet — immediate next task"). All false now.
      **Recommendation: keep the repos separate but fix the staleness (don't delete anything).**
      (a) Trim `camino/CLAUDE.md` to the timeless thesis + invariants; replace the stale "Status" /
      "Immediate next task" sections with a one-liner → "current state lives in camino-app/HANDOFF.md".
      (b) Add a "SUPERSEDED — see camino-app/core/engine-controller.ts" banner to camino/`core/engine.ts`
      + `interview.ts` (or move them to `camino/archive/`). **Alternative:** fold the thesis into
      `camino-app/docs/THESIS.md`, stop pointing at `../camino`, archive the `nerolabs/camino` repo
      (cleaner single source of truth, but touches the canonical-memory pointer — bigger change).
      **Awaiting user's pick before editing the other repo.**
      ---
      Old note (still valid, unrelated to structure): webinars
      were great for *ideation*; researching each obligation against official Spanish government
      sources and flipping it to `source: 'official'` (with corrections) strengthens the app's
      credibility and effectiveness. This is the same sourcing pass already done for the 14 `domain`
      items — extend it to the ~29 remaining `webinar` items. For each: verify the claim
      (deadlines/costs/laws) against sede.agenciatributaria / extranjería / official portals, correct
      anything wrong, log the citation in `core/SOURCING.md`, and update the `source` tag. Do it in
      batches; anything unverifiable → `OBLIGATIONS_BACKLOG.md`, never guess (invariant 3). Track the
      catalog source mix as it shifts toward all-official.

### Content (medium — stub now, refine later)
- [x] **B8 — Hidden "how-i-was-built" blog (DONE 2026-07-02, first pass).** `app/how-i-was-built.tsx`,
      unlisted (not in the NavBar; direct link only) — live at `getcamino.app/how-i-was-built`.
      Best-effort leadership narrative: idea from the move → architecture-first invariants → thin
      end-to-end thread → depth via webinar mining + grounding → local web MVP/MLP → EAS
      dev/staging/prod + separate DBs + safe pipelines → telemetry → living TODO → why leading AI
      projects still needs taste/architecture/judgment.
      - [x] *Follow-ups DONE 2026-07-02:* disabled the auto `/_sitemap` (`sitemap:false` on the
            expo-router plugin — Expo has no per-route exclude) so the unlisted blog no longer shows
            in the route index; added `public/robots.txt` disallowing `/how-i-was-built` to keep it
            out of search; refreshed the copy (dropped the "first pass/draft" hedging, catalog now
            "nearly sixty… large majority officially cited"). Still open: a real blog surface later.

## 🔜 Next (candidates, not yet started)
- [ ] **"Show our homework" — a second, detailed how-i-was-built page (user feedback 2026-07-02).**
      A companion to the narrative essay (`app/how-i-was-built.tsx`): a build log that walks **each
      roadmap item in the order we took the work on**, as a table with columns **Feature | Work
      completed | Key decisions made**. It's the receipts/appendix to the story — e.g. rows for the
      catalog grounding pass, the source→official/recommendation taxonomy, the staff DB flag, the
      Web-Audio TTS autoplay fix, Sentry web+backend+native, etc., each with the notable decisions
      (why Web Audio over HTMLAudio, why one Sentry project tagged vs three, why `recommendation` as
      a source value…). Source it from this TODO's completed items + git history so it stays honest.
      Own route (e.g. `/how-i-was-built/log` or a section on the page); keep it unlisted like the
      essay (robots-disallowed, not in nav).
- [ ] **Context-aware "what changed" sample text (user feedback 2026-07-02).** The `changeBox`
      placeholder in `app/plan.tsx:602` is hardcoded `"e.g. We decided to rent instead of buy."` —
      only apt for a property step. Make it relevant to the **step the user has open** (`selected`):
      derive a sample from the obligation's `category` (property → rent-vs-buy; visa → "we switched
      from the NLV to the digital-nomad visa"; family → "my partner isn't moving with me"; tax → "my
      income changed"; etc.), via a small `category → hint` map, or an optional per-obligation
      `changeHint` field, or (heavier) an LLM-phrased hint. Low-effort, nice polish; the flow already
      knows `selected`.
- [ ] **Localization / i18n (user feedback 2026-07-02) — big cross-cutting effort.** "Localize the
      hell out of this" for a complete app experience. Scope: (a) an i18n layer (`expo-localization`
      for locale detection + a lib like `i18next`/`react-intl`) and extract every UI string to
      message catalogs; (b) **Spanish first** (the domain audience), then others; (c) the deterministic
      **obligation catalog** (`CATALOG` titles) is user-facing content that must be translated too —
      decide: parallel translated title fields vs a translation layer keyed by obligation id; (d)
      **Lola's LLM** — pass the target language into the `/api/lola` + question-phrasing system
      prompts so she speaks the user's language, and TTS voice/locale (`/api/tts`) may need a
      per-language voice; (e) locale-aware dates/currency in the plan. Note the invariant: engine
      stays deterministic — translation is a presentation layer, never changes which obligations apply
      or their timing. **Sequence LAST (user: "localization should come at the very end")** — after
      all features, native parity, tests, and the obligation cross-check are settled.
- [x] **Citizenship vs. rolling-renewal — DONE 2026-07-02.** Added the `wants_citizenship` interview
      slot (bool, asked when `NON_EU` + `intends_long_stay`), and gated the whole citizenship track on
      `wants_citizenship === true`: `citizenship-track-standard`, `citizenship-track-latam`,
      `dele-a2-exam`, `ccse-exam`, `citizenship-application`, `citizenship-jura` (via a new
      `WANTS_CITIZENSHIP` condition). The renewal path (`nlv-renewal`/`dnv-renewal`/
      `permanent-residence`) stays for all long-stay movers. Verified both ways: naturaliser sees the
      track; rolling-renewer sees none of it but keeps permanent-residence. Interview asks the new Q
      at the right time (after long-stay + non-EU known).
- [ ] **Final-polish: audit the full obligation list + the questions that gate them (user feedback
      2026-07-02).** Produce a human-readable view of every obligation and the interview branching
      (which `applies_if` fields / slots drive it) so the branching is easy to follow and review.
      A generated **ERD isn't the right shape** (this is rules/conditions, not entity relationships);
      better options: (a) a generated Markdown/CSV table — obligation × the fields its `applies_if`
      tests, plus severity/source/timing; (b) a decision-tree / flow diagram (Mermaid `flowchart`)
      from `SLOTS` → derivations → obligations; (c) per-persona "what applies" snapshots. Recommend
      (a)+(b): both are generatable straight from `SLOTS` + `CATALOG`, kept in sync by codegen. Pairs
      with the "full deep cross-check" pass (priority #4).
- [x] **Re-anchor more anchors from actuals — DONE 2026-07-02.** New `ANCHOR_FROM_COMPLETION` map in
      the engine: completing `empadronamiento` fills the `padron_done` anchor and completing
      `residencia` fills `residency_established` (explicit profile dates still win). So marking those
      done re-flows every residency-/padrón-anchored item from a **real** date (estimated → firm).
      Verified: `ccse-exam` flipped `estimated=true`→`false` and re-dated off the actual residencia
      completion. (`padron_done` has no consumer obligation yet — wired + future-proof; activates the
      moment one anchors to it. Wants a regression test when B5 lands.)
- [x] **Capture `residency_established` as a known-later field — DONE 2026-07-02.** Two paths now
      firm it up post-move: (1) marking the `residencia` step done with a date (via the engine's
      `ANCHOR_FROM_COMPLETION`, above), and (2) the per-step "what changed" free-text flow — added
      `residency_established` + `padron_done` to `fieldGuide()` as `KNOWN_LATER_FIELDS`, so a user
      can say "my TIE was issued on 2027-02-01" and the extractor sets the anchor directly. Pending
      residency-timed items already render "starts once your residency is established", so the path
      is discoverable. Explicit dates always win over completion-derived ones.
- [x] ~~**Re-add backlog items once sourced**~~ — **DONE 2026-07-02.** All 4 (`sworn-translation`,
      `convenio-especial`, `modelo-390`, `citizenship-jura`) verified + re-added as `official`.
- [x] ~~**More webinars / ~100-obligation target**~~ — **struck 2026-07-02.** No more webinars are
      coming, so 100+ is no longer a requirement. The catalog is scoped to what we can source
      honestly (59 obligations, mostly official). Breadth grows only if new primary sources appear.

## 🐞 Known issues

- _(none open — `tsc --noEmit` is green.)_

## Invariants (do not break — see ./docs/THESIS.md)

1. Engine is deterministic — no LLM in plan-building.
2. Interview is derived from the catalog (every `applies_if` field has a slot or derivation).
3. Lola never invents deadlines/costs/laws — hence the `source` field + SOURCING.md.
4. The plan is a pure function of the profile.
