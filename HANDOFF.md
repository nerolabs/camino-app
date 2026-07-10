# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

## ⭐ MORNING QUEUE — user + wife feedback, 2026-07-10 night (recorded, NOT yet actioned)

Six findings, with root causes pre-diagnosed where known:

1. **How-it-works still in the hamburger** — `components/NavBar.tsx:92` MenuLink → '/how-it-works'
   (now just redirects home). Remove the menu item. Trivial.
2. **Guide→interview context lost** — REGRESSION, cause known: the old `start()` passed
   `arrivedFrom` (from `/interview?from=<guide-id>`) into the LLM greeting; when per-question LLM
   phrasing was removed (2026-07-10), the personalization was dropped — `from` now feeds analytics
   only (see the comment in app/interview.tsx near useLocalSearchParams). FIX: deterministic
   template — when `from` is present, the greeting bubble gains a localized clause using the guide
   title (shortClause/displayTitle), e.g. "I see you've been reading about {guide} — your roadmap
   will cover that and everything around it." No LLM needed. ×5 locales.
3. **Voice defaults** — make voice OFF by default on web (toggle to enable). User leaning off-by-
   default on mobile too (chips made turns fast; TTS costs). Claude's take: default OFF everywhere,
   keep the toggle prominent — voice's remaining value is the composer questions + accessibility.
   Look in hooks/useLolaVoice(.native) for the default. Also kills the local ELEVENLABS log noise.
4. **Q1 copy** — "Let's start where you probably already are" doesn't land. User suggestion
   direction: "Very exciting — moving to Spain! Let's start with the most important question:
   when are you planning to arrive?" Keep "arrive" (the engine anchors on arrival date, not the
   move decision). Rewrite ×5 locales.
5. **Reactions degraded to bland** — cause known, twofold: (a) the tone-down (2026-07-10) capped
   phraseAck at ~10 words / "understated, never gushing"; (b) phraseAck NEVER receives the
   transcript (unlike phraseClarify), so it can't cross-reference earlier answers ("your wife AND
   the dog — the whole pack is coming!" / "Murcia — lovely, though the weather beats Canada's").
   FIX: pass transcriptOf(turns) into phraseAck + relax to 1–2 sentences, warm + playful,
   references earlier answers when natural; KEEP the no-facts/no-numbers hard rules (invariant 3).
   Slightly more input tokens per ack — fine.
6. **iOS roadmap sheet: "✕ Done" under the Dynamic Island** (IMG_2101, build 33) — the Phase-3
   Modal ignores the top safe-area inset. FIX: useSafeAreaInsets() padding on sheetWrap/sheetHeader
   in app/interview.tsx (same class as the build-5 safe-area work). Web unaffected; rides build 35.

After fixing: one web deploy + build 35 batch. Then the standing morning plan below (wife's full
pass, dashboard 808581 watch).

---

Last updated: 2026-07-10 night (SECOND release wave: landing v2 + wife-test batch LIVE on web at
b38ff3c; iOS build 34 submitting — supersedes 32/33). Highlights since the morning note: six
user-testing fixes (not-sure chips, reaction spacing, final open note, EMAIL MAGIC LINKS via
/auth/confirm token_hash flow + 24h OTP on both Supabase projects, snap-flush scroll, housing pair
merged); the "+N steps" pill promoted from the landing demo into the real interview; cobalt focus
ring on text fields (amber read as error); and LANDING V2 — home + how-it-works merged into one
scrolling story (variant C won a 4-way local lab; docs/LANDING-REDESIGN.md is the record;
landing_version: 2 stamped). Dashboard: PostHog 808581. Prior morning note follows.

