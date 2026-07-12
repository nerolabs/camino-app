# Camino — Session Handoff

Quick-start context for a fresh session on **camino-app** (the Expo app — iOS / Android / web).
The canonical design memory — thesis, the four invariants — lives at `./docs/THESIS.md`.
**Read that first.** The living work tracker is `./TODO.md`; obligation provenance is
`./core/SOURCING.md`.

## ⭐ RESUME HERE (2026-07-12 late night — build 38 SUBMITTED; the COUNCIL reported; user triage IN)

1. **Build 38 = v1.0.0 (38), Build ID 4f60d8e0 — built + submitted to App Store Connect**
   (--auto-submit; Apple processing → TestFlight). Cut from 681eea6 with the e2e-ios gate
   SKIPPED under an explicit ONE-TIME user waiver (recorded in
   docs/testing/2026-07-12-build37-triage.md — NOT a precedent). **Cristina's full device
   pass on 38 is THE submission gate** (share sheet dismiss-then-present fix, the two new
   interview questions, regional fact cards, stamps, A6 empty state), then ASC Part 3
   (trader-case check → attach 38 → Add for Review).

2. **The agent council reported** — five independent cold-start commissioners (Tech
   w/ repo+live-API access · Legal · PR · Marketing · Ops), convened on the user's charge
   ("almost no context, understand the purpose… a lot of push back on the technology and
   its reliability"). **Full report + cross-seat synthesis:
   docs/audits/2026-07-12-council-report.md.** The unanimous shape: *the engineering earns
   trust; the seams spend it* — the Lola chat surface, the freshness treadmill, and the
   paper/identity around the product. Tech's verdict: "would I stake my own move on it?
   Not unsupervised" + a five-item path to yes. Notable live evidence: Lola told a
   below-NLV income "that's a solid range" (engine's plan warning was correct); a DUI
   question was silently "absorbed"; /api/lola honored a caller-supplied system prompt
   from foreign curl; volunteered health data stored silently.

3. **User triaged the ENTIRE report the same night — rulings now structural in TODO.md:**
   - **FIX (the 🏛 Council fix queue, C1–C8):** C1 the Lola honesty package (validate ALL
     three LLM write-paths with the shared slot validator · neutral acks + deterministic
     in-chat threshold flags — never praise a failing answer · honest can't-assess replies
     to stakes questions · first-bubble AI disclosure [EU AI Act Art. 50 applies
     2026-08-02] · no-health/criminal microcopy · free-text out of analytics) · C2 /api/lola
     lockdown (server-side system prompts + per-token Turnstile [USER: widget + keys] +
     budget-429 alerts) · C3 penalty-bearing obligations never silently dropped (Modelo 720
     is the worst case) · C4 share-link payload → #fragment · C5 GDPR drafting pass ·
     C6 legal-figures single-source registry · C7 audit-matrix into CI + real dependent
     count · C8 household scope statement. Priority: **C1 + C2 first** (user: "WAY up
     there" / "Severe" / "BIG ISSUE. PLEASE FIX.").
   - **DETAILED, awaiting go (C9):** the Ops "stranger contract" (feedback auto-ack,
     200/day cap raise + alerts, billing-loop break) — user asked for specifics before
     ruling; provided in chat + TODO C9.
   - **DEFERRED by explicit ruling (the 🗄 Post-launch ledger, trigger ≈1000 real users):**
     entity/US-LLC + legal-page truth · repo privacy/curation ("transparency rules the
     day — nothing to lose until there is something to lose"; incl. the council report's
     public curl example) · terms assent + E&O ("altitude first") · bus-factor hour +
     backups · founder name. **Do not re-litigate — the rationale is on record in the
     ledger.** Marketing's report is the one UNTRIAGED seat (user pass pending).
   - **New standing directive (the 🔁 Freshness beat):** quarterly statutory/regional
     re-verification + January budget-law deep pass + a mechanized stale-stamp/dead-URL
     CI alarm (post-C6), AND the **migration invariant** (candidate invariant #5):
     catalog/engine changes must honor every saved profile — **a replan never requires a
     new interview**; if new info is truly required, a delta-interview asks only the
     missing slots.

4. **THE MORNING PLAN (user call at session close — two parallel tracks):**
   - **Track A (us):** work the 🏛 Council fix queue, **C1 + C2 first** (the Lola honesty
     package; the /api/lola lockdown — C2a server-side system prompts is the quick win).
     Fixes are web/shared code → deploy to web as they land; anything native-visible
     rides build 39. [USER prerequisite for C2b when we get there: create the Cloudflare
     Turnstile widget + set site/secret keys in EAS env, `sensitive` visibility.]
   - **Track B (Cristina, in parallel):** full device + web shred of build 38 as-is —
     "99% of the user feedback can be captured there" (user). The user relays her
     findings while we work Track A; her pass remains THE submission gate → then ASC
     Part 3 (trader check → attach 38 → Add for Review).
   - **Standing rule note:** the homework pages (app/how-i-was-built/{log,roadmap}.tsx)
     do NOT yet carry the build-38-submitted/council-night row — deliberately deferred to
     the first Track-A deploy (the pages describe what's live; precedent 2026-07-10).
     Also pending user-side: C9d billing-loop break (~15 min) + PROVIDERS.md migration.

**SESSION CLOSE (2026-07-12 ~night's end):** build 38 submitted and processing at Apple;
council report + full user triage committed (docs/audits/2026-07-12-council-report.md +
TODO's three new sections); working tree clean, all pushed through 7629955. Nothing in
flight. First morning action: confirm 38 is in TestFlight for Cristina, then open C1a.

**ADDENDUM (2026-07-13 night — pre-morning rulings; TODO.md carries them, commit 12b4ed6.
This FINALIZES the Track-A queue and supersedes "then open C1a" above):**
- **The queue, in order:** (0) confirm 38 on TestFlight → hand to Cristina (Track B);
  (1) **FIRST DEPLOY = C2a** (server-side system prompts) **+ the /de "Damit gehen Sie
  nach Hause" fix** (approved; three-layer copy grep) **+ the deferred homework-pages
  row**; (2) C2c budget-429 Sentry alert (lola + feedback); (3) C1a→f, deploying in
  coherent sub-batches; (4) **MID-MORNING: PROMPT THE USER — Cloudflare Turnstile widget
  + site/secret keys in EAS env (`sensitive` visibility), per his explicit ask to be
  prompted** → then C2b; (5) C9a auto-ack (~4–5-day reply line, user-approved) + C9b
  FEEDBACK_GLOBAL_PER_DAY → 1000 (plaintext env); (6) C3 then C4 as the day allows.
- **Rulings on record (do not re-ask):** C9 (a)+(b) GO, (c)+(d) → post-launch ledger;
  PROVIDERS.md migration CLOSED (user monitors billing/email himself); /de fix approved;
  C2b held to mid-morning. **Open user decisions, neither blocking the morning:** the
  Marketing-seat conversion items (ruling pass pending; housekeeping sub-list proposed
  for blanket approval) and C5's EU-representative spend (only when C5 opens).

---

## Prior resume note (2026-07-12 night — the BIG day: submission pivoted one build; trust batch LIVE; build 37 riding)

**The plan changed mid-day (user call): don't submit on 36 — ship the backlog's trust features,
cut build 37 for a full Cristina shred, and submit on 38.** The day, compressed:

1. **Morning (submission prep, all DONE):** ElevenLabs fully retired (plan cancelled, EAS vars
   deleted from prod+preview, ASC review-notes ElevenLabs line swapped live via Chrome for a
   dictation-only bullet — docs/APP_STORE.md holds the canonical block). Interview screenshot
   retaken on 36 (fresh-eyes had caught the retired voice pill in the framed set), re-framed,
   uploaded to ASC by the user. **docs/PROVIDERS.md** written: the full SaaS map (7 paid /
   7 free) + the migrate-everything-to-andrew@getcamino.app checklist. git identity set
   (andrew@getcamino.app). TODO.md **reorganized**: actionable above the fold, history frozen
   below (+ CLAUDE.md's items-6–10 pointer fixed).

2. **Mid-day fixes (live on prod web):** /api/feedback volume-guarded (5/min IP, 200/day global,
   FEEDBACK_* env overrides, +2 tests); contact.tsx version via nativeBuildVersion + email
   prefill effect; final-note DISTILLATION (distillFinalNote — shared plan-coach extractor;
   "the dog is coming too" reshapes the roadmap before the countdown, +4 tests); narrated
   REMOVALS ("−N steps — simpler for you" pill ×5 locales); consulate-appointment title
   neutralized ×5 + guide prose ×5 + dead ConsulateBanner removed (UK-tester flag; SOURCING.md
   entry); privacy page discloses answer-text analytics (EN+ES, date bumped). "3 minutes"
   claim RESOLVED (user measures ~3 min; moved to the new post-launch health checklist in
   TODO). Sentry per-surface alert rules created via Chrome (Native iOS + Server, production,
   new-issue → email). MONITORING.md refreshed (native section was 10 days stale). How-i-was-
   built ESSAY got its era update (5 new sections: languages/strangers/redesign/voice-kill/
   submission) + the log gained the missing soft-launch row.

3. **Afternoon (the trust batch — TODO 21–24 ALL SHIPPED, five prod deploys, each E2E-green):**
   - **/changelog** (core/changelog.ts data → page) + **"last verified" stamps** on every
     guide + the step sheet (`verified_at` field; default = the 2026-07-04 click-test).
   - **Share links, stateless**: payload = the profile (lib/shareLink.ts; notes stripped both
     directions, junk → friendly dead-end at /shared, noindex + robots). Share dialog on /plan
     with the privacy caveat.
   - **3 new sample personas** (/sample-plan/{eu-family,digital-nomad,property-owners} — real
     engine runs, ×5 locales, cross-linked; sample-plan.tsx → components/SamplePlanScreen).
   - **/questions**: 8 curated Q&As, digit-GUARDED against related catalog titles (the
     guide-prose rule mechanized for prose), FAQPage JSON-LD, footer link ×5.
   - **Regional specifics, first verified tranche** (core/regional-specifics.ts): ITP for
     Andalucía 7% / Madrid 6% / Cataluña progressive 10→13% / **C. Valenciana 9% — the pass
     caught the 10%→9% cut effective 1 Jun 2026 that secondhand sources still miss**; wealth
     reliefs Madrid+Andalucía. Every figure verified same-day on the region's own portal;
     digits live ONLY in the data file (templates ×5 interpolate). Step sheet shows the fact
     card + "Verified <date> · official source". STAGED remainder recorded in the module.
   - Suites: **242 vitest** (+20 today) · **10 public + 5 authed Playwright** (+2 today) ·
     7 contract. TEST-COVERAGE current.

**IN FLIGHT AT CLOSE:** build 37 (--auto-submit, cut from b3feecf on user command) — TestFlight
processing; two e2e-ios runs were still executing at cut time (informational; check
29193752759 landed green). **NEXT: (1) Cristina shreds 37** (all-new native UI: share dialog,
stamps, regional cards, changelog, interview ending) → triage → **build 38 = candidate**;
(2) ASC Part 3 on the candidate (trader check → attach → Add for Review — everything else in
ASC is DONE); (3) PROVIDERS.md email migration (user-side); (4) watch PostHog 808581 (+ new
events: share_link_created, shared_plan_viewed, interview_note_distilled, question_cta_clicked).

**FINAL STATE AT SESSION CLOSE (2026-07-13, after the remnants + regional-completion push):**
Everything the audit surfaced is now SHIPPED except what's deliberately parked. Catalog **73**
(from 63 at day start). The remnants batch closed: DGT licence-exchange list corrected against
the DGT's own convenio table (6 countries wrongly promised an exchange incl. MX/VE/CU; 13
wrongly sent to the exam incl. PH/MA/UA/TR), B6 has_spanish_company clarifier → modelo-200
only for Spanish companies, income question gated on visa_type∈{nlv,dnv}, A6 short-stay
empty-state ×5, and the regional map COMPLETED (País Vasco 4%/7% foral-portal-verified,
Navarra 6%, Ceuta/Melilla 6%−50%→3%; only school windows + IBI stay out, permanently). Home
strip's "all 60 guides" → live CATALOG.length count (user catch). Suite: **263 vitest · 10
public + 5 authed Playwright · 7 contract · matrix 181×16**. Homework pages carry the audit
night. All deployed; working tree clean.

**LATE-NIGHT ADDENDUM (2026-07-12 → 13, THE ENGINE AUDIT — user call: ahead of everything):**
The build-37 shred found condition-level bugs the mechanical audit can't see (Cristina's
dual-US/ES run: Spanish spouse offered the FOREIGN-national EX-18; the US spouse had NO
residence step; the "Andrew" test persona was ASSERTING the bug). Full audit ran the same
night — **docs/audits/2026-07-12-engine-audit.md is the record**: all 64 conditions reviewed,
15 findings (A1–A15), 10 FIXED + DEPLOYED (padrón address-gating, job-seeker→NLV routing,
short-stay residence cluster, buyer NIE incl. EU, EU licences, EU citizenship exclusion,
mixed-household EX-19 + clarifying question — catalog 63→64), 5 ranked into the sourcing
backlog (B1–B8; note **B7 married-to-a-Spaniard 1-year citizenship track**). NEW STANDING
TOOL: `scripts/audit-matrix.ts` (181 profiles × 16 class expectations — run it during any
catalog/condition work). NEW FIX DISCIPLINE: grep tests for assertions encoding the behavior
being changed (FOUR such tests found in one day). Suite: 259 vitest; 4 persona snapshots
deliberately updated; 4 public changelog entries. Build-37 triage: 7 rows, 6 fixed (share
sheet + styling, EU empty-state, EX-18/EX-19), all riding **build 38** (unblocked on my side
once Cristina's shred wraps).

---

## Prior resume note (2026-07-11 evening — Cristina batch LIVE; build 36 riding; ASC paperwork DONE minus trader)

**The day in three threads:**

1. **Cristina's full fresh-eyes pass → a 5-item batch, shipped same day** (verified on staging
   by the user, then production + build 36): **(a) TTS voice REMOVED everywhere** (hooks, voice
   pill, /api/tts, ElevenLabs privacy-page mentions, contract tests — mic dictation stays;
   ElevenLabs plan + EAS env vars can now be cancelled/deleted, user-side); **(b)** copy
   realigned "conversation" → **"short interview"** ×5 locales (hero, how-it-works step,
   store-badge line, fr greeting); **(c)** standard **mic glyph** drawn in RN views (emoji
   retired); **(d)** interview ending: final note now ACKNOWLEDGED (`final.ack`) then
   **"Getting your roadmap ready — 3…2…1" countdown** before /plan (no more abrupt jump);
   **(e)** **/contact page** (topic chips General/Feedback/Problem → /api/feedback with
   whitelisted topic in subject; footer link; hamburger Report-a-problem deep-links
   ?topic=problem). Smoke #7 (contact) caught a real bug on first run: static-export params
   arrive post-hydration — pre-selection needs an effect, not a useState initializer.
   Public smoke now 8; contract suite 7 (tts cases retired); 216 vitest; TEST-COVERAGE updated.
   NOTE: **TestFlight build 35's voice toggle silently breaks** once prod loses /api/tts —
   known + accepted; build 36 removes the toggle.

2. **App Store paperwork is DONE except the trader declaration.** All ASC fields entered +
   fixed via browser session (name→'Get Camino: Your Road to Spain', Travel/Lifestyle order,
   © 2026 AELaboratories, review notes pasted, MANUAL release, pricing $0×175 countries,
   availability all, privacy label rebuilt to 7 honest data types incl. Other Financial Info
   — income bands — and PUBLISHED). Screenshots: 5 captured on build 35, retaken twice for
   staff-only leaks (webinar pill, Dev personas strip — capture signed-out!), status bars
   normalized to 9:41 (real signal/wifi pixels kept), captioned brand frames generated →
   **docs/store-assets/framed/ is the upload set** (scripts/clean-store-shots.mjs +
   frame-store-shots.mjs; Fraunces/HankenGrotesk TTFs installed to ~/Library/Fonts for the
   renderer). **⏸ TRADER STATUS BLOCKED on an Apple support case** (org identity Proxim.us →
   AELaboratories, with a supervisor): submission CAN proceed without it but EU storefronts
   (incl. Spain) stay withheld until Trader is declared + verified post-case. Playbook:
   docs/STORE_PAPERWORK.md (now with Step 2.5 pricing — the original playbook missed it).
   When build 36 attaches: remove the ElevenLabs/TTS line from the ASC review notes.

3. **Wife-pass logistics:** test script + triage sheet at docs/testing/ (2026-07-11 files).

**SESSION CLOSE (2026-07-11 ~21:00):** build 36 confirmed IN_PROGRESS on EAS (id 43d2e8c1,
cut from 83b3e71 after the e2e-ios gate went green first-try, run 29161778493), --auto-submit
riding to TestFlight overnight. Production web verified live (8/8 public E2E). Everything
committed + pushed through the close-out commit.

**TOMORROW = SUBMISSION DAY — the runbook is `docs/testing/2026-07-12-submission-day.md`:**
(1) build 36 device verify (NO voice toggle, mic glyph, countdown ending, contact page);
(2) Cristina fresh-eyes round; (3) trader-case check → attach build 36 + upload
docs/store-assets/framed/ screenshots (6.9" slot via Media Manager) + swap the ElevenLabs
line out of the ASC review notes → **Add for Review** (manual release parks approval until
the launch moment; EU/Spain follows the trader declaration whenever Apple's case resolves).
Then: PostHog 808581 (interview-v2 + new contact_sent), and user-side cleanup (cancel
ElevenLabs plan, delete ELEVENLABS_* EAS vars, delete the stray "TEST-COVERAGE 2.md").

---

## Prior resume note (2026-07-11 morning — night batch SHIPPED; build 35 auto-submitted overnight)

**The six-item night-feedback queue is DONE, live on production web, and riding to iOS.** All six
fixes landed (hamburger cleanup, guide→interview greeting restored deterministically via
`landing.fromGuide` ×5 locales, voice OFF by default web+native, Q1 "most important question"
rewrite ×5, transcript-aware phraseAck, Dynamic-Island inset on the roadmap sheet). User verified
all four web-visible fixes live the same night. Commits 40e77f3 → 8556921, all pushed.

**FIRST MORNING ACTION — verify build 35 on the phone.** CONFIRMED SHIPPED before session close:
build number 35 (App Version 1.0.0, Build ID d3cd4e39, cut from 8556921 after e2e-ios gate green,
run 29128387898), **submitted successfully to App Store Connect at ~01:35** — Apple processing was
the only step left overnight, so it should be sitting in TestFlight by morning. On the device, the
two native-only items to verify: **(a) the roadmap sheet's "✕ Done" clears the Dynamic Island;
(b) voice defaults OFF.** Reactions + greeting ride along (shared code, already web-verified).

**The night's drama, for context (already fixed, lessons on record):**
1. **phraseAck went haywire on first prod contact** — passing the transcript made Haiku think it
   WAS the interviewer ("I'm ready for your answer whenever you share it…", inventing follow-up
   questions — screenshot-confirmed by the user). Fix (bfc4868): prompt restructured (transcript
   labeled background-only, fresh answer AFTER it, "the app runs the interview" role) **plus a
   deterministic backstop — any ack containing `?`/`¿` or >260 chars is dropped silently**.
   Verified 2× per scenario against live /api/lola before redeploying; user then confirmed live
   quality ("much tidier, still has all the right context"). LESSON: a bounded LLM surface that
   gains conversation context needs an explicit non-driver role AND a deterministic output filter.
2. **The Q1 copy change broke BOTH E2E layers' assertions** — caught Playwright pre-deploy
   (smoke #2), but the Maestro one (`03-interview.yml` "hoping to arrive") cost a full failed
   e2e-ios run (29126194857, both attempts). Swept and fixed everywhere incl. the landing demo's
   `q1` ×5 (8556921). LESSON: copy changes need a repo-wide grep across `tests-e2e/`, `.maestro/`,
   AND `locales/*/common.json` (the landing demo mirrors interview copy).

**Also new tonight:** +1 public Playwright test (guide→interview greeting regression — smoke #3,
runs on every deploy; TEST-COVERAGE.md renumbered, now 7 public + 5 authed); build-log row +
roadmap "Just shipped" item on the homework pages; three production web deploys, each 7/7 E2E
green against the live site.

**NEXT (morning):** (1) build 35 device verification (above); (2) wife's full pass on prod web +
TestFlight — "lots more testing tomorrow" per the user; (3) watch PostHog dashboard 808581 as
interview-v2 traffic accumulates (v1 baseline 167→42→12, 60 clarifies) — reactions are also worth
an eye there (ack drop-rate has no metric yet; consider capturing when the backstop fires);
(4) then the standing queue: TODO.md items 6–10 (STRATEGY.md actionables) and the growth thread
(mod-permission-first channels, Jerez FB angle — see soft-launch lessons below).

---

Last updated: 2026-07-11 ~01:00 (THIRD release wave in 24h: night-feedback batch live on web,
build 35 submitted to TestFlight overnight — supersedes 34/33/32). Prior wave same day: landing
v2 + wife-test batch (b38ff3c). Highlights of that wave: six user-testing fixes (not-sure chips,
reaction spacing, final open note, EMAIL MAGIC LINKS via /auth/confirm token_hash flow + 24h OTP
on both Supabase projects, snap-flush scroll, housing pair merged); the "+N steps" pill promoted
from the landing demo into the real interview; cobalt focus ring on text fields (amber read as
error); and LANDING V2 — home + how-it-works merged into one scrolling story (variant C won a
4-way local lab; docs/LANDING-REDESIGN.md is the record; landing_version: 2 stamped). Dashboard:
PostHog 808581. Prior morning note follows.

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
