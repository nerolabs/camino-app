# Camino — TODO / status tracker

Living list of what we're tracking against. Update as work moves. **Everything currently
actionable lives above the fold; the done/historical record is below it** (reorganized
2026-07-12, user request). See `HANDOFF.md` for the fuller picture and `core/SOURCING.md`
for obligation provenance.

Last updated: 2026-07-12 (**SUBMISSION DAY** — runbook: `docs/testing/2026-07-12-submission-day.md`).
**Build 36 = the submission candidate** (TestFlight, auto-submitted overnight; voice/TTS fully
retired, mic dictation stays, /contact shipped). ASC paperwork DONE except the trader
declaration (Apple identity case open — submission proceeds, EU/Spain distribution waits).
Done this morning: ElevenLabs plan cancelled + `ELEVENLABS_*` EAS vars deleted; ASC review
notes updated live (dictation-only voice bullet); `docs/PROVIDERS.md` written (the SaaS
account map + contact-migration plan).

## 🔒 Security — TOP PRIORITY (standing)

- [ ] **Verify no secrets are ever committed to the (public) GitHub repo.** Re-check before every
      push and before sharing the repo. Standing guarantees: `.env` is gitignored; the Anthropic
      key now lives server-side only (`app/api/lola+api.ts`). Quick audit:
      `git ls-files | grep -iE '(^|/)\.env'` → empty, and `git grep -I 'sk-ant-' HEAD` → no matches.
      **Last audited 2026-07-04: CLEAN** — no `.env` tracked; no `sk-ant-`, Resend-key (`re_…`) or
      JWT patterns in any tracked file (TODO.md's own audit-command text self-matches, benign;
      `SUPABASE_SERVICE_ROLE_KEY` appears only as `process.env` reads in API routes). Supabase
      URL/anon key remain the only `EXPO_PUBLIC_` values (public-safe under RLS).

## 📍 NOW — submission day queue (2026-07-12)

1. [ ] **Build 36 device verify** (no voice anywhere, mic glyph, countdown ending, contact
       page, Dynamic-Island + language-switch regression checks) — runbook Part 1.
2. [x] **DONE 2026-07-12** — interview screenshot retaken on build 36, re-framed, and
       uploaded to ASC by the user (replaced the voice-pill shot).
