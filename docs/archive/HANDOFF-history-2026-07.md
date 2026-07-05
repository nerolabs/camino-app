# HANDOFF archive — session history 2026-07-03 → 2026-07-05 (moved out of HANDOFF.md 2026-07-05)

Historical session blocks, preserved verbatim. HANDOFF.md keeps only the current resume +
evergreen sections; consult this file (and git history) for how past decisions unfolded.

## Earlier resume (2026-07-04 — all three pre-release features SHIPPED; builds only on user command)

**Latest:** the "This week" view SHIPPED (toggle on /plan, `core/this-week.ts`, 4 tests) and the
user's first family-testing round found 3 bugs. Two fixed + shipped in **iOS build 19**
(`bf2e2d70`, auto-submitting to TestFlight; web already deployed):
1. **OTP length**: Supabase emails an 8-digit code; the app said 6 and `maxLength={6}` truncated
   it → verification could never succeed. EmailSignIn now takes up to 10 digits; all copy says
   "one-time code". Never hardcode the provider's format.
2. **Step drawer unscrollable on iOS**: the sheet's ScrollView was wrapped in a Pressable, which
   claimed the drag gesture. Backdrop is now an absolute-fill Pressable BEHIND a plain-View
   sheet. (Pattern note: never wrap a native ScrollView in a touchable.)
3. **Apple sign-in — SOLVED 2026-07-03 ~21:45.** Root cause: **stale SIWA provisioning on
   Apple's servers for the App ID** (every checkable layer was verified correct: entitlement in
   the signed IPA, App ID capability/primary, fresh profiles, Supabase provider, agreements,
   service status; the user's 2FA was fine — SIWA worked in other apps). Remedy: capability
   toggled OFF → saved → re-enabled as primary → saved (~21:33), forcing Apple to re-provision.
   **Proof it was server-side: build 19 — cut BEFORE the toggle — started working minutes
   after it.** Build 20 failed once then worked (propagation settling). Expect reliable within
   the hour. Playbook lesson recorded in the build log: when every layer verifies correct,
   re-provision before you rewrite.

4. **Guides alert on native** (build-19 finding): expo-router/head on iOS is the Apple Handoff
   integration and alerts without an `origin` config. Head is now a platform-split
   `components/SeoHead` (web re-exports it, native renders nothing). Fixed in build 21.

5. **Batch of user requests (2026-07-03 late):** /how-i-was-built is PUBLIC (robots un-gated,
   in the sitemap (67 URLs) and the nav menu as "How I was built"); every roadmap/log entry
   now carries its ship date (derived from git history — the whole product is 30 Jun → 3 Jul);
   and **universal links**: `ios.associatedDomains: ['applinks:getcamino.app']` +
   `public/.well-known/apple-app-site-association` (served, content-type application/json,
   paths /plan /interview /guide*) so email links open the APP signed-in instead of a
   logged-out browser tab (the reported bug; magic links on desktop already worked).
   Universal links ship in **BUILD 22** — Apple caches the AASA per install, so it takes a
   fresh install of 22+ to activate. Drawer-scroll fix confirmed by user on build 20.

6. **PDF export + feedback + iPad off (2026-07-03 latest, BUILD 23):** the printable roadmap
   (`lib/reportHtml.ts` pure generator + `lib/exportPdf` platform twins, "⤓ PDF" on /plan,
   4 tests); "Report a problem" in the menu (`components/FeedbackDialog` → `/api/feedback` →
   Resend to nerolabs@gmail.com with platform/version/route; VERIFIED end-to-end — test email
   received); `supportsTablet: false` (user decision — no iPad for v1). **Family testing
   should use build 23** (supersedes 22; also carries universal links etc.).
   Remaining pre-release feature: **region-aware steps** (region slot) ← NEXT.

