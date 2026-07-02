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
- [ ] **User: create Expo account + `eas login` / `eas init`**, set `ANTHROPIC_API_KEY` as an EAS
      env secret per environment, then `eas deploy --environment preview` for a family-test URL.
      (See `DEPLOY.md`.)
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
- [ ] **Native API base URL** — set `EXPO_PUBLIC_API_URL` to the deployed origin for iOS/Android so
      `lib/lola.ts`'s relative `/api/lola` resolves off-web.

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
- [~] **Native Google sign-in (OAuth deep-link) — implemented, on-device test pending.**
      `core/AuthContext.tsx` now does the native flow: `signInWithOAuth({skipBrowserRedirect})` →
      `WebBrowser.openAuthSessionAsync` → complete the session from the `caminoapp://auth-callback`
      redirect (handles both PKCE code-exchange and implicit token setSession). Web path unchanged.
      `caminoapp://**` added to BOTH Supabase projects' redirect allowlists (prod + staging). No
      Google Cloud change needed (round-trips through Supabase's existing callback). Building iOS
      `24178b4c` (buildNumber 4) with this → TestFlight to verify on-device. Branch
      `native-google-signin`.
- [~] **Native dictation — implemented, on-device test pending.** Platform-split
      `hooks/useDictation` (web = browser SpeechRecognition, native = `expo-speech-recognition`,
      Metro picks `.native` so the web bundle never imports the native module). Mic button now
      shows + streams live transcription on iOS/Android. Config plugin adds mic + speech permission
      strings; iOS deploymentTarget pinned 16.4 (lib minimum). In build 5 (`3f6446a8`).
- [~] **Dynamic Island / safe-area — implemented, on-device test pending.** `SafeAreaProvider` at
      the root + `NavBar` pads by top/left/right insets so it clears the Dynamic Island / notch /
      status bar (reported on iPhone 17 Pro Max). Web insets are 0 → web unchanged. Dark status-bar
      style for the light UI. In build 5 (`3f6446a8`).
- [ ] **Store submission** — `eas submit` to App Store (needs Apple acct) + Google Play (one-time
      $25). App Store metadata / screenshots / privacy. Later, once builds are validated.

## 📥 Feedback backlog (captured 2026-07-01) — suggested order below

- [x] **B1a — Dev personas gated + staff flag (DONE 2026-07-01).** `core/env.ts` `showDevTools()`
      via `EXPO_PUBLIC_ENV` (production/staging, per EAS env) + `EXPO_PUBLIC_STAFF_USER_IDS` allowlist.
      Staff = the auth `user_id`s (NOT profiles.id — verified via SQL they differ): user
      `3a4001e8-…`, wife `e1c8f5e9-…`, set in the production EAS env. Verified live: hidden for
      non-staff on getcamino.app, **visible for signed-in staff on getcamino.app**, visible for all
      on staging.
- [x] **B1b — Lola intro (DONE 2026-07-01).** Interview landing now opens with an eyebrow
      ("YOUR ROAD TO SPAIN"), "Hola, I'm Lola," a warm experienced-companion line, and a quieter
      what-happens-next line. Verified live on prod + staging.
- [ ] **B9 — Lola text-to-speech (NEW).** Speak the intro + each question in a warm woman's voice
      with a medium Spanish accent speaking English, to make the app feel alive. Aligns with
      `docs/design/brand.md` "Spoken voice (TTS) — production direction". `expo-speech` (built-in)
      gives limited voice/accent control; a cloud TTS (ElevenLabs / Azure / Google) with a chosen
      Spanish-accented-English voice, cached + played via `expo-audio`, gives real warmth. Needs a
      voice/provider decision + likely a small server route to keep any TTS key server-side. Make it
      toggleable (accessibility + don't autoplay audio unexpectedly).


Recommended sequence (rationale in each item): **B1 quick UX/config wins → B7 analytics (time-
sensitive: capture family-testing funnel data now) → B4 scouting obligation → B5 E2E tests → B6
observability → B8 blog stub → B2 app icon (needs an asset decision).**

### Product / UX (quick–medium)
- [ ] **B1a — Hide dev test personas in production, keep in staging.** Currently the "Dev test
      personas" toggle in `app/interview.tsx` always renders. Gate it on environment via a new
      `EXPO_PUBLIC_ENV` (production vs staging), set per EAS environment + build profile + local
      `.env`. **Optional upgrade (user offered):** a *staff* feature flag — if the signed-in
      Supabase user id ∈ a STAFF_IDS allowlist (user + wife), show dev tools even in prod. Needs
      the two user ids. Plan: ship env-gate now; add staff override when ids provided.
- [ ] **B1b — Interview intro: establish Lola as an experienced companion before the chat.** The
      landing copy ("Hola, I'm Lola…") is easy to miss. Add a brief, uncluttered intro moment on
      `app/interview.tsx` (NOT in the chat box) — the road to Spain is easier with an experienced
      friend; her name is Lola — then start the interview. Keep it tight (invariant: no invented
      claims; Lola stays a guide, defers specifics to a gestor).
- [x] **B2 — App icon from the brand mark (DONE 2026-07-01).** White 8-pointed azulejo compass-star
      on a cobalt tile with an amber waypoint dot. `scripts/gen-icon.mjs` renders the full set from
      one SVG (`assets/images/icon-source.svg`): iOS/store icon (flattened opaque — Apple rejects
      alpha), Android adaptive foreground/background(cobalt)/monochrome, splash, favicon. User-approved
      preview (`docs/design/icon-preview.*`). Favicon live on web; icon in TestFlight **build 7**.
      Regenerate anytime with `node scripts/gen-icon.mjs`.

### Catalog / engine (medium)
- [ ] **B4 — "Where to live in Spain" scouting workstream (NEW obligation).** Many users don't know
      where they want to live. Add obligation(s): recommend a **scouting trip** and a framework for
      **evaluating regions/cities** (cost of living, climate, healthcare access, expat/English
      support, visa-relevant factors, schools, transport). Deterministic/engine-safe; source it
      (webinar/official) per SOURCING.md discipline. Likely gated early in the timeline (pre-visa).

### Infra / ops (large — before wider launch)
- [ ] **B5 — Automated end-to-end test suite (on-demand + on prod pushes).** We're spot-testing;
      time for real E2E. Cover: interview → extraction → plan generation for key personas;
      `/api/lola` contract; sign-in; living-plan re-model. Runs locally + in CI on deploy. Consider
      Playwright (web) + Maestro (native), and an engine-level deterministic test pass.
- [ ] **B6 — Observability: monitoring / alerting / paging (incl. mobile).** *Answer to "does Expo
      provide this?":* EAS gives build/deploy + basic hosting request logs, but **not** full
      APM/alerting/paging. Recommended stack: **Sentry** (crashes/errors, web + native via
      `@sentry/react-native`), a **uptime/health monitor + paging** (Better Stack / Grafana Cloud /
      Pingdom) hitting the site + `/api/lola`, and structured logs. Define health per major feature
      (interview, plan engine, Lola proxy, auth, DB).
- [ ] **B7 — Product analytics + conversion funnel (time-sensitive — instrument before more testing).**
      Funnel: home → interview start → interview complete → roadmap. Retention/reuse over days;
      feature-health: % returning to the roadmap, checking off items, using post-roadmap Lola to
      drive completion. Recommended: **PostHog** (funnels + retention + session, free tier, web via
      `posthog-js` + native via `posthog-react-native`). Privacy-respecting; no PII in events.

### Content (medium — stub now, refine later)
- [ ] **B8 — Hidden "how-i-was-built" blog at `/how-i-was-built`.** Unlisted route (direct link
      only; not in nav/sitemap). Narrative: started thin → expanded depth → refined UX → built real
      dev/staging/prod pipelines → chose the right SaaS tools → obsessed over customer experience;
      leadership lessons on why engineering leaders must adopt AI and keep skills current. Stub a
      v1 now; revise when the product matures.

## 🔜 Next (candidates, not yet started)
- [ ] **Re-anchor more anchors from actuals** — completing `empadronamiento`/`residencia` could feed
      `padron_done`/`residency_established`, so residency-relative items also go firm. Today only
      direct `relative_to_obligation` steps re-flow from a real completion date.
- [ ] **Capture `residency_established` as a known-later field** — let users update it post-move
      so residency-anchored items become firm instead of estimated. (Needs a post-move edit flow.)
- [ ] **Re-add backlog items once sourced** — `sworn-translation`, `convenio-especial`,
      `modelo-390`, `citizenship-jura` (see `core/OBLIGATIONS_BACKLOG.md`).
- [ ] **More webinars** (when available) — health insurance, schooling, banking detail — toward
      the ~100-obligation target.

## 🐞 Known issues

- _(none open — `tsc --noEmit` is green.)_

## Invariants (do not break — see ../camino/CLAUDE.md)

1. Engine is deterministic — no LLM in plan-building.
2. Interview is derived from the catalog (every `applies_if` field has a slot or derivation).
3. Lola never invents deadlines/costs/laws — hence the `source` field + SOURCING.md.
4. The plan is a pure function of the profile.