3. [ ] **Cristina fresh-eyes round** (runbook Part 2; polish findings = build 37, don't hold).
4. [ ] **Trader case check → attach build 36 → final page read → Add for Review.**
       Manual release parks approval until the launch moment; expect one rejection cycle.
5. [ ] After: watch ASC status (24–48h typical); PostHog 808581 (interview-v2 funnel +
       the new `contact_sent`).
6. [ ] **[USER] docs/PROVIDERS.md migration checklist** — route all billing/notification
       email to andrew@getcamino.app (Namecheap first; Apple only AFTER the trader case).

**Moved up for today (user, 2026-07-12):**

7. [x] **DONE 2026-07-12** — git identity set globally: Andrew Edmond
       <andrew@getcamino.app>. (If GitHub doesn't show these commits as yours, add
       andrew@getcamino.app to github.com → Settings → Emails.)
8. [x] **DONE 2026-07-12** — consulate title neutralized ("wait times vary widely by
       consulate") across title ×5, guide prose ×5, SOURCING.md note; the dead US-only
       ConsulateBanner (gated on the deleted `us_resident` slot) removed from /plan +
       its string ×5.
9. [x] **DONE 2026-07-12** — final-note distillation: `distillFinalNote` (shared
       plan-coach extractor, typed fields only, fail-open) runs at interview finish;
       roadmap updates + pills stamp before the countdown; `interview_note_distilled`
       event. +4 plan-coach tests.
10. [x] **DONE 2026-07-12** — removals narrated: "−N steps — simpler for you" pill under
       the answer + strip counter, ×5 locales, deterministic from the same plan delta.

## 🧹 Fresh-eyes findings queue (2026-07-11/12 audit — none block submission)

- [x] ~~"Takes about 3 minutes" claim~~ — **RESOLVED 2026-07-12 (user decision):** the v2 chip
      interview takes ~3 min in the user's own runs; not a concern now. Moved to the
      post-launch health checklist below (median AND average, TODO only if materially off).
- [x] **contact.tsx version field — FIXED 2026-07-12**: `Constants.nativeBuildVersion`
      (reads the built Info.plist; null on web). Rides build 37 / next web deploy.
- [x] **contact.tsx email prefill — FIXED 2026-07-12**: effect fills the field from
      late-loading auth, only while untouched. Rides build 37 / next web deploy.
- [x] ~~Interview countdown~~ — **ACCEPTED AS-IS 2026-07-12 (user decision):** very edge case;
      not worth the code.
- [x] **/api/feedback volume limit — DONE 2026-07-12**: `volumeGuard('feedback')` after
      validation (5/min per IP, 200/day global; `FEEDBACK_*` env overrides) + strict-CORS
      OPTIONS, same posture as /api/lola. +2 route tests (429 path; guard-after-validation).
- [x] **Privacy copy vs analytics reality — FIXED 2026-07-12**: the Technical bullet now
      says some interview events include answer text (EN+ES, page date bumped). Kept the
      capture — it feeds the interview-quality dashboard and chip refinement.
- [x] ~~git config user.email~~ — moved up to today's queue (item 7 above).

## 📈 Post-launch product health checklist (start once the app is live)

- [ ] **Interview duration vs the "about 3 minutes" promise** — median AND average
      (PostHog 808581, v2 events only). User-measured ~3 min on 2026-07-12, so the copy
      stands; if real-user data comes back materially different, open a TODO and change
      the landing + screenshot copy (invariant: never trade truth for comfort).
- [ ] The dashboard-watch items in the 2026-07-10 follow-ups below (funnel by question,
      clarify rate, Other usage, magic-link health) graduate into this checklist at launch.

## 🎯 THE OPEN BACKLOG (item numbers preserved — docs and memories reference them)

**Standing (every batch):** security audit (§ above) · homework pages per release
(`app/how-i-was-built/{log,roadmap}.tsx`) · keep `docs/TEST-COVERAGE.md` current ·
STRATEGY.md backtest · EAS builds only on user command · i18n lint gates · web E2E
auto-runs on every deploy (deploy.sh gate) · every bug that reaches a person earns a
regression test. Current suites: 216 vitest (+7 skipped) · 8 public + 12 authed
Playwright · 7 API contract · 3 Maestro flows (pinned 2.6.1).

### Localization — verification tail (Phase 2)

5. [ ] **[USER/Cristina] verification passes over the LIVE production es surface** — the
   human gate (shipped at ~95% by decision 2026-07-05); then fr/de/it native-speaker passes
   as people are available. Corrections are pure data edits; the lint gates + frozen
   snapshots re-verify every change.

### Phase 3 — Android track (user-side; the 14-day clock burns in parallel)

8. [ ] **[USER] Buy the test device** (~$100–250: Moto G Play new / Galaxy A16 / refurb
   Pixel 7a — Play-certified, Android 14+).
9. [ ] **Play developer account** (personal, $25 — sole-prop decision) + first Android build
   (verify the old preview APK on-device, then a production .aab) + store listing +
   data-safety form (mirror the Apple nutrition answers).
10. [ ] **Closed test: 12+ testers × 14 days** (personal-account requirement) — start the
    moment a build installs; calendar time burns in parallel. Recruit from the
    family-testing circle; the English build is fine to start.
11. [ ] **Android fix round** (expect one: back gesture, keyboard behavior, dictation quirks).

### Phase 4 — polish + ops tail

15. [x] **Polish batch — CLOSED 2026-07-12**: ~~back-to-top~~ (was stale — shipped
    2026-07-04) · ~~MONITORING.md refresh~~ (done) · ~~per-surface Sentry alert rules~~
    (done — "Native iOS" + "Server" new-production-issue rules created via Chrome,
    2026-07-12; android twin when that build ships). Small device-testing findings roll
    into the normal triage flow.
16. [ ] **[USER] Gestor consult + trademark search** — before brand spend / launch moment;
    may trail submission. Also: user read-through of the three legal pages' wording
    (professional legal review is item 31, at revenue).

### Phase 5 — 🚀 Submissions

17. [~] **iOS: TODAY** — see 📍 NOW above.
18. [ ] **Android**: promote to production once the 14-day closed test clears.
19. Web needs no submission — its "launch" is the Phase-6 marketing moment.

### Phase 6 — post-launch growth (STRATEGY.md order — these ARE the STRATEGY actionables, formerly "roadmap items 6–10")

20. [ ] **Turnstile on interview start** (web) — land BEFORE the public launch moment.
    **Status (2026-07-05): hardening, not a gap.** The `/api/lola` abuse posture is verified
    sound — payload caps + strict CORS + durable Supabase counters (per-IP 30/min + global
    25000/day) + provider spend caps. Remaining value: convert IP-based → **per-token**
    limiting (short-lived HMAC session token minted on a Turnstile solve, reuse
    `lib/emailTokens.ts`) so a rotating-IP abuser can't drain the daily budget and 429 real
    users. Native rides the counters. (/api/feedback got its own counters 2026-07-12 —
    the per-token upgrade here would cover it too.)
21. [~] **Region-by-region specifics — FIRST TRANCHE SHIPPED 2026-07-12** (core/
    regional-specifics.ts): ITP for Andalucía/Madrid/Cataluña/C.Valenciana + wealth-tax
    reliefs for Madrid/Andalucía, each verified same-day on that region's own portal
    (the pass caught Valencia's 10%→9% cut effective 1 Jun 2026). REMAINING (own
    verification passes): the other 13 comunidades' ITP · bracketed wealth scales
    (Cataluña/CV) · school windows (move yearly — never ship secondhand) · IBI is
    municipal, may never fit honestly.
22. [x] **DONE 2026-07-12** — /changelog (public, from core/changelog.ts) + "last
    verified" stamps on every guide page and the roadmap step sheet (verified_at
    catalog field; DEFAULT_VERIFIED = the 2026-07-04 click-test pass). Footer link ×5.
23. [~] **SEO expansion — personas SHIPPED 2026-07-12**: /sample-plan/{eu-family,
    digital-nomad,property-owners}, localized ×5, cross-linked, sitemapped, tested.
    REMAINING: question-shaped pages (framework + curated EN set, digit-guarded) —
    deferred behind build 37 (web-only).
24. [x] **DONE 2026-07-12** — read-only share links: stateless (payload = profile,
    invariant 4 made literal; notes stripped both directions), /shared render by the
    real engine, Share dialog with privacy caveat on /plan, noindex + robots. Long-URL/
    no-revocation trade-off on record in lib/shareLink.ts; short tokens = later upgrade.
25. [ ] **The launch moment**: communities with sourced guide links, webinar-creator
    partnerships, Product Hunt / HN — with the "built in N days" pre-emption paragraph
    written first. `webinar_url` → user-facing rides a MovingToSpain partnership if it lands.
    **Channel plan (soft-launch #1 lesson, 2026-07-06): DM mods/admins for permission BEFORE
    posting** — r/GoingToSpain pulled a humble, disclosed post via report-to-remove despite
    1.2K views + 2 real conversions. Order: city/local FB groups (JEREZ angle is the
    strongest), visa-specific FB groups (NLV/DNV/Beckham), r/SpainPersonalFinance,
    r/expats, expat forums, the webinar-creator warm list.
26. [ ] **Uniqueness bets**: timeline simulation · move-budget view · cita checklists.
27. [ ] **"My account" page** (email prefs + language + delete move out of the hamburger).
28. [ ] **Parked polish**: per-step problem-report link · scout-step prominence · a real blog
    surface · narrated roadmap-pane removals (see 2026-07-10 follow-ups below).

### Phase 7 — the tail (at revenue / at demand)

29. [ ] **Tier-3+ languages**: Dutch, Portuguese; then Romanian/Polish/Arabic/Chinese by
    data. es-419 and localized slugs likewise demand-driven.
30. [ ] **Monetization** (gestor/advisor referrals) + referral disclosure + E&O insurance.
31. [ ] **At-revenue ops**: US LLC migration (ASC/Play agreement transfers + legal-pages
    text) · professional legal review · bus-factor hour (credentials to password manager +
    second admin on Apple/Supabase — parked until real money, user decision).
32. [ ] **Scale revisits**: weekly-email MAX_SENDS cap · rate-limit posture · PostHog
    retention dashboards · iPad support.

### 🔒 Blocked on upstream (revisit when the dependency changes)

33. [ ] **Re-fold native authed E2E into CI** (blocked on Maestro #2610 — closed-stale, not
    fixed). The `04-authed-roadmap` deep-link flow is written, tagged `authed`, excluded in
    CI. Covered meanwhile by the 12 authed Playwright tests + manual on-device sign-in.
    **Re-enable when** #2610 is fixed OR a pre-1.40 pin proves out on the iOS-18.x simulator.
    **Do NOT coordinate-tap the dialog.** Context: docs/BUILD.md + memory
    `maestro-ios-deeplink-flake`.

### Follow-ups queued from the 2026-07-10 release day (redesign + landing v2)

- [x] ~~Consulate-appointment title~~ · ~~final-note distillation~~ · ~~narrated removals~~ —
      all three moved up to today's queue (items 8–10 above).
- [ ] **Chip-refinement loop** — review `interview_other_opened/answered` by field after ~2
      weeks of traffic; any field >10% Other usage gets its chip set extended.
- [ ] **Watch dashboard 808581** (PostHog "Interview v2 — living roadmap") as v2 traffic
      lands: drop-off by question, exit completeness, clarify rate, Other usage;
      `landing_version: 2` owns home→interview_started vs the 25% baseline. Then the
      before/after LinkedIn post. (Ack drop-rate has no metric yet — consider capturing when
      the phraseAck backstop fires.)
- [ ] **Landing variant A** ("the page IS question zero") parked as an A/B candidate once
      traffic justifies experiments — needs arrival-prefill design (docs/LANDING-REDESIGN.md).
- [ ] **Arrival-date chips** (This year / Next year / …) if Q1's typed+LLM turn shows
      friction in per-question `ms` data.
- [ ] **Email magic-link health** — watch `email_link_confirmed {ok:false}` rate after the
      next weekly send; that's the OTP-expiry dial (both Supabase projects at the 24h max).

**Explicitly NOT building (user decisions, unchanged):** push notifications (the weekly
email IS the retention loop) · document vault · country #2 · household sharing (wait for
demand).

## 🐞 Known issues

- _(none open — `tsc --noEmit` green; 216 vitest green; catalog audit clean 2026-07-12.)_
- Known + accepted: TestFlight build 35's voice toggle is silently dead (prod lost /api/tts);
  build 36 removes the toggle.

## Invariants (do not break — see ./docs/THESIS.md)

1. Engine is deterministic — no LLM in plan-building.
2. Interview is derived from the catalog (every `applies_if` field has a slot or derivation).
3. Lola never invents deadlines/costs/laws — hence the `source` field + SOURCING.md.
4. The plan is a pure function of the profile.

---

# ⬇️ BELOW THE FOLD — the done / historical archive

Everything below is DONE or superseded, kept verbatim as the historical record (it feeds
the how-i-was-built log and future audits). **Checkbox states are frozen as of 2026-07-12** —
every item still open on that date was carried into the open backlog above. Do not work
from this section.

## Soft launch #1 (2026-07-06) — the original note

Earlier (2026-07-06): FIRST SOFT LAUNCH to r/GoingToSpain — web-only call-for-testers; ~1.2K
views + 2 full conversions EN+ES + 0 errors before AutoMod removed it for "too many reports";
LOLA_GLOBAL_PER_DAY bumped 2000→25000; ElevenLabs plan upgraded → CAMINO-7 401 resolved
(plan now cancellable — TTS retired 2026-07-11).

**SOFT LAUNCH #1 (2026-07-06) — the growth learning:** DM mods/admins for permission BEFORE
posting; Reddit's report-to-remove machinery pulled a humble, disclosed, free-tool post despite
1.2K views and real conversions. Next channels (mod-permission-first, friendlier-first): city/local
FB groups (user lives in JEREZ — best angle), visa-specific FB groups, then r/SpainPersonalFinance,
r/expats, expat forums, and the webinar-creator warm list (partnership). This is a pre-launch test
of item 25; the moat (sourced steps, deterministic, EN+ES) demonstrably works for strangers.

## 🎯 THE SEQUENCED BACKLOG v2 (re-audited 2026-07-04) — ⚠️ SUPERSEDED 2026-07-12 by the open backlog above; frozen record

Second full audit of the day. **Closed since v1:** source-link QA (55/55, 2 fixed) ·
API volume-limiting (durable counters + strict CORS + provider caps) · a11y round 2 ·
authed Playwright suite (12/12 green) · Maestro flows + free-runner workflow (iterating:
run 2 = 3/4 passed) · rebrand Get Camino · @getcamino.app mailboxes · operator identity
FINAL (AELaboratories, Inc, Sanford NC — entity gate LIFTED, sole prop until revenue) ·
builds 27/28/29 · family-testing rounds 4–5 fixed (turn-taking, clipping, spinner TTL,
plan loading, composer growth) · slow-turn Sentry alarm · localization design APPROVED.
**Reshaped by user decisions:** launch = web + iOS + Android; Spanish pre-launch;
FR/DE/IT fast-follow; bus factor parked; back-to-top queued.

**Standing (every batch):** security audit (§ above) · homework pages per release ·
STRATEGY.md backtest · EAS builds only on user command · (once L0 lands) translation lints ·
**web E2E auto-runs on every deploy** (deploy.sh gate) · **grow the test suites** as concern
areas surface — every bug that reaches a person earns a regression test · **keep
docs/TEST-COVERAGE.md current** (what's tested today + the deepening strategy; CLAUDE.md rule).
Current: 86 vitest tests (+10 opt-in) · 11 web E2E flows · 3 native flows (retry-tolerant gate,
Maestro pinned 2.6.1) · API contract tests run on every staging deploy.

### Phase 1 — E2E gate (IN FLIGHT — blocks everything below; user directive)
1. ✅ **Maestro green — flow-03 trim VERIFIED IN CI** (run #10, 2026-07-05, green on the
   first attempt, pinned Maestro 2.6.1 — the pre-build-30 gate). The authed deep-link flow
   (04) stays EXCLUDED — #2610 re-checked: closed-stale ("waiting for customer response"),
   NOT fixed; re-pinning to pre-1.40 would risk the 3 green flows on the Xcode 26 image.
   Verdicts: docs/TEST-COVERAGE.md §5.
2. ~~**Pipeline wiring (Phase C)**~~ — **docs/BUILD.md rewritten** with the two-tier gate
   (user decision 2026-07-05): **small builds** = fast CI only (typecheck · audit · test, every
   push); **big builds** (native RC / store submission) = ALSO test:e2e (12) + e2e-ios
   (3 native), both manual dispatch. Native E2E is a RELEASE gate, not an iteration gate —
   tolerate the occasional CI-simulator re-run rather than chasing per-push reliability. The
   e2e-ios workflow is already workflow_dispatch-only (verified).
3. **[USER] Build 29 verification + family testing** (parallel, ongoing): mic first/last
   words at normal pace · composer grows while dictating · cold-start with no roadmap lands
   home · no spinner past 35s. Fix rounds as filed.

### Phase 2 — Localization (docs/LOCALIZATION.md APPROVED; starts when Phase 1 closes)

**⚠️ HARD GATE — localization-testing prerequisites MUST be green before ANY L0 code (user
directive 2026-07-05). Localization is broad, mechanical surgery; we do not touch it without
the regression harness in place. Strategy + rationale: docs/TEST-COVERAGE.md §4A.**
- ✅ **Engine structural snapshot** (`tests/plan-snapshot.test.ts`) — DONE. Engine is
  locale-free; proves localization never changes which steps / order / timing.
- ✅ **Interview extraction is language-agnostic** — DONE 2026-07-05, verified LIVE against
  staging (3 Spanish cases in `tests/api.contract.test.ts`, using the app's real extraction
  prompt via the new pure `lib/extractionPrompt.ts`; runs on every staging deploy).
- ✅ **Email/report render snapshots** — DONE 2026-07-05 (`tests/render-snapshot.test.ts`,
  4 full-HTML snapshots: 3 emails + the printable report; extend per-locale at L1).
- **→ GATE CLEAR (2026-07-05 audit): L0 may start.** The remaining two items below are BUILT
  INTO L0 by design (they need the string catalogs to exist).
- ✅ **The 4 i18n lint gates** — DONE 2026-07-05 with L0 (`tests/i18n-lint.test.ts`, in
  `npm test`): completeness / per-locale digit-lint / placeholder-lint / brand-lint, scanning
  `locales/` from disk so the es directory enrolls automatically at L1. Catalog/guide title
  completeness per locale still rides L1 (needs the per-locale TS modules to exist).

4. ✅ **L0 — plumbing — DONE 2026-07-05.** i18next + react-i18next (sync English init —
   hydration-safe; static export verified: prerendered HTML identical) · locale resolution
   saved → device → en (`lib/i18n.ts`; persisted in AsyncStorage + `user_metadata.lang` for
   signed-in) · the VISIBLE switcher in ☰ ("Language · English"; options each in their own
   language; en-only until L1 ships es) · chrome extraction to `locales/en/{common,plan,
   interview}.json`: NavBar, home, interview (incl. the 17 static questions), plan (sheet,
   banners, stats, change-notes), sample-plan, footer, store badges, all dialogs (sign-in,
   email, feedback, delete-account), BackToTop. E2E-anchored strings moved character-for-
   character. Full suite + plan-snapshot green after = behavior untouched. **Deliberately
   riding L1/L2 with their own per-locale mechanisms (design §2):** guide/content-page prose
   (how-it-works, guide pages, legal, homework), `plan-format`/`plan-coach`/`date-input`
   generated strings, email templates, SEO meta.
5. **L1 — Spanish (~2 days + Cristina verification) — THE LAUNCH GATE.** Progress 2026-07-05:
   - ✅ **L1a chrome** (`a94c613`): locales/es/{common,plan,interview}.json (tú, brand verbatim,
     17 static questions); switcher offers Español; Lola language directive (phrase/clarify/
     coach); extraction + re-plan any-language lines; vitest stubs unlock display-layer i18n.
   - ✅ **L1b display layer** (`7194787`): plan-format labels/formatters from plan.json
     "format.*" with locale dates; es assertions in tests.
   - ✅ **L1c catalog titles** (`b5b0075`): all 60 in core/i18n/es/catalog.ts, digit-verbatim;
     displayTitle() at render points; catalog-titles.test.ts gates (completeness/digit/length).
   - ✅ **L1d guide surface + sample persona** (2026-07-05 afternoon): all 60 es explainers
     (core/i18n/es/guide-prose.ts) + guides.json chrome/categories/tips/timing sentences +
     describeTimingLocalized (en-parity pinned; core stays i18n-free for the server bundle);
     sample persona now per-locale — es meets "Susana y Tomás" with a Spanish blurb (user
     spot-check finding: English blurb leaked + English names).
   - ✅ **L1e emails + report** (2026-07-05): locales/{en,es}/emails.json; welcome/roundup/
     nudge + unsubFooter + reportHtml take `lang`; buildDigest(lang) — same items, Spanish
     words; welcome/weekly routes resolve user_metadata.lang; PDF export follows the app
     language. Pure JSON tables (no i18next server-side); en output snapshot-pinned
     byte-identical; 4 new es snapshots. 108 tests.
   - ✅ **L1f legal-ES** (2026-07-05): per-page EN/ES content in privacy/terms/aviso-legal,
     selected by app language; every es version carries the "Idioma" section (English
     prevails). Address/entity figures verbatim. Professional legal review stays on the
     pre-launch list (TODO 16).
   - [ ] **[USER] Cristina verification pass** over the LIVE production es surface — the
     human gate (user decision 2026-07-05: shipped at ~95% to production pre-release;
     corrections iterate against the frozen snapshots + lint gates).
   - ✅ **Supabase auth email templates DONE 2026-07-05** — five-language Magic-link +
     Confirm-signup pasted + saved + reload-verified on BOTH projects (staging + production);
     Claude drove the dashboards via Chrome. Production's old hand-styled "Camino" templates
     replaced (rebrand + localization). Subjects compacted to fit the 255-char cap. NOTE: a
     pre-existing user WITHOUT user_metadata.lang gets ONE more English code email on their
     next sign-in (data.lang only seeds NEW users; SessionSync mirrors lang AFTER that email
     sends), then localized thereafter — self-heals, tiny cohort, no action needed.
6. ✅ **L2 — web SEO tree — DONE 2026-07-05** (live in production): static per-locale trees
   (app/{es,fr,de,it} — NOT a dynamic [locale] segment: the routes manifest is first-match
   ordered and a root dynamic segment swallowed /plan//interview//sitemap.xml; the post-deploy
   E2E gate caught it on staging, production never exposed); hreflang en/es/fr/de/it +
   x-default; per-variant canonicals; JSON-LD inLanguage; sitemap 334 URLs; route-locale
   forcing in the root layout (SSG-verified by grep on the export).
7. ✅ **L3 — FR/DE/IT — DONE 2026-07-05** (live in production): full content per language
   (5 JSONs + 60 titles + 60 explainers each, tu/du registers; German brand compounds caught
   by brand-lint and de-compounded); per-locale sample couples (Suzanne et Thomas, Susanne &
   Thomas, Susanna e Tommaso); emails/report/digest in all five; switcher lists each language
   in its own name. All gates iterate core/i18n/registry.ts — 146 tests.
   **Language persistence** (user-spotted gap): SessionSync mirrors the app language into
   auth user_metadata.lang on sign-in (and adopts the account language on fresh devices), so
   the weekly cron + welcome email match a browser-detected language without touching the
   switcher. **[USER/Cristina] verification passes over the live es/fr/de/it surfaces over
   the coming days; corrections iterate against the lint gates + snapshots.**
7. **L3 — FR/DE/IT (~0.5–1 day each + verification):** fast-follow; may land after store
   submission without blocking it.

### Phase 3 — Android track (START THE 14-DAY CLOCK EARLY — parallel with Phase 2)
8. **[USER] Buy the test device** (~$100–250: Moto G Play new / Galaxy A16 / refurb
   Pixel 7a — Play-certified, Android 14+).
9. **Play developer account** (personal, $25 — sole-prop decision) + first Android build
   (verify the old preview APK on-device, then a production .aab) + store listing +
   data-safety form (mirror the Apple nutrition answers).
10. **Closed test: 12+ testers × 14 days** (personal-account requirement) — start the
    moment a build installs; the calendar time burns in parallel with localization. Recruit
    from the family-testing circle; the English build is fine for this.
11. **Android fix round** (expect one: back gesture, keyboard behavior, dictation quirks).

### Phase 4 — Store paperwork, assets, small polish (parallel; mostly [USER])
12. **[USER] ASC fields**: privacy URL (https://getcamino.app/privacy) · DSA trader status ·
    display name → "Get Camino: Your Road to Spain" (exactly 30 chars) · age rating (4+) ·
    copyright `© 2026 AELaboratories`.
13. **Screenshots + metadata**: capture on build 29+ (docs/APP_STORE.md shot list; consider
    waiting for L1 so an es-ES localized listing can ship alongside — optional), Claude
    frames; paste metadata + privacy nutrition.
14. **Supabase auth-email templates** still say "Camino" (both dashboards) — copy ready in
    docs/design/supabase-auth-emails.md; Claude can drive with approval. + es-ES variants at L1.
15. **Polish batch**: back-to-top floating affordance (roadmap/guides) · monitoring tune-up
    (per-surface Sentry alert rules; refresh MONITORING.md's stale native section) ·
    anything small from build-29 testing.
16. **[USER] Gestor consult + trademark search** — before brand spend / launch moment; may
    trail submission.

### Phase 5 — 🚀 Submissions (gate: Phases 1, 2(L0–L2), 3, 4 complete)
17. **iOS**: attach final build, submit (review notes drafted); expect a rejection cycle.
18. **Android**: promote to production once the 14-day closed test clears.
19. Web needs no submission — its "launch" is the Phase-6 marketing moment.

### Phase 6 — Post-launch growth (STRATEGY.md order)
20. **Turnstile on interview start** (web) — land BEFORE the public launch moment. **Status
    (2026-07-05): now hardening, not a gap.** The `/api/lola` abuse posture is verified sound —
    payload caps + strict CORS + **durable Supabase counters (per-IP 30/min + global 2000/day)**,
    and per-IP limiting is **confirmed live** (real client IPs land in the counter table, so the
    Workers runtime does forward them) + provider spend caps set in the Anthropic/ElevenLabs
    consoles. Remaining Turnstile value: convert IP-based → **per-token** limiting (mint a
    short-lived HMAC session token on a Turnstile solve, reuse `lib/emailTokens.ts`), so a
    rotating-IP abuser can't drain the global daily budget and 429 real users, and we don't
    depend on IP-forwarding never changing. Native rides the counters. Full analysis: the
    hardening-strategy section in this session's notes.
21. **Region-by-region specifics content pass** (17 comunidades, each against its own
    official source — invariant 3; renders under the shipped regional flags).
22. **Public regulatory changelog + "last verified" stamps** — trust engine, correction
    process, most linkable asset.
23. **SEO expansion**: question-shaped pages + 3–5 persona sample plans (× locales once L2
    exists — compounding).
24. **Read-only roadmap share link.**
25. **The launch moment**: communities with sourced guide links, webinar-creator
    partnerships, Product Hunt / HN — with the "built in N days" pre-emption paragraph
    written first. `webinar_url` → user-facing rides a MovingToSpain partnership if it lands.
26. **Uniqueness bets**: timeline simulation · move-budget view · cita checklists.
27. **"My account" page** (email prefs + language + delete move out of the hamburger).
28. **Parked polish**: per-step problem-report link · scout-step prominence · a real blog
    surface. (Context-aware change hints SHIPPED — verified in code 2026-07-04.)

### Phase 7 — The tail (at revenue / at demand)
29. **Tier-3+ languages**: Dutch, Portuguese; then Romanian/Polish/Arabic/Chinese by data.
    es-419 and localized slugs likewise demand-driven.
30. **Monetization** (gestor/advisor referrals) + referral disclosure + E&O insurance.
31. **At-revenue ops**: US LLC migration (ASC/Play agreement transfers + legal-pages text) ·
    professional legal review · bus-factor hour (user decision: parked until real money).
32. **Scale revisits**: weekly-email MAX_SENDS cap · rate-limit posture · PostHog retention
    dashboards · iPad support.

### 🔒 Blocked on upstream (revisit when the dependency changes)
33. **Re-fold native authed E2E into CI** (blocked on Maestro). The `04-authed-roadmap`
    deep-link flow is written, tagged `authed`, and `--exclude-tags=authed` in CI because
    opening iOS deep links via Maestro on CI runners is a documented, unresolved flake — the
    "Open in app" SpringBoard alert isn't in the app's a11y tree on Maestro 2.x / iOS 18.x
    ([mobile-dev-inc/Maestro #2610](https://github.com/mobile-dev-inc/Maestro/issues/2610);
    confirmed in our runs 2–4). Meanwhile it's covered by the 12 authed Playwright web tests
    + manual on-device sign-in. **Re-enable when:** #2610 is fixed, OR pin a pre-1.40 Maestro
    and verify it drives the iOS-18.x simulator → then drop `--exclude-tags=authed`. **Do NOT
    coordinate-tap the dialog** (brute-forcing a tool bug — explicitly rejected). Full context:
    docs/BUILD.md + memory `maestro-ios-deeplink-flake`.

**Explicitly NOT building (user decisions, unchanged):** push notifications (weekly email IS
the retention loop) · document vault · country #2 · household sharing (wait for demand).

## 🥇 Priority order (set by user 2026-07-02) — ✅ COMPLETE, superseded by the sequenced backlog above

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
4. ~~**Full deep cross-check / testing pass of ALL obligations**~~ — **substantially DONE 2026-07-03**
   via the Fable audit + re-verification pass: every `applies_if` field audited against the
   interview (invariant 2, now `npm run audit` + a deploy gate), all 28 uncited `official` items
   re-verified one-by-one and given canonical URLs, catalog bugs fixed (DELE/PH, unmarried-partner
   reunification), missing `eu-registration-certificate` added. **Catalog: 60 obligations —
   55 official (100% cited) / 5 recommendation.** Remaining for launch-final QA: click-test every
   source link renders the right page (manual spot-check), and E2E flows (B5).

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
- [~] **iOS build 12 — ON TESTFLIGHT 2026-07-03, awaiting device verify.** Contents: Sign in with
      Apple (guideline 4.8), keyboard-clipping fix, interview intelligence (multi-slot skip +
      clarify logging + generous dates), corrected webinar anchors. Took 3 attempts: the
      provisioning profile predated the applesignin entitlement — fixed via ASC API (capability
      enable + portal profile delete + EAS re-mint); the dance is documented in docs/APP_STORE.md.
      Device checklist: Apple sign-in completes (fresh account expected), composer clears keyboard,
      multi-slot skip works, forced clarify appears in the Interview quality dashboard.
- [x] **iOS build 11 — VERIFIED ON DEVICE 2026-07-03 (user: "everything verified").** Scroll no
      longer slides under the Dynamic Island (root SafeAreaView fix), no double-padded headers,
      sample plan reachable, post-audit catalog + native Sentry/analytics/voice all in. iOS is
      fully current. (The 17 corrected webinar anchors shipped just after build 11 was cut — they
      ride the next build; web, where staff links mostly render, already has them.)
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
- [~] **B5 — Automated test suite — 3 of 4 layers DONE 2026-07-03.**
      - [x] **Engine (deterministic, offline)** — `tests/engine.test.ts` (vitest, `npm test`,
            15 tests, ~140ms): invariant-2 audit as a test, purity (same profile → identical plan),
            dependency ordering across all 9 personas, every audit-fix regression (DELE/PH,
            unmarried partner, renewal-only, EU registration, property cluster), anchor re-flow
            (residencia done → ccse firm + exact re-date), derivations + slot sequencing.
            **Runs in deploy.sh (gate) + GitHub Actions CI on every push** (`.github/workflows/ci.yml`).
      - [x] **API contract** — `npm run test:api` (opt-in, hits staging): lola 400/413/role
            validation, tts 400/413 + GET happy path (7 tests). Never runs in CI (no spend).
      - [x] **Web smoke (Playwright)** — `npm run test:e2e` vs staging (5 tests): home, interview
            actually starts (real /api/lola turn → Lola's first question), plan empty state,
            blog + robots/sitemap, zero uncaught page errors. CI job on manual dispatch.
      - [ ] **Native (Maestro)** — deferred: needs simulator/device infra; revisit pre-launch.
            Also not yet covered: authed flows (sign-in → saved plan → re-model) — needs a test
            auth strategy (Supabase test user or bypass); design when tackling Maestro.
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
      - [x] **Native analytics — DONE 2026-07-02, in TestFlight build 9.** `lib/analytics.native.ts`
            uses `posthog-react-native` → same PostHog project + funnel events as web, `environment`
            super-property, `captureAppLifecycleEvents` (app open/background). Key/host from EAS env.
            On-device verify once build 9 processes (events appear under `platform`-tagged / native).
      - [x] **PostHog insights — DONE 2026-07-03.** Four saved insights, all filtered
            `environment = production`, collected on the **"Camino health" dashboard**
            (eu.posthog.com project 214229, dashboard 791543):
            (1) *Core funnel*: $pageview → interview_started → interview_completed → roadmap_viewed
            (already computing: 10 visitors → 3 starts in prod's last 30d);
            (2) *Sample-plan funnel*: viewed → CTA → interview_started;
            (3) *Roadmap retention*: weekly first-time → return on roadmap_viewed (8 wks);
            (4) *Feature health* (weekly): task_opened, task_coach_asked, roadmap_item_completed,
            plan_remodelled, sample_plan_step_expanded. Native events confirmed flowing too
            (posthog-react-native from build 11: sample_plan_viewed, interview_started,
            app lifecycle). Insights were built via PostHog's query-in-URL (deterministic), so the
            exact queries are reproducible.
      - [x] **"Interview quality" dashboard (2026-07-03, dashboard 791714):** clarify-failure
            monitoring — weekly trend broken down by question `field`, plus a HogQL raw-log table
            (timestamp · question_field · verbatim user_answer · env · platform) for analysis.
            Feeds from `interview_clarify_needed`; native contributes from build 12 onward.

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

## 🗺️ Product roadmap (user-reviewed 2026-07-03) — in priority order

1. ~~**[BUGS] Build-15 device findings**~~ — **DONE (verified in the 2026-07-04 audit):**
   (a) keyboard clipping solved for good by the deterministic `hooks/useKeyboardHeight` hook
   (build-25 batch, applied to composer + sheets + dialogs); (b) inline Apple button replaced by
   the single "Sign in" → dialog (Apple + Google + email OTP), NavBar now hamburger-based.
2. ~~**Overdue-state handling**~~ — **DONE (verified in the 2026-07-04 audit):** engine's single
   `isOverdue` predicate drives the red overdue treatment + stat chip on /plan, the "This week"
   overdue bucket, the PDF report's red "Overdue · was due …" lines, and the weekly email.
3. **The email loop — LIVE 2026-07-03.** Code shipped (magic-link auth + email-me-my-roadmap +
   welcome + weekly-roundup engine + cron workflow), env keys landed as `sensitive`, both envs
   redeployed, and verified end-to-end: forced weekly run via workflow_dispatch → 200
   (`nudges: 2`, delivered + styled in a real inbox), welcome fired on a real production sign-in.
   Live test caught + fixed two bugs: email links leaked the per-deploy `*.expo.app` origin
   (now a canonical per-env `siteOrigin()`), and welcome triple-sent on one sign-in (client now
   fires once per user per page load; server claims `welcomed_at` BEFORE sending, rolls back on
   send failure). Staging Supabase SMTP + styled auth templates done too (2026-07-03, verified
   with a live magic-link send; templates versioned in `docs/design/supabase-auth-emails.md`).
   **Original spec:**
   - **Passwordless (magic-link) sign-up is the foundation** — Supabase `signInWithOtp`. Add
     "Continue with email" to the new sign-in dialog (alongside Apple + Google). Every email we
     send then doubles as a no-password door back into their roadmap.
   - **"Email me my roadmap"** for signed-out users at the roadmap moment — entering the email
     silently CREATES the account (magic link); clicking through from the email lands them signed
     in on their saved roadmap. Funnel capture + account in one gesture.
   - **Welcome email** on signup.
   - **Incomplete-interview nudge** — started but didn't finish → prompt to pick it back up.
   - **Weekly roundup** (finished interviews): overdue items + upcoming items, **never more than
     4–5 tasks**, a helpful per-item tip (deterministic, from the catalog — not LLM-invented), and
     a click-through to the full roadmap (web now; app deep link once universal links are set up).
   - Infra decisions needed: sender (Resend is the likely pick), scheduler (GitHub Actions cron
     hitting an API route, or Supabase pg_cron/Edge Function), unsubscribe + email prefs column.
     Native magic-link redirect can reuse the existing `caminoapp://` deep-link session flow.
4. **60 free SEO pages — SHIPPED 2026-07-03, live on prod.** `/guide/<id>` (60 pages) +
   `/guide` grouped index, all generated from the catalog (`core/guide-content.ts`): timing
   RULE in words (never a fabricated date), severity/source blurbs, prerequisite links,
   category tip, official source link, interview CTA, per-page `<title>`/description/canonical
   (prerendered), `/sitemap.xml` API route generated from the catalog (64 URLs), robots.txt
   Sitemap line, "Guides" in the nav menu. Possible later polish: JSON-LD structured data,
   per-obligation prose descriptions (would need a curated content pass).
5. **Next three features (user priority 2026-07-03) — all land BEFORE the App Store release:**
   1. **"This week" view — SHIPPED 2026-07-03.** `core/this-week.ts` (pure selector: overdue +
      due-within-7-days + nextUp, date semantics mirror `isOverdue`, buckets preserve plan order)
      + a toggle on /plan (This week · N overdue | Full roadmap). 4 tests. Verified on staging
      with a real roadmap.
   2. **Roadmap PDF export — SHIPPED 2026-07-03.** `lib/reportHtml.ts` (pure plan→HTML report,
      THESIS piece 4: hero next step, estimated vs firm, dateless pending steps, official URLs
      printed; 4 tests) + platform-split `lib/exportPdf` (web → print dialog, native →
      expo-print + share sheet) + "⤓ PDF" on /plan. Native rides build 23.
   3. **Region-aware steps — SHIPPED 2026-07-04 (v1).** `region` slot (asked when
      knows_where_to_live/owns_property; city→comunidad mapping via extractor; not_sure is
      first-class; core/regions.ts labels), `regional: true` on property-transfer-tax /
      wealth-tax / escolarizacion / ibi-property-tax, surfaced on plan sheet ("WHERE YOU
      LIVE MATTERS" + names your region), guide pages, and the PDF report. Personas updated.
      **ALL THREE PRE-RELEASE FEATURES DONE.** Follow-up queued in item 9: per-region
      specifics as a SOURCED content pass (17 regions × official sources — invariant 3).

   Also shipped 2026-07-03: **Report a problem** (menu → dialog → /api/feedback → Resend to
   team inbox with platform/version/route context; verified end-to-end) and **iPad OFF** for
   the first release (supportsTablet: false — no iPad screenshots/review overhead).
6. **Legal & compliance surfaces — SHIPPED 2026-07-04** (in-app hard-delete account (E2E-tested live on staging), /privacy + /terms + /aviso-legal (operator Proxim.us; drafted, USER REVIEW + eventual professional pass pending), footer links, sitemap, PostHog cookieless). **USER ACTION left: paste https://getcamino.app/privacy into App Store Connect (privacy policy URL field) + review the three legal pages' wording.** (Originally: found in the
   2026-07-03 multi-stakeholder review, docs/STRATEGY.md):**
   1. **In-app account deletion** — Apple guideline 5.1.1(v) hard-rejects sign-in apps
      without it; doubles as the GDPR right-to-erasure mechanism.
   2. **Privacy policy page** (+ its URL into App Store Connect — required field) naming
      processors (Supabase, Resend, PostHog, Sentry, Anthropic, ElevenLabs), retention, rights.
   3. **Terms of service** (guidance-not-advice + liability cap) and **aviso legal** (LSSI
      operator identity).
   4. **Analytics consent decision**: PostHog cookieless mode (preferred — no banner, fits
      brand) or a consent banner; Sentry too.
6b. **ENTITY DECISION REVISED (user, 2026-07-04 late): SOLE PROPRIETOR for launch — the
   pre-submission entity gate is LIFTED.** No new legal entity until a proven revenue model;
   user operates as sole proprietor (own SSN as Tax ID) for Apple/Google/taxes. When
   formalization happens it will be the **US LLC** (no Spanish entity — user's immigration
   still processing); the migration is mostly behind-the-scenes (ASC / Play agreement
   transfers) plus the legal-pages text. CONSEQUENCES: (a) Google Play = PERSONAL account →
   the 12-testers × 14-days closed-test rule APPLIES before production (plan it into Android
   launch; fits the family-testing culture); (b) Apple individual account stays as-is;
   (c) ASC copyright line = the sole proprietor; (d) one open wording choice: legal pages
   currently name "Proxim.us, Vashon PO box" — confirm that's the right sole-prop/d.b.a.
   identity to keep, or swap to the personal name. **Mailbox RESOLVED 2026-07-04:** Google
   Workspace on getcamino.app (single user andrew@getcamino.app + alias routing) — the site
   uses privacy@/legal@/feedback@getcamino.app; nerolabs@gmail.com is out of the product.

6c. *(eventually, not now — user request 2026-07-04)* **"My account" page** — as account
   options accumulate, a proper account screen (email, sign-in method, email prefs, delete
   account) so destructive actions move out of the main hamburger.

7. **Polish backlog for the next push (user-approved 2026-07-03 night), in value order:**
   1. **Social share cards — SHIPPED 2026-07-04.** components/Seo.tsx (full og:/twitter set on
      every public page) + public/og-card.png from scripts/gen-share-card.mjs (brand geometry).
   2. **JSON-LD — SHIPPED 2026-07-04.** Article+BreadcrumbList per guide, CollectionPage+ItemList
      on the index, WebSite+Organization on home (core/guide-content.ts, pure), logo.png served.
   3. **Curated prose per guide — SHIPPED 2026-07-04.** core/guide-prose.ts (60 explainers) + digit-lint test (prose digits ⊆ title digits, invariant 3 mechanized) + prose-first meta descriptions.
      A real content session: every sentence verified against the official source (invariant 3).
   4. **Context-carrying CTAs — SHIPPED 2026-07-04.** /interview?from=<guide-id>; Lola's greeting
      acknowledges the referring guide (phrasing only, no facts). Verified live. Also fixed:
      /api/lola + /api/tts origin allowlists now accept our own per-deploy camino--*.expo.app
      origins (they 403'd pre-production verification).
   5. **Accessibility sweep — SHIPPED 2026-07-04 (round 1).** lib/useReducedMotion (hero rests),
      roles/labels on nav/menu/cards/dialogs/inputs, header roles on page titles,
      accessibilityViewIsModal on dialogs. Deeper pass (focus-visible styles, full audit) later.
8. **App Store submission — gated (user decision 2026-07-03)** on region-aware steps PLUS
   significant family testing / edge-case cleanup PLUS item 6 above (account deletion +
   privacy policy URL are hard blockers). See docs/APP_STORE.md for the pack.
   User-side items: **DSA trader status in ASC** (blocks EU distribution).
9. **Growth & uniqueness backlog (2026-07-03 review — full reasoning in docs/STRATEGY.md):**
   - **Region-by-region specifics content pass** (NEW 2026-07-04): ITP rates, wealth-tax
     allowances, school windows per comunidad, each verified against that region's own
     official source; renders under the existing regional flags.
   - **Public regulatory changelog** (top pick): publish catalog diffs with sources; feeds
     the weekly email; trust engine + most linkable asset.
   - **"Last verified" stamps** on steps/guides.
   - SEO expansion: question-shaped pages from catalog data + 3–5 persona sample plans.
   - **Read-only roadmap share link** (lighter than the cut household sharing).
   - **Timeline simulation** (arrive March vs Sept → windows/tax clock shift).
   - Move-budget view (per-obligation official fees); cita checklists (what to bring).
   - Partnerships: the 15 webinar creators (warm list); MovingToSpain.com (clear-eyed — now
     partly a competitor); Product Hunt / HN launch moment (backlinks; prep the "built in 4
     days" pre-emption paragraph first).
10. **Business/PR/personal ops (user-side, non-coding — from docs/STRATEGY.md):**
   - Positioning discipline: "move to Spain PROPERLY" framing; integration-forward voice;
     never market "hack Spain" (housing-crisis climate, 2027 elections).
   - Correction process: fix fast, publish the diff (changelog habit), never argue.
   - Entity/tax hygiene: Camino under the LLC; **gestor consult re: US LLC managed from
     Spain (PE/autónomo)** — the product's own advice, applied.
   - Trademark search "Camino" (software classes) before brand spend.
   - Referral-compensation disclosure when monetization starts; E&O insurance at revenue.
   - **Bus factor**: credentials to password manager + trusted second person; second admin
     on Apple + Supabase (~1 hour, biggest continuity risk).
   - Weekly operating rhythm: Monday email, weekly release train, scheduled feedback triage.
11. *(later)* per-step problem-report link.
12. *(end of backlog)* **Monetization** — gestor/advisor referrals once affiliate programs are
   identified; possibly paired with the MovingToSpain.com partnership.

**Explicitly removed (user decision 2026-07-03, evening):** Reminders / push notifications —
the weekly cron email IS the retention loop; weekly email updates do the job and we won't be
another icon buzzing a pocket. (Public roadmap lists it under "not building".)

**Explicitly removed (user decision 2026-07-03):** Country #2 (not now) · document vault (won't
carry security responsibility for those documents) · household sharing (wait for real demand
signal). Localization: held for an app update pending locale demand data.

## 🔜 Next (candidates, not yet started)
- [x] **Sample plan — DONE 2026-07-03, live on prod (`/sample-plan`).** The payoff before the ask:
      `core/sample-profile.ts` (Susan & Tom, US retirees → NLV + dog + undecided region + citizenship
      hopes; arrival floats +270d so dates never go stale) rendered read-only by the REAL engine —
      30 steps / 21 required / 4 phases, amber "SAMPLE ROADMAP" banner, interview CTAs top+bottom.
      Cards **tap-to-expand with deterministic detail** (timing, severity+source blurbs, prerequisites,
      official-source link, and an amber tease that in YOUR plan Lola coaches/checks-off/re-flows) —
      the LLM coach + mark-done stay out on purpose (public page = free-LLM abuse surface; demo
      honesty). Surfaced via signed-out NavBar link + home-hero link. Audit validates the profile
      like a persona; Playwright smoke covers the page. Analytics: sample_plan_viewed /
      sample_plan_cta_clicked / sample_plan_step_expanded.
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
- [x] **Final-polish catalog visualization — DONE 2026-07-03.** `npm run docs:catalog` generates
      `docs/CATALOG.md`: every interview question (+ when it's asked), every derivation, all 60
      obligations with human-readable applies-when conditions, the reverse index (field → the
      obligations it gates), and a Mermaid field-flow graph. Derived from SLOTS/DERIVATIONS/CATALOG
      so it can't drift; regenerate after any catalog change. **[YOU: do the human review pass.]**
- [x] ~~(original note)~~ **audit the full obligation list + the questions that gate them (user feedback
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