7. **Polish pass DONE (2026-07-03 night)** — SEO meta on every public page (home/how-it-works/
   sample-plan/homework trio; only guides had it), how-it-works gained the missing CTA + weekly-
   email/guides mentions + shared Footer, home strip links to /guide, shared `lib/useWide.ts`
   breakpoint hook, deploy.sh strips iCloud conflict-copy dirs (one deploy shipped stale pages;
   verify a content marker after deploys — ON THE UNIQUE DEPLOYMENT URL (always fresh); the staging/production alias + custom domain lag behind on CDN edges (minutes to ~1h), and query-string cache-busting is unreliable).
   **Tomorrow's push — REORDERED by the 2026-07-03 multi-stakeholder review
   (docs/STRATEGY.md, read it):**
   1. **Legal surfaces FIRST (TODO item 6)** — in-app account deletion (Apple 5.1.1(v)
      HARD BLOCKER for submission) + privacy policy (+ URL into ASC) + ToS + aviso legal +
      PostHog cookieless/consent decision.
   2. Polish backlog (TODO item 7): share cards → guide JSON-LD → curated guide prose →
      context CTAs → a11y sweep.
   3. Region-aware steps (last pre-release feature).
   Growth/uniqueness queue = TODO item 9 (top pick: the public regulatory changelog);
   business/PR/personal ops = TODO item 10 (user-side: gestor consult, trademark search,
   bus-factor hour, DSA trader status).
   **User is testing web + the latest build in the morning and will file a big bug report.**

