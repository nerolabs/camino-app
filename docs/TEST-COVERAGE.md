# TEST-COVERAGE.md — what's tested today

**A living map of what our tests actually cover.** Inspect it, and update it whenever tests are
added or removed. Forward-looking ideas (tests we *want*) live in `docs/BUILD.md` → "Growing E2E
coverage"; this file is the honest picture of **current** coverage.

Last updated: 2026-07-12 night, second entry (+3 vitest — question pages: slug/shape sanity,
related ids exist, the mechanical digit guard; vitest 242). Earlier (the trust batch: +17 vitest — changelog structural honesty (4),
share-link codec (5), sample personas (4), regional specifics (4) — vitest now 239; +2 public
smoke — #9 changelog page + guide stamp, #10 shared-roadmap render + junk dead-end — public
suite now 10). Earlier same evening (final-note distillation + narrated removals: +4 plan-coach
tests — distillFinalNote parses fenced JSON to typed changes, empty-changes honesty, fail-open
{error} contract, and the per-step framing regression; vitest 222). Earlier same day
(submission-day hardening: /api/feedback gained volumeGuard counters →
+2 feedback-route tests — the 429 path with nothing reaching the inbox, and guard-runs-only-
after-validation so junk can't burn the budget; vitest 218). Prior: 2026-07-11
(Cristina-pass batch: TTS/voice retired → the 3 /api/tts contract
tests removed with the route and smoke #2's voice-pill assertion dropped; +1 public smoke —
/contact renders and the ?topic=problem deep link pre-selects the topic. Public smoke suite is
now 8). Prior: 2026-07-10 night (night-feedback batch: +1 public smoke test — guide→interview
greeting context regression; smoke #2 copy updated for the new arrival-date opener). Earlier same
day: living-roadmap release — 216 passing vitest + 10 opt-in (plan-delta, completeness,
draft-resume, ordering/chips, not-sure sentinel, income checks, language-classes); smoke E2E
reworked for the auto-start interview + landing v2; Maestro 03 now LLM-free to the send.

Layers, and when they run:
- **Unit / integration** (vitest, `tests/`) — deterministic, offline. Runs in `deploy.sh` and CI
  on **every push**. This is the fast safety net.
- **Web E2E** (Playwright, `tests-e2e/`) — real browser vs a **deployed** env. Runs
  **automatically on every deploy** (`deploy.sh`, against the unique URL). Staging = all 13;
  production = the 8 public only.
- **Mobile E2E** (Maestro, `.maestro/`) — iOS simulator. Runs on **big builds only** (manual
  `e2e-ios` workflow before a store-candidate build).

---

## 1. Unit / integration (vitest) — 242 passing (+10 opt-in network)

Concentrated on the deterministic core (that's the product's real risk surface):

| Area | File | Covers |
|---|---|---|
| **Engine** (determinism, ordering, gating) | `engine.test.ts` (20) | same profile → identical plan; a dependency never precedes its dependent; no dupes; 7 persona gating regressions (PH/CO citizenship tracks, unmarried-partner reunification, renewal-only, EU reg, property cluster); `isOverdue` semantics + due-today grace; anchor re-flow (completing residencia re-dates residency-anchored steps firm) |
| **Interview ↔ catalog contract** | `engine.test.ts` (invariant-2 audit) + `interview` cases | every `applies_if` field has a slot/derivation; derivations (is_eu, visa_type, colony/language); conditional slots (wants_citizenship, knows_where_to_live) |
| **Plan-delta primitive** (living-roadmap redesign, Phase 0) | `plan-delta.test.ts` (6) | `diffPlans` added/removed/changed by objective id; unchanged plan → empty; added preserves `after` topo order; arrival-date move → `timing` change, no add/remove; `done` churn ignored unless opted in; `summarizeDelta` counts. See `docs/INTERVIEW-REDESIGN.md` |
| **Interview completeness** (roadmap-anchored % complete, Phase 0) | `completeness.test.ts` (6) | `SLOT_WEIGHT` floor ≥1 and leverage ordering (nationalities/work_situation/intends_long_stay > has_pets); COMPUTE_ALSO_READS credits derivation-body reads (employer_country_is_foreign, ex-colony — 2026-07-10 audit); empty profile → 0, full persona → 1; `answeredWeight` monotonic; partial strictly between |
| **Anonymous interview draft** (resume without a DB, Phase 0) | `interview-draft.test.ts` (5) | save/load round-trip with completeness + lastSlotField; persists only real slot answers (drops derived/stray); null on missing/empty/corrupt; `clearDraft`; no-op when storage unavailable |
| **Interview ordering & input schema** (Phase 1 + 2026-07-10 audit) | `interview-order.test.ts` (7) | every slot has a unique `order` + valid `input`; `allowOther` only on option/list slots; `nextSlot` opens speaks_spanish → nationalities and front-loads payoff before sensitive (income/assets deferred); a full persona leaves no slot unasked; employer_country_is_foreign asked directly after work_situation for remote employees; ex-colony question skipped when the passports already show one (asked for the US dual-national fallback) |
| **"Not sure yet" sentinel** (2026-07-10 wife-test batch) | `not-sure.test.ts` (3) | only the 6 uncertainty-prone yes/no slots offer it (never hard forks); `not_sure` fails both eq gates — no property cluster, gated follow-ups unasked; still counts as answered so the interview completes |
| **Income threshold advisories** (2026-07-10 audit) | `income-check.test.ts` (4) | NLV/DNV checks fire only when even the band TOP is below the household threshold (28,800+7,200/dep; ~34,000+13,000+4,000); borderline bands stay silent; unanswered income → no gate |
| **Chip localization coverage** (Phase 1) | `interview-chips.test.ts` (3) | every slot has static question copy in all 5 locales; `chips.yes/no/other/notSure` present; every option value on an option slot has a label in all 5 locales (regions via `regionLabel`) — guards against a raw enum ("employed_remote") rendering as a chip |
| **language-classes advisory gating** (Phase 1) | `language-classes.test.ts` (3) | `speaks_spanish` "None yet"/"A little" → the language-classes step applies; "Conversational"/"Fluent or native" → absent; unknown/unanswered → absent (so the Spanish opener pays off without touching the passport-based DELE exemption) |
| **This-week selector** | `this-week.test.ts` (4) | overdue / due-soon / beyond buckets; excludes done; never dates pending-anchor; nextUp = earliest beyond window |
| **Printable report** | `report.test.ts` (4) | estimated marked estimated; pending-anchor dateless; overdue/done honest; hero = first not-done; HTML-escapes titles (no injection) |
| **Weekly email digest** | `email-digest.test.ts` (6) | incomplete interview → null (no spam); pressing items → capped, overdue-first; nothing-in-window → null; deterministic; done items never appear; unsubscribe token sign/verify + tamper-fail |
| **Guide prose** | `guide-prose.test.ts` (3) | covers every obligation & nothing else; substantive (no stubs); **digit-lint** (never introduces a number the title lacks — invariant 3) |
| **Date normalization** | `date-input.test.ts` (7) | strict ISO; "2026-April-25"; Spanish months; unambiguous numerics only; today/hoy; rejects junk; preview label |
| **API contract** (opt-in + per-staging-deploy) | `api.contract.test.ts` (7) | /api/lola 400/413/role validation (the /api/tts cases retired with the route, 2026-07-11); **Spanish-extraction gate** (3): real extraction prompt (`lib/extractionPrompt.ts`) via the deployed /api/lola — "Somos estadounidenses"→`["US"]`, "trabajo en remoto…"→`employed_remote`, "estamos casados"→`true`. Runs in `deploy.sh` on every STAGING deploy (against the unique URL) and via `npm run test:api` |
| **Plan structure = frozen (localization guard)** | `plan-snapshot.test.ts` (10) | every persona's plan snapshotted as `id\|phase\|severity\|timing-state` (clock frozen) — the engine takes NO locale, so this proves localization surgery never changes WHICH steps / order / timing; + no-dupes/non-empty |
| **Abuse guards** | `api-guard.test.ts` (8) | `isAllowedOrigin` (own origins, per-deploy `camino--*`, localhost, foreign & look-alike rejects, referer); `corsPreflight` grants allowed / denies foreign / no-origin |
| **Email origin** | `server-email.test.ts` (3) | `siteOrigin` is the canonical host per env, never derived from request.url (the leak it exists to prevent) |
| **Region layer** | `regions.test.ts` (4) | `regionLabel` known/`not_sure`/unknown/non-string; slugs are stable kebab; 17+2 comunidades |
| **Sample plan validity** | `sample-profile.test.ts` (3) | only sets real slot fields; arrival floats to the future; rich plan with the right signature steps (nie/scout/720/citizenship) and the right absences (no empadronamiento without an address) |
| **Display formatters** (via RN stub) | `plan-format.test.ts` (8) | `plansDiffer` honesty gate (no-op false; add/remove/date-shift true); `diffSummary` narration; `completionLine` on-time/late/early; phase & severity label completeness |
| **Change hints** | `plan-coach.test.ts` (2) | `changeHint` per category + generic fallback |
| **Welcome route (dedupe)** | `welcome-route.test.ts` (5) | the welcome-once handler with mocked Supabase/Resend: 401 unauth; already-welcomed → no send, no write; **claim-before-send ordering** (the anti-3×-send property); send failure rolls the claim back; `user_metadata.lang` → localized welcome |
| **Profile persistence (dedupe of silent data loss)** | `profile-db.test.ts` (5) | saveProfile upsert error → captureError with code+op (the anti-silent-data-loss guard after the 2026-07-05 grant incident); success → no alert; loadProfileRow is_staff-migration fallback stays quiet; both-reads-fail → alert |
| **API route handlers** | `feedback-route` (8) · `account-delete-route` (4) · `unsubscribe-route` (6) · `weekly-route` (6) | mocked Supabase/Resend. feedback: caps (400/413), hardcoded recipient (no caller redirect), HTML-escape, Sentry-on-fail, **volume guard 429 + guard-after-validation (2026-07-12)**. account-delete: token-owner only, profile-row-before-user order, 401s, 500-not-partial. unsubscribe: REAL HMAC gate (forged/cross-uid rejected), opt-out write, GET+POST. weekly: CRON_SECRET gate, opt-out skip, roundup-vs-nudge, 6-day gap, per-user lang, metadata writes, **per-recipient magic links** (sent html carries /auth/confirm?token_hash=…&next= — scanner-safe, 2026-07-10) |
| **Render snapshots (localization guard)** | `render-snapshot.test.ts` (8) | full-HTML snapshots of all 3 emails (`welcomeEmail`/`roundupEmail`/`nudgeEmail`, fixed digest + URLs) and the printable report (`reportHtml`, one of every timing state, frozen clock) — in BOTH languages since L1. The en snapshots passed unchanged through the lang-param refactor = byte-identical output for existing users |
| **es digest (L1)** | in `email-digest.test.ts` (1 of 7) | `buildDigest(…, 'es')` selects the SAME items (selection is locale-free) with Spanish titles, when-labels ("vencía el …"), and tips |
| **The 4 i18n lint gates (L0)** | `i18n-lint.test.ts` (1 + 4×per-locale) | scans `locales/<lang>/*.json` from disk — adding a locale directory enrolls it automatically (es enrolled at L1). en self-check (no empty strings, well-formed `{{placeholders}}`); per non-English locale: *completeness* (exact en key set), *digit-lint* (translation never changes a number — invariant 3), *placeholder-lint* (`{{var}}` parity), *brand-lint* ("Get Camino"/"Lola" verbatim) |
| **Per-locale catalog titles (L1/L3)** | `catalog-titles.test.ts` (4×locale) | the 63 obligation titles in Spanish (`core/i18n/es/catalog.ts`): completeness over the full CATALOG (obligation #64 fails until every locale follows), digit-lint on the legal content, substantive-length check, `displayTitle` resolution + English fallback |
| **es display formatters (L1)** | in `plan-format.test.ts` (2 of 10) | `changeLanguage('es')` → phase labels, completion narration ("3 días tarde"), and dates ("Vence el …") render in Spanish; en unchanged after a language round-trip |
| **Per-locale guide prose + helpers (L1/L3)** | `guide-prose-locales.test.ts` (3×locale + 4) | the 60 es explainers: completeness / digit-lint (⊆ es title digits — invariant 3 per locale) / substantive + brand parity with the English twin; `describeTimingLocalized(en)` pinned byte-identical to core `describeTiming` for all 60 (core stays i18n-free — server code imports it); category labels/tips en-parity; es timing sentences render Spanish |

**Infra:** `tests/stubs/react-native.ts` + `@`/`react-native` aliases in `vitest.config.ts` let
the display layer (formatters, hints — the surfaces localization touches most) be unit-tested.

**Still not unit-tested (known gaps, ranked):** **all API route handlers now have integration
tests** (lola via the opt-in contract suite; welcome/feedback/account-delete/unsubscribe/
weekly via mocked-Supabase specs — the audit's gap, closed 2026-07-05; /api/tts retired
2026-07-11 with Lola's voice). Remaining low-risk:
`lib/analytics.ts` / `lib/monitoring.ts` (thin wrappers). See the strategy below.

---

## 2. Web E2E user flows (Playwright) — 12 tests

Runs against a deployed env on every deploy. **Public** = signed-out, no secrets. **Authed** =
a seeded staging test user (magic-link token → session → storageState; the seed refuses prod).

### Public (8)
1. **Home renders** — hero, "Build my free roadmap" CTA, footer disclaimer; zero uncaught JS errors.
2. **Interview auto-starts + one live LLM turn** — /interview opens straight into the greeting +
   arrival opener (no button since the 2026-07-10 redesign) → a typed date round-trips the real
   `/api/lola` → the Spanish-level chips arrive.
3. **Guide→interview greeting context (regression, 2026-07-10)** — /interview?from=choose-visa-type
   → the greeting names the guide ("I see you've been reading about…"); guards the context the
   guide CTA carries, which silently vanished once when the LLM opener became static copy.
4. **Plan empty state (signed out)** — /plan → "No roadmap yet" + footer; a real page, not a crash.
5. **Content pages load** — /how-it-works redirects home (content folded into the landing, 2026-07-10) where the demo section is asserted; the how-i-was-built essay; the build log.
6. **Sample plan** — /sample-plan renders the full read-only roadmap (Susan & Tom), phase headers,
   the interview CTA, and signature obligations (non-lucrative visa, empadronamiento).
7. **Contact page + topic deep link (2026-07-11)** — /contact?topic=problem renders the form and
   the "Report a problem" chip arrives pre-selected (aria-selected) — guards the hamburger's
   report-a-problem route into the generalized contact page.
8. **SEO surface** — robots.txt is open + points at the sitemap; sitemap.xml lists /guide pages;
   the auto `_sitemap` route stays 404.

### Authed (5, + a setup step that proves the seeded session loads the roadmap)
7. **Saved roadmap loads signed-in** — /plan shows "Your roadmap", the NIE step, and the stats chips.
8. **"This week" view** — toggles to the week view and shows an honest state (slipped / due / clear
   week); toggles back to the full roadmap.
9. **Mark done + Undo** — open the NIE step → "✓ Mark done" → the "done" stat appears → reopen →
   "✓ Done" → Undo restores it.
10. **No-op re-model stays honest (live LLM)** — open a step → "Something changed" → "nothing
    changed" → the live extractor runs → the app says "Thanks / noted", **never** "remodelled your
    plan" over a no-op (the build-24 family bug, now guarded).
11. **Sign out** — menu → Sign out → returns to the signed-out app.

---

## 3. Mobile E2E user flows (Maestro, iOS) — 3 gated + 1 local

Runs on an iOS simulator, big builds only. Proves the **native shell**: the app launches, renders,
navigates, and drives the interview with a real LLM turn (the web suite covers the shared logic).

### In the CI gate (3)
1. **01-home** — launch (clear state) → the home screen renders (Build my free roadmap, the
   Get Camino wordmark, the sample-roadmap link).
2. **02-sample-plan** — launch → tap the sample-roadmap link → "SAMPLE ROADMAP" + Susan's plan.
3. **03-interview** — launch → "Build my free roadmap" → the interview auto-starts (greeting +
   the static arrival opener; no LLM wait since the 2026-07-10 redesign) → type an answer,
   **verified it landed** → send → **the answer posts to the conversation**. Exercises native
   keyboard input; fully deterministic up to the send.
   *Deliberately stops before "Question 2" — that needs a live extraction call and is
   CI-latency-nondeterministic (failed both retries in run #9). "Answering advances the interview"
   is identical logic to web (covered manually every build + the planned full-interview web flow,
   §4B). A gate must not hinge on two back-to-back LLM round-trips.*

### Written but EXCLUDED from CI (local-only)
4. **04-authed-roadmap** — deep-link sign-in → seeded roadmap → open a step → mark done.
   **Not in the gate:** opening iOS deep links via Maestro on CI is a documented, unresolved flake
   (the "Open in app" SpringBoard alert isn't in the a11y tree — Maestro #2610). This journey is
   covered by web authed flows 7–11 (identical React components) + manual on-device sign-in every
   build. Re-fold when #2610 is fixed or a known-good Maestro is pinned. See `docs/BUILD.md`.

---

## 4. Strategy — deepening coverage before localization

The core product is ~95% done; the next big surgery is **localization** (extract every UI string
into per-locale catalogs, wrap components, add `/es` routing). That's exactly the kind of broad,
mechanical change that silently breaks things — so the investment now is a **regression harness we
can refactor against fearlessly**. Sequenced:

### A. Localization-hardening (the priority — land BEFORE L0)
1. ✅ **Engine structural snapshot** (`plan-snapshot.test.ts`) — done. The engine is locale-free;
   this proves it stays that way.
2. ✅ **Interview extraction is language-agnostic** — done 2026-07-05 (3 cases in
   `api.contract.test.ts`, verified live against staging). The extraction prompt was moved to
   the pure `lib/extractionPrompt.ts` so the test exercises the EXACT prompt the app sends —
   no test-only copy to drift. Runs on every staging deploy via `deploy.sh`.
3. **Catalog/guide title completeness per locale** — once catalogs exist: a runtime test that
   every obligation id has a title (and prose) in every shipped locale (belt-and-suspenders to the
   tsc `Record<ObligationId,…>` type). 
4. **The four i18n lint gates** (design in `docs/LOCALIZATION.md`) as vitest, wired at L0:
   *completeness* (no missing keys), *digit-lint per locale* (a translation never changes a
   number — invariant 3), *placeholder-lint* (`{{var}}` parity), *brand-lint* ("Get Camino"/"Lola"
   verbatim). These are the mechanical guardrails that make L1/L3 fill-in-the-blanks.
5. ✅ **Email/report render snapshots** — done 2026-07-05 (`render-snapshot.test.ts`, 4
   snapshots: 3 emails + the report). Extend per-locale at L1.

**→ With 1, 2 and 5 green, the localization HARD GATE is CLEAR: L0 may start.** (3 and 4 are
built INTO L0 by design — they need the string catalogs to exist.)

### B. Web (Playwright) — grow the deployed-env flows (each costs a few live LLM calls)
6. **Full interview → roadmap** (currently only "interview starts"): drive typed answers through
   to a generated roadmap with expected signature steps. The highest-value uncovered journey.
7. **Real re-model** (we have the no-op): open a step → "we had a baby" → a school step appears +
   "remodelled" is honestly shown.
8. **Region-aware**: choose a comunidad → the regional note names it on the roadmap.
9. **PDF export** doesn't error; the report opens.
10. **A guide page** renders its official-source link + interview CTA; **per-locale smoke** (home +
    interview in `es`) once L2 ships.

### C. Mobile (Maestro) — incremental, respecting the flakiness
Mobile CI is irreducibly flaky (cold-boot, LLM latency) — so **keep flows short and deterministic,
add one at a time, and prove each is reliable (2 green) before adding the next.** Candidates, in
order of signal-per-flakiness: **PDF export** (native share sheet), **voice toggle**, **This-week
toggle** on a seeded plan. Authed-dependent native flows wait for Maestro #2610. The gate stays
retry-tolerant and big-builds-only.

### D. Fill the remaining unit gaps (cheap, deterministic, every-push)
The API route handlers (feedback/account/email) via focused integration tests; `emailTemplates`
render snapshots (doubles as A5). Do these opportunistically — they're not localization-blocking.

**Operating rule:** every bug that reaches a person earns a regression test in the owning layer,
added in the same fix. The suites are meant to grow.

## 5. Critical-path coverage verdicts (fresh-eyes audit, 2026-07-05)

The ten critical paths from `docs/AUDIT-BRIEF-TESTING.md`, walked against the suites as they
actually are. "Covered" means automated; honest exceptions are named, not hidden.

| # | Path | Covered by | Verdict | Gap / action |
|---|---|---|---|---|
| 1 | Visitor → interview → completed roadmap | Web E2E #2 (interview starts, 1 live turn) + Maestro 03 (native shell to answer-posted) + extraction contract tests | **PARTIAL** | The full multi-turn journey is the biggest uncovered flow. Build as an opt-in Playwright project (pre-release, not per-deploy — ~17 live LLM turns/run), §4B6 |
| 2 | Email-me-my-roadmap → magic link → signed-in roadmap | `auth.setup.ts` proves token→session→roadmap per deploy | **PARTIAL** | Real email delivery + `pending_profile` adoption are manual-only; adoption belongs in a handler integration test |
| 3 | Living-plan ops (done/undo, re-flow, re-model honesty) | Authed E2E #9–10 + engine anchor-re-flow unit + `plansDiffer` units | **GOOD** | Real re-model E2E ("we had a baby" → school step) still planned, §4B7 |
| 4 | This-week · PDF · region rendering | This-week: unit + authed E2E #8 ✓. PDF: `reportHtml` units + render snapshot. Region: units + seeded `madrid` fixture | **PARTIAL** | No E2E asserts the PDF export button or the regional note on the page (§4B8–9, cheap) |
| 5 | Guides/SEO (60 pages, sitemap, robots, JSON-LD) | Prose units + digit-lint; smoke #5/#7 (robots, sitemap, content pages) | **GOOD** | A single guide-page E2E (source link + CTA) is a cheap add, §4B10 |
| 6 | Email loop (welcome-once, digest, unsubscribe, nudge) | Digest logic units (6) + unsubscribe-token unit + render snapshots | **PARTIAL** | The welcome-once dedupe (a real 3×-send bug) and the route handlers have NO regression test — top of gap list §4D |
| 7 | Account deletion · feedback route | Nothing automated (each manually E2E-verified once) | **GAP** | Honest exception for now; right layer = handler integration tests with mocked Supabase/Resend, §4D |
| 8 | API abuse guards (caps, rate limits, CORS) | `api-guard` units (8) + contract tests now on every staging deploy | **GOOD** | Durable 429 burst verified manually once; deliberately not per-deploy (bursting our own API each deploy is self-harm) — documented exception |
| 9 | Native shell (launch, render, navigate, keyboard, 1 LLM turn) | Maestro 01/02/03, retry-once, big-builds-only, Maestro now pinned 2.6.1 | **COVERED, unverified** | Flow-03 trim must be confirmed on the next deliberate `e2e-ios` run (don't burn runs for it) |
| 10 | Localization invariants | `plan-snapshot` (10) + Spanish extraction (3, live-verified) + render snapshots (4) | **GATE CLEAR** | The 4 i18n lint gates land inside L0 with the string catalogs |

**Native-testing verdict (deliverable 4): keep the current scope.** Evidence: 9 `e2e-ios`
dispatches → 1 green; the failures were environment (cold boot, LLM latency), not product; runs
cost 30–75 min each. The trim of flow 03 is correct (both #9 retries died on the second
sequential LLM round-trip; the "thinking" spinner is a disappearing element and would flake in
the opposite direction). Flow 04 stays excluded: Maestro #2610 is closed-stale ("waiting for
customer response"), regression window 1.40+; re-pinning to 1.39.13 would risk the three green
flows on the Xcode 26 image for the sake of one excluded flow. Improvements applied instead:
Maestro pinned to 2.6.1 (the green run's version — reproducibility), and the two-tier policy is
confirmed empirically right.

## 6. How to keep this honest

- **Add a row here in the same PR** that adds/removes a test — this file should never lag the suite.
- When a bug reaches a person, add its regression test to the owning layer and note it here.
- Candidate tests we intend to add: `docs/BUILD.md` → "Growing E2E coverage".