Prior note — 2026-07-10 (RELEASED: living-roadmap redesign LIVE on production web at 23d917e —
6/6 public E2E green against the live site; e2e-ios gate green (run 29090864671, incl. the
rewritten interview flow); **iOS build 32** cut with --auto-submit (Build ID 3e45ab32, ASC
6786412055) — supersedes build 31 as the TestFlight/store candidate. v2 analytics flowing
(interview_version stamp); dashboard "Interview v2 — living roadmap" (PostHog 808581) holds the
v1 baseline (167→42→12; 60 clarifies). Next: wife-testing on TestFlight + prod web, then watch
the dashboard's before/after.

---

## ⭐ RESUME HERE (2026-07-10 evening — redesign COMPLETE on branch; next = merge → deploy)

**The full interview redesign is DONE and user-tested on the branch** (8 commits, 213 vitest green,
tsc clean, catalog audit clean). On top of the Phase 0–2 note below, this landed today:
- **Fresh-eyes audit** (user-requested): partner pair merged to one 3-chip question; knows_where_to_live
  folded into the region typeahead (now a derivation); ex-colony skipped when passports show it;
  employer question moved right after work; **income now gates two conservative advisory warnings**
  (`nlv/dnv-income-check`, band-UPPER vs household threshold — Sofia persona exercises it); dead
  `us_resident` removed; completeness weighting bug fixed (COMPUTE_ALSO_READS). Catalog 61→63.
- **Why-context copy pass**: every question opens with one sentence of why-it-matters, 5 locales,
  no digits (i18n lint), no legal claims (invariant 3). Q1 is now **arrival_date** ("Very exciting —
  moving to Spain! …when are you hoping to arrive?") — the question people arrive asking, and the
  timing anchor so later steps land pre-dated. speaks_spanish is Q2 (per-locale reader's-language
  framing; es handles native speakers).
- **Single-paint Lola turns**: reaction runs concurrently with extraction, raced vs a 2s cap on chip
  taps (typing dots cover it); the merged bubble paints ONCE — no post-paint mutation.
- **Phase 3 (mobile)**: <900px shows a strip under the nav — "Your roadmap · N steps [+N new] View ›"
  — opening a full-screen sheet (RoadmapPane `sheet` mode), same persistent highlights. Pure JS;
  needs the next batched EAS build to reach native.
- **Ops note:** a long-running Metro instance soured after ~30 core-file hot-reloads (requests
  accepted but hanging; looked like an extraction bug). After heavy batches: `expo start --clear`.

**RELEASE PATH (next):** (1) merge `interview-redesign` → main; (2) update the two public homework
pages (`app/how-i-was-built/log.tsx` + `roadmap.tsx`) — the standing rule, deferred to deploy time,
now due; (3) `npm run deploy:staging` (runs vitest + web E2E vs the unique URL); (4) user+wife verify
staging; (5) `npm run deploy:production` (web); (6) **iOS**: batched EAS build on user command only
(e2e-ios gate first — see docs/STORE_PAPERWORK.md; build 31 was the prior candidate, now superseded
by this redesign).

---

## Prior resume note (2026-07-10 morning — INTERVIEW REDESIGN Phase 0–2 on a branch)

**Big body of work, checkpointed on branch `interview-redesign` (NOT merged, NOT deployed).**
Motivated by PostHog on the soft-launch traffic: the interview funnel bounced hard — `work_situation`
was the worst question *and* it was Q2, median completion was **7.2 min vs the "3 min" promised**, and
**LinkedIn converted 0/17 while Reddit converted ~60%** of starters (intent mismatch — optimize for
Reddit-type traffic, not LinkedIn). Full analysis + the plan live in **`docs/INTERVIEW-REDESIGN.md`**.

**What shipped to the branch (all green: 206 vitest tests, `tsc` clean, `npm run audit` clean):**
- **Phase 0 — spine (pure, tested):** `core/plan-delta.ts` (`diffPlans` — the one primitive every
  living-roadmap surface renders from), `core/completeness.ts` (roadmap-anchored % complete, weighted
  by each slot's catalog leverage), `lib/interviewDraft.ts` (anonymous localStorage resume).
- **Phase 1 — chips + payoff:** `app/interview.tsx` rewritten — tap-chips for every yes/no & option
  slot (zero LLM, no spinner), "Other" reveals the text/voice composer (LLM extraction + Lola's
  contextual clarify kept). New `speaks_spanish` **opener** that adds a `language-classes` roadmap
  step on Q1 (advisory-only — **DELE stays passport-based**, do not wire self-report into it). Slots
  reordered (payoff first, sensitive last) via a new `order` field; `nextSlot` sorts by it. **All 21
  questions audited** for chip phrasing (no "X or Y" on a yes/no). `region` is now a **type-ahead
  dropdown** (17+2 comunidades + "Not sure" + type-a-city→extraction). Static localized copy for chip
  questions killed the per-question Haiku call (no more "still be" / "one last question" bugs).
- **Phase 2 — web two-pane live roadmap:** `components/RoadmapPane.tsx` — the roadmap grows as you
  answer, new steps highlight (via the Phase-0 delta). Progress reframed "Question N of ~12" → **"X%
  complete."** Web-only, ≥900px; narrow stays single-column.

**HOW TO TEST IN THE MORNING:** `npx expo start --web` → open `http://localhost:8100/interview` in a
**wide window (≥900px) to see the two-pane**. Chip taps are instant & offline; the composer questions
(nationalities, dates, "Other") call `/api/lola` (needs the `.env` key — present). Verified live: "None
yet" on Q1 → "Start learning Spanish" appears in the right pane, header ticks to "1 step · 2%".

**NEXT (in order):** (1) user tests Phase 0–2; (2) **Phase 3 = mobile "+N steps" delta treatment**
(same `diffPlans`, different skin; needs a batched native build); (3) **at DEPLOY time**, update the
two public homework pages (`app/how-i-was-built/log.tsx` + `roadmap.tsx`) — deliberately deferred
because the pages describe what's *live to users* and this isn't live yet.

**Known v1 simplifications (not bugs):** roadmap-pane removals recompute silently (no narrated "you're
EU, removed 2" yet); the new-step highlight is a fade, not a slide; `owns_property_in_spain` keeps its
"or" (own **or** plan to buy — intentional, both → Yes).

---

## Prior resume note (2026-07-06 — FIRST SOFT LAUNCH done; web-only; clean, encouraging night)

**We did the first public exposure: a soft launch (call-for-testers) to r/GoingToSpain**, web-only,
framed as a free non-commercial tool. Results before it came down: **~1.2K views, 1 positive
comment, TWO full funnel conversions (one English, one Spanish — `interview_started → completed →
roadmap_viewed`), zero user-facing errors.** The whole thesis worked end-to-end for real strangers,
in two languages. **The post was then AUTO-REMOVED by AutoModerator (~5h in) for "too many
reports"** — Reddit's self-promo/report-to-remove dynamic, NOT a content problem. **User has
messaged the mods for re-approval.**

**LESSON (now standing): DM the mods/admins for permission BEFORE posting** — mod pre-approval is
the only reliable immunity to report-removal. Next channels to try (all mod-permission-first),
leaning to friendlier/local given the removal: **city/local FB groups (user lives in JEREZ — the
local angle is the strongest, most authentic play)**, visa-specific FB groups (NLV/DNV/Beckham),
then r/SpainPersonalFinance, r/expats, expat forums, and the STRATEGY.md webinar-creator warm list
(partnership, not cold post). **A drafted local/Jerez post + a reusable mod-DM were offered, not yet
written** — pick up here if the user wants them.

**INFRA CHANGES THIS SESSION (live in prod):**
- **`LOLA_GLOBAL_PER_DAY` bumped 2000 → 25000** (EAS production env var, plaintext; was unset =
  code default 2000). Covers ~500 interviews/day of headroom; **provider spend caps remain the hard
  dollar backstop**. Deployed via `npm run deploy:production` (green post-deploy E2E). See
  [[lola-global-budget-25000]].
- **ElevenLabs 401 fixed:** `/api/tts` threw `ElevenLabs upstream 401` (CAMINO-7) — the free-tier
  gate on the Kate 2 **library voice**. User **upgraded the ElevenLabs plan**; Claude verified
  `/api/tts` now returns 200 audio and **resolved CAMINO-7** in Sentry. See [[elevenlabs-library-voice-401]].

**MONITORING:** an overnight Chrome-driven watch loop ran (Reddit + Sentry + PostHog) with headless
`curl` uptime fallback when the laptop closed. **Now stood down** (post removed = no traffic). The
standing safety net is Sentry's own cloud alerts (error email + 1-min uptime monitor → email) —
laptop-independent. Resume the loop only if a new post drives traffic.

**Otherwise unchanged from below:** build 31 is still the iOS public-submission candidate; the two
playbooks (`docs/ANDROID_LAUNCH.md`, `docs/STORE_PAPERWORK.md`) are the user-side critical path.

---

## Prior resume note (2026-07-05 — five languages LIVE + build 31 in TestFlight, DEVICE-VERIFIED)

**BUILD 31 SHIPPED + VERIFIED (2026-07-05):** e2e-ios gate green against pushed main (run
28747895451) → `production --auto-submit` → TestFlight (build number 31, App Version 1.0.0,
Build ID eb61c50e). **Device-verified by the user:** mid-interview language switch works
perfectly, all hamburger items work across all five languages, the English-only "How I was
built" page hides itself outside English. Build 31 is now the **public-submission candidate** —
the native release gate is fully closed. **API-hardening thread closed:** per-IP limiting confirmed
LIVE (real IPs land in the Supabase counter table), provider spend caps already set; Turnstile
stays a pre-public-launch task (TODO #20, now hardening-not-gap). **Two operator playbooks written
this session:** `docs/ANDROID_LAUNCH.md` (Play account + Redmi 13 + the 12-testers-×-14-days clock)
and `docs/STORE_PAPERWORK.md` (click-by-click App Store Connect submission). **Remaining
critical-path work is mostly USER-side now: store paperwork + screenshots + the two account/tester
tracks.**

---

## Prior resume note (2026-07-05 — five languages LIVE + build 30 in TestFlight; bug-fix pass done)

**getcamino.app is LIVE in five languages (en/es/fr/de/it)** and **iOS build 30** (all
languages) is on TestFlight, device-tested by the user + wife with **everything working** —
full Spanish interview, PDF, multi-language roadmap tasks on web and native. 157 vitest tests
(+10 opt-in). The localization arc (L0–L3) and a full bug-fix pass are complete; the codebase
is in a clean, well-tested state. **THIS SESSION'S FIXES (all live in production):**

1. **🔴 SILENT PRODUCTION DATA LOSS — profiles never saved for signed-in users (fixed).** The
   biggest find: the STAFF.md is_staff hardening left `authenticated` without `UPDATE(user_id)`,
   and PostgREST's upsert puts the conflict key in `ON CONFLICT DO UPDATE SET` → every signed-in
   save failed 42501, and `core/profileDb.ts` SWALLOWED the error → unnoticed for days. Only
   pre-hardening Google profiles survived (timing, not provider). Fix: `grant update (user_id)`
   on BOTH DBs (verified by throwaway-user probe: insert+update persist, is_staff still blocked);
   profileDb now `captureError`s on failure (5-test regression); `scripts/sql/profiles-grants.sql`
   + STAFF.md warning + memory [[profiles-upsert-grant-gotcha]]. **E2E was structurally blind —
   it asserts in-memory UI, not DB persistence.**
2. **Auth code email localized** (user-found: Italian UI → English code email). That email is
   sent by Supabase Auth, not our Resend pipeline. Fix: signInWithOtp always sends `data.lang`;
   both dashboard templates (magic-link + confirm-signup) rewritten with 5-language nil-safe
   branching (`printf "%v" .Data.lang`), pasted+verified on both projects (Claude drove Chrome).
   Subjects compacted to Supabase's 255-char cap. Source of truth: docs/design/supabase-auth-emails.md.
3. **Interview responds to mid-interview language switch** (was: required reload → lost progress).
   Chrome re-renders via useTranslation; now the CURRENT question also re-issues in the new
   language (translated static question, instant). Verified in-browser.
4. **"How I was built" hidden in non-English menus** (English-only page by decision). Web live;
   **native shows it until the next build** (build 30 predates this).
5. **German "Guides" anglicism → "Ratgeber"** across all de catalogs (fr "Guides" is correct
   French, kept; es/it already localized).
6. Earlier same session: welcome-once dedupe regression test; capture-flow users seed `lang`;
   e2e-ios run #10 green (flow-03 trim CI-verified); weekly-cron inspected (admin metadata
   MERGES — verified); HANDOFF history archived to docs/archive/.

**NEXT SESSION = THE APP-RELEASE PUSH** (nothing is blocking; the product is release-quality;
179 vitest tests + 10 opt-in; all work through dae56d4 pushed to origin/main).
- **(a) ✅ DONE 2026-07-05: Native build 31 shipped + device-verified** (see the RESUME block at
  top). e2e-ios green against pushed main → auto-submit → TestFlight → verified on device. It's
  the public-submission candidate. Next iOS step is the store paperwork (b), NOT another build.
- **(b) Store paperwork (TODO Phase 4)** — ASC fields, DSA trader status, screenshots (consider
  an es-ES localized listing now that L1 shipped).
- **(c) Android track (TODO Phase 3)** — user buys the test device + Play account → start the
  14-day closed-test clock (burns calendar time in parallel; English build is fine to start).
- **(d) Watch the first natural weekly cron** — Monday 2026-07-07 06:00 UTC; check the run's
  JSON output (roundups/nudges/skipped/errors). Localized emails ride it now.
- **(e) [USER] native-speaker passes** over live es/fr/de/it — corrections are pure data edits;
  the lint gates + snapshots re-verify each change.

**DONE this session (was next-session item (b)):** ✅ route-handler integration tests — every
API route (welcome/feedback/account-delete/unsubscribe/weekly) now covered; the audit's last
unit gap is closed. TEST-COVERAGE.md §1 updated.

## Current state (one paragraph — rewritten 2026-07-05 evening; history: docs/archive/)

Web is live at **getcamino.app** in **five languages** (en/es/fr/de/it — L0–L3 shipped
2026-07-05; native-speaker verification passes pending, user-side). iOS is at **TestFlight
build 30** (device-tested working by user + wife; carries all languages) — Apple + Google +
email sign-in all WORKING, dictation, Lola voice, universal links, PDF export, delete-account.
Signed-in **profiles now persist** (a grant bug silently blocked all saves until 2026-07-05 —
fixed on both DBs; see resume block). The catalog holds **63 obligations** (55 `official` with
`source_url` / 5 `recommendation`), invariant-2-audited (`npm run audit`, a deploy gate). The
email loop is live (welcome + weekly cron Mondays 06:00 UTC + one-click unsubscribe), localized
per `user_metadata.lang` (admin metadata updates MERGE — verified empirically); the Supabase
auth code emails are also localized (dashboard templates, 5-language). Quality gates: **157
vitest tests + 10 opt-in** on every push; Playwright (12) + API contract (10) on every staging
deploy, 6 public on production deploys; 3 Maestro flows on big builds (run #10 green, pinned
Maestro 2.6.1). Android is a launch platform (Play closed-test clock not yet started —
user-side). Next phases: TODO.md → store paperwork (4), submissions (5).

## Where things live

- `docs/THESIS.md` — the thesis + four invariants. Do not break them.
- `docs/STAFF.md` — the `profiles.is_staff` DB flag (gates dev personas + webinar links).
- `docs/MONITORING.md` — Sentry setup (web + server + native), uptime monitor.
- `docs/APP_STORE.md` — submission pack + the provisioning/entitlement playbook (why profiles
  must be re-minted when a capability changes — learned the hard way on builds 12–15).
- `core/engine-controller.ts` — **the deterministic engine + 63-obligation CATALOG.**
  `buildPlan(profile)` = filter by `applies_if` → topoSort by `depends_on` → resolve timing →
  bucket phases. `isOverdue(o, today?)` = scheduled + past date-level due + not done (due-today
  gets grace). Completing `residencia`/`empadronamiento` back-fills anchors so downstream dates
  go firm. Every obligation carries `source`, optionally `source_url` + `webinar_url`.
- `core/interview-controller.ts` — slots → derivations → `nextSlot`. Key derivations: `visa_type`,
  `is_eu`, `is_ex_colony_national`, `is_spanish_speaking_national` (DELE exemption, ≠ ex-colony),
  `wants_citizenship`, `knows_where_to_live`.
- `core/email-digest.ts` — **pure weekly-roundup digest** (feeds the email, mirrors the roadmap):
  overdue-first, ≤5 items, 45-day window, deterministic per-category tips, `null` when nothing
  pressing (no spam). `interviewComplete(profile)` gates roundup vs nudge.
- `core/catalog-audit.ts` + `scripts/audit-catalog.ts` — **invariant 2, enforced.** Deploy-gated.
- `core/guide-content.ts` + `app/guide/{index,[id]}.tsx` — **the 60 public guide pages**, pure
  functions of the catalog (timing RULE in words, blurbs, prerequisite links, category tip, CTA).
  `app/sitemap.xml+api.ts` generates the sitemap from the same catalog.
- `core/test-personas.ts` — 9 staff personas, each documenting the branch it tests.
- `app/api/lola+api.ts`, `app/api/tts+api.ts` — server proxies (Anthropic / ElevenLabs).
- `app/api/email/{welcome,weekly,unsubscribe}+api.ts` — **email routes** (Workers runtime, Web
  APIs only). welcome = token-verified, once-ever (dedupe via `welcomed_at` auth metadata).
  weekly = `CRON_SECRET`-gated; roundups + one-time interview nudges; RFC-8058 List-Unsubscribe.
  unsubscribe = HMAC one-click, no session. **All bookkeeping in auth user metadata** (`welcomed_at`
  / `nudged_at` / `last_roundup_at` / `weekly_optout` / `pending_profile`) — no schema migration.
- `lib/serverEmail.ts` (Resend HTTP), `lib/emailTemplates.ts` (hand-rolled inline-style HTML for
  welcome/roundup/nudge), `lib/emailTokens.ts` (Web-Crypto HMAC unsubscribe tokens).
- `components/EmailSignIn.tsx` — shared passwordless flow (email → link sent → one-time-code fallback),
  used by both sign-in dialogs + the plan page's "email me my roadmap" card.
- `components/SignInButtons.{tsx,native.tsx}` — "Sign in" → dialog. Web: Google + email. Native:
  Apple (official button, guideline 4.8) + Google + email. Failures now Alert + log (no silent catch).
- `components/NavBar.tsx` — width-split: ≥768px full bar; <768px logo + Sign-in + CTA + ☰ (browse
  links in the menu; future SEO sections slot here too).
- `.github/workflows/weekly-email.yml` — Mondays 06:00 UTC + manual dispatch → POST /api/email/weekly.
- `app/_layout.tsx` — root providers + `SessionSync` (loads profile + `is_staff`; adopts
  `pending_profile` from "email me my roadmap" on first sign-in; fires the welcome email once).
- `app/plan.tsx` — roadmap. Overdue red treatment; signed-out "email me my roadmap" card; step
  sheet with source pills + "what changed" re-plan flow.
- `app/how-i-was-built/{index,log,roadmap}.tsx` — the 3 unlisted "homework" pages (robots-disallowed).
- `scripts/deploy.sh` — env-pull → **catalog audit** → cache-cleared export → deploy.

## Commands

- `npm run audit` — catalog↔interview contract + personas (after ANY catalog/slot change).
- `npm test` — deterministic engine + email-digest suite (vitest; deploy gate + CI).
- `npm run test:api` / `test:e2e` — API contract / Playwright smoke vs staging (opt-in, network).
- `npm run typecheck` — tsc, strict.
- `npm run deploy:staging` / `deploy:production` — web deploys (gated on audit + tests).
- iOS: `npx eas-cli build --platform ios --profile production --auto-submit --non-interactive`
  (needs EXPO_TOKEN + ASC key env vars from `~/.zshrc`). **autoIncrement burns build numbers on
  failed builds** — that's why we're at 17.

## Guardrails

- The four invariants in `docs/THESIS.md`. Engine stays deterministic; the catalog is data.
- **Claude never handles secrets** (API keys, tokens, passwords) — user sets those in EAS /
  dashboards. Public identifiers (PostHog key, Sentry DSN, Supabase anon key) are fine.
- **EAS env visibility gotcha:** web API routes only receive **Plain-text + Sensitive** vars
  (via `eas env:pull` in deploy.sh). **`secret`-visibility vars arrive EMPTY** — always use
  `sensitive` for anything a server route reads. Secret is only for EAS Build (native).
- **Standing rule (CLAUDE.md):** every PR/release batch updates BOTH homework pages —
  `app/how-i-was-built/log.tsx` (a build-log row) and `app/how-i-was-built/roadmap.tsx` (move
  items, bump `UPDATED`). Source of truth = TODO.md's roadmap.
- Expo SDK 56 pinned — check https://docs.expo.dev/versions/v56.0.0/ before Expo API work.
- Verify before claiming: deploys checked live (curl/browser), engine changes get a persona run,
  TestFlight builds get on-device confirmation from the user.

## What's next

**Canonical priority order = TODO.md → "🎯 THE SEQUENCED BACKLOG" (full audit 2026-07-04).**
Six phases: (1) verify what's built — build 27 on user command, device verification, family
testing (THE release gate), source-link QA; (2) hardening — API volume-limiting (site is now
public+indexed; overdue), Maestro/authed E2E, a11y round 2; (3) store paperwork — legal entity
swap (hard gate), ASC fields, screenshots, bus-factor hour; (4) submission; (5) growth —
region specifics content pass, regulatory changelog, SEO expansion, share links, launch
moment; (6) the tail — Android, localization, monetization. Immediate next action: **user
kicks build 27**, then Phase 1 verification.