8. **Overnight incident (2026-07-04 ~00:30): builds 22/23 NEVER BUILT — test BUILD 24.**
   Both ERRORED in Xcode: the provisioning profile lacked the **Associated Domains**
   capability/entitlement (added for universal links in build 22's config). EAS didn't
   re-sync because the profile was still VALID — the docs/APP_STORE.md lesson again:
   **a capability change requires enabling it on the App ID (invalidating the profile) so
   EAS re-mints.** Their submissions auto-canceled (that's why TestFlight sat at 21).
   Fix applied: Associated Domains enabled on the App ID (dev portal), **build 24** kicked;
   verified from the signed IPA: BOTH entitlements present (applesignin + associated-domains
   applinks:getcamino.app), profile minted 22:30Z; submission 6cf5ed94 uploading to
   TestFlight at last check. **Playbook: when adding ANY capability to app.config, flip it
   on the App ID first (or expect the next build to fail and re-mint).**

9. **2026-07-04 daytime:** new Lola voice (ELEVENLABS_VOICE_ID in both EAS envs, server-side —
   live everywhere, no build) + speakable passport question. **Family-testing round two fixed**
   (feedback grace-timeout, keyboard-aware sheets/dialogs, honest no-op re-plan + extractor
   guardrail, Dynamic-Type-proof nav — lesson: test with large accessibility text). **BUILD 25**
   kicked with all of it (user request — Cristina blocked on the nav). **Curated guide prose
   SHIPPED**: `core/guide-prose.ts` (60 explainers, Camino voice) + `tests/guide-prose.test.ts`
   **digit-lint** (prose digits ⊆ title digits — invariant 3 as a build gate; it caught its
   first violation pre-ship) + prose-first meta descriptions (template fallback when the first
   sentence references "the title"). Remaining from polish backlog: share cards, guide JSON-LD,
   context CTAs, a11y sweep. Legal surfaces (TODO 6) still FIRST for the store push.

10. **2026-07-04 evening — pre-release feature set COMPLETE.** In ship order:
    **Legal surfaces** (TODO 6): privacy/terms/aviso-legal pages + footer links, PostHog
    cookieless (`persistence:'memory'` + legacy `ph_*` scrub — no cookie banner needed, by
    design), and **delete-my-account** (menu → `/api/account/delete`, hard delete, E2E-verified
    with a throwaway account) — Apple 5.1.1(v) unblocked. ⚠️ Operator identity (Proxim.us /
    nerolabs@gmail.com) is **TEMPORARY**: user will create a real legal entity + @getcamino.app
    email — replace across privacy/terms/aviso, feedback inbox, ASC **before store publish**
    (TODO 6b, pre-submission gate). **BUILD 26** cut before that (Cristina round 3:
    conversational clarify fallback in the interview, deterministic date normalization
    (`lib/dateInput.ts`) with live preview, clearer "on a date" copy). Her volume bug SURVIVED
    build 26's first fix; real cause found after: expo-speech-recognition leaves the iOS audio
    session in "measurement" mode and never deactivates it → `hooks/useDictation.native.ts` now
    sets a proper session category and releases the session on stop/end/error — **rides the next
    build, UNVERIFIED on device**. **Polish batch** (TODO 7, all shipped): OG/Twitter share
    cards, JSON-LD everywhere, context-carrying CTAs (guide → interview greeting), a11y round 1,
    build-log newest-first, Sample plan always in the menu. **Region-aware steps v1 SHIPPED**
    (`4add0da` — the last pre-release feature; region slot in the interview, `regional` flags
    through plan/guides/report). Then a design pass: **how-it-works** content now sits in the
    standard centered 760px column (was full-bleed) and the homework "roadmap" page is renamed
    **"the product roadmap"** (vs. the roadmap the product builds for users).
    **⚠️ EAS BUILDS NOW ONLY ON USER COMMAND** (free-tier credits low — user directive).
    **Build 27 batch waiting:** volume fix v2 (needs device verification), delete-my-account in
    the native menu, region slot, everything since build 26.

11. **2026-07-04 (later) — BUILD 27 + source-link QA + THE REBRAND.** Build 27 FINISHED &
    auto-submitted to TestFlight (5c4d86b6; carries volume fix v2 UNVERIFIED, native
    delete-account, region question, PDF margins, keyboard sheets — the user's heavy-testing
    build). Backlog fully audited → TODO.md "🎯 THE SEQUENCED BACKLOG" is now the canonical
    order. Phase-1 #4 DONE: all 55 source links click-tested, 2 fixed (empadronamiento → BOE
    Ley 7/1985; nie → interior.gob.es canonical page — policia.es cookie-walls real browsers;
    notes in SOURCING.md). **BRAND RENAMED (user decision): "Get Camino"**, extended
    **"Get Camino: Your Road to Spain"** (= exactly 30 chars, fits ASC) — trademark-risk
    mitigation; ~100 user-facing strings + share card + ASC drafts + Supabase-template doc
    updated; **identifiers unchanged** (slug camino, scheme caminoapp, bundle
    com.nerolabs.camino). Native-visible bits (icon label, permission strings, in-app copy)
    ride **build 28**. STILL SAYING "Camino": the live Supabase auth-email templates (both
    dashboards — copy ready in docs/design/supabase-auth-emails.md) and the ASC display name
    (user-side).

12. **2026-07-04 (night) — BUILD 28 + @getcamino.app mailboxes + API volume-limiting SHIPPED.**
    Build 28 FINISHED → TestFlight (rebrand strings + voice turn-taking + answer-box clearing;
    user confirmed TTS/mic "finally working correctly"). Product emails moved off the personal
    inbox (Workspace + alias routing): feedback@ / privacy@ / legal@getcamino.app — delivery
    E2E-confirmed. **Sequenced-backlog #5 DONE:** durable Supabase rate limiting
    (`scripts/sql/api-counters.sql` on BOTH DBs, `lib/apiGuard.ts`, wired into lola/tts after
    validation; fail-open) + strict CORS OPTIONS handlers. Empirics that matter: EAS rewrites
    `Origin` to our own hostname (allowlist can never see foreign origins); in-memory counters
    don't survive isolate churn (70-burst → zero 429s); the runtime DOES forward the client IP;
    the durable per-IP limit trips at exactly limit+1 (tts: 20×200 then 5×429, verified
    staging + production). User-side layer: Anthropic spend cap + ElevenLabs quota
    (directions given). Turnstile deliberately deferred to the pre-launch-moment.

13. **2026-07-04 (late) — E2E SUITE LIVE + family-testing round 5 fixed.** Backlog #6 A+B
    executed (user-approved, GitHub-runner path): authed Playwright GREEN (12/12 vs staging;
    seed `scripts/e2e/seed.mjs` staging-guarded; sessions via generateLink→verifyOtp→
    storageState; suite's first catch = NavBar hydration #418, fixed with useWide); Maestro
    flows + e2e-ios.yml written — **needs 3 user-set repo secrets (EXPO_TOKEN,
    E2E_SUPABASE_URL, E2E_SUPABASE_SERVICE_ROLE_KEY) then dispatch + CI iteration** (no local
    simulator). Round-5 fixes (web live; native rides BUILD 29): /plan eternal
    "Loading your roadmap…" → profileLoaded settlement + redirect home (grace 1.5s / failsafe
    10s); interview spinner TTL (35s askAnthropic abort + own-it retry turn, static-question
    fallbacks); mic clipping BOTH ends (listening cue on real 'start' event; stop() keeps the
    final flush, new cancel() discards it on send); composer auto-grows again (multiline +
    measured height, Enter still sends). A11y round 2 shipped (focus-visible ring).
    **Build 29 retest list:** mic first/last words at normal pace, box grows while dictating,
    cold-start lands home when no roadmap, spinner never exceeds ~35s.

**ALSO SPOTTED in ASC (App Store release prep):** the DSA **trader status** must be completed
(ASC → Business banner) or EU distribution is blocked — Spain IS the market. Add to the
submission checklist (user action, needs their trader info).

---

## Earlier (2026-07-03 evening — guides LIVE, build 18 in TestFlight)

**Batch 2 of today (after the email loop below): the 60 SEO guide pages are LIVE on production**
(`/guide` index + `/guide/<id>` ×60, prerendered titles/descriptions/canonicals, `/sitemap.xml`
(64 URLs, generated from the catalog), robots Sitemap line, "Guides" in the nav menu). The nav
also unified: ONE hamburger at every width (user decision), Sign out inside the menu. **iOS
build 18 built + auto-submitted to TestFlight** (commit `d33d7bb`, finished 18:42Z) — it carries
native email sign-in, the nav, and the Apple diagnostics. **User still needs to device-test it.**

### Apple sign-in investigation — CLOSED on our side (2026-07-03)
Definitive: **build 17's signed IPA contains `com.apple.developer.applesignin` = [Default]**
(verified by downloading the EAS artifact and running `codesign -d --entitlements`). App-ID
capability ✓ (ASC API), fresh profile ✓, Supabase Apple provider ✓ (re-confirmed in dashboard:
Enabled, Client IDs = `com.nerolabs.camino`), client code ✓ (textbook signInAsync →
signInWithIdToken). Everything on our side is correct → the "unknown reason" sheet rejection is
Apple-side. **On-device next steps (user):** on build 18, confirm the Apple ID has 2FA enabled
(hard requirement for Sign in with Apple), retry, and if still failing try a SECOND Apple ID to
rule out account-specific state. If a second ID works, it's the account; if not, wait out
capability propagation and retry in a day.

### Also fixed this batch
- **CI flake**: the determinism test's two buildPlan calls could straddle a millisecond tick
  (dates differ by 1ms) — the test now freezes the clock (`vi.setSystemTime`). CI green since.
- `shortClause()` (guide titles): titles with an em-dash inside a parenthetical would truncate
  to an unbalanced "(" — now cuts back to before the parenthetical.

---

## Earlier today (2026-07-03 — email loop is LIVE)

**The email loop is live and verified end-to-end in production.** User added the 3 secrets to
EAS as `sensitive` (prod + preview), both envs redeployed, routes flipped 501 → 401. Live test:
forced weekly run via the GitHub Actions `workflow_dispatch` (run #1, green) → 200 with
`{roundups:0, nudges:2, skipped:1, errors:0, users:3}`; nudge + welcome received, styled
correctly, in a real Gmail inbox. Welcome fired on a real Google sign-in at getcamino.app
(account andrewnedmond@gmail.com), and a page reload after the fix sent nothing (dedupe holds).

### Two bugs the live test caught (both FIXED + redeployed both envs)
1. **Email links leaked the per-deploy origin** (`camino--<id>.expo.app` instead of
   getcamino.app): behind EAS Hosting's custom domain, `request.url` carries the internal
   deploy host. Fix: `siteOrigin()` in `lib/serverEmail.ts` — canonical origin per
   `EXPO_PUBLIC_ENV` (production → getcamino.app, staging → camino--staging.expo.app, dev →
   request origin). Never build user-facing links from the request URL.
2. **Welcome email sent 3× on one sign-in.** Two stacked races: the client effect keyed on the
   `user` OBJECT re-fired per auth event (INITIAL_SESSION / SIGNED_IN / USER_UPDATED from the
   pending_profile clear), and the server checked `welcomed_at` before sending, non-atomically.
   Fix: module-level once-per-user guard + effect keyed on `user?.id` (`app/_layout.tsx`);
   server now CLAIMS `welcomed_at` before the send and rolls back if Resend fails
   (`app/api/email/welcome+api.ts`).

### Gotchas learned this batch
- **`eas-cli deploy` can print "deploy command failed" (ECONNRESET) yet exit 0** — deploy.sh's
  `set -e` won't catch it. If a deploy looks odd, check the dashboard/deployment URL; rerun.
- Gmail-API readers may double-decode quoted-printable (`uid=3a…` renders as `uid:…`) — the
  emails themselves are fine; check the raw source before "fixing" links.

### Still open on email (tiny)
- nerolabs@gmail.com wasn't directly testable (not signed into Chrome); tested with the user's
  andrewnedmond@gmail.com account instead. The weekly run's `skipped:1` is expected (account
  under 24h old, or nothing pressing).
- Production's two auth templates were styled by hand in a previous session and could NOT be
  read back (extension DLP blocks the template body; plus a Supabase dashboard incident). The
  repo now has canonical versions at `docs/design/supabase-auth-emails.md` — staging runs
  exactly those; production's are the same style but may differ in wording. Optionally paste
  the repo versions into production for exact parity.

### Env/dashboard state (don't redo)
- EAS envs: RESEND_API_KEY / SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET present as **sensitive**
  in BOTH production and preview. GitHub repo secret CRON_SECRET matches.
- **Staging Supabase SMTP: DONE 2026-07-03** (smtp.resend.com:465, user `resend`, sender
  lola@getcamino.app "Lola from Camino"; key pasted by user). Both auth templates styled from
  `docs/design/supabase-auth-emails.md` and verified live: a real magic-link request from
  camino--staging.expo.app delivered the branded email to a real inbox.
- **Resend**: `getcamino.app` domain **verified** (eu-west-1). Free plan (1 domain, 2 req/s —
  `serverEmail`/`weekly` already spaced for it).
- **Production Supabase** (`oftrpaleqtmuvolwsocd`): custom SMTP **ON** (host `smtp.resend.com`,
  port 465, user `resend`, sender `lola@getcamino.app` / "Lola from Camino"; password = Resend
  key, pasted by user). Auth email templates **styled + saved**: Magic-link/OTP and Confirm-signup
  (Camino brand, button + one-time `{{ .Token }}` code for cross-device). Redirect allowlist already
  covers `getcamino.app/**` + `caminoapp://**`.
- **Staging Supabase** (`gsnsgfobfswazqhfcstx`): redirect allowlist OK. Custom SMTP **ON** +
  both auth templates styled (2026-07-03; source of truth `docs/design/supabase-auth-emails.md`).
- GitHub `CRON_SECRET` repo secret: **set by user** (via the browser form I opened).

### Verify-clean checklist for the new session
- Working tree clean. `npm test` → 26 passed / 7 skipped. `npm run audit` → 0 warnings, 9 personas.
- Live spot-checks: `/guide` + `/guide/nie` → 200; `/sitemap.xml` → 64 `<loc>` entries;
  POST `/api/email/weekly` without bearer → 401. CI (GitHub Actions) green on the last push.

---
