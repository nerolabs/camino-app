# TEST-COVERAGE.md — what's tested today

**A living map of what our tests actually cover.** Inspect it, and update it whenever tests are
added or removed. Forward-looking ideas (tests we *want*) live in `docs/BUILD.md` → "Growing E2E
coverage"; this file is the honest picture of **current** coverage.

Last updated: 2026-07-05 (deepened for the localization push — 44 → 82 passing vitest tests).

Layers, and when they run:
- **Unit / integration** (vitest, `tests/`) — deterministic, offline. Runs in `deploy.sh` and CI
  on **every push**. This is the fast safety net.
- **Web E2E** (Playwright, `tests-e2e/`) — real browser vs a **deployed** env. Runs
  **automatically on every deploy** (`deploy.sh`, against the unique URL). Staging = all 12;
  production = the 6 public only.
- **Mobile E2E** (Maestro, `.maestro/`) — iOS simulator. Runs on **big builds only** (manual
  `e2e-ios` workflow before a store-candidate build).

---

## 1. Unit / integration (vitest) — 82 passing (+7 opt-in network)

Concentrated on the deterministic core (that's the product's real risk surface):

| Area | File | Covers |
|---|---|---|
| **Engine** (determinism, ordering, gating) | `engine.test.ts` (20) | same profile → identical plan; a dependency never precedes its dependent; no dupes; 7 persona gating regressions (PH/CO citizenship tracks, unmarried-partner reunification, renewal-only, EU reg, property cluster); `isOverdue` semantics + due-today grace; anchor re-flow (completing residencia re-dates residency-anchored steps firm) |
| **Interview ↔ catalog contract** | `engine.test.ts` (invariant-2 audit) + `interview` cases | every `applies_if` field has a slot/derivation; derivations (is_eu, visa_type, colony/language); conditional slots (wants_citizenship, knows_where_to_live) |
| **This-week selector** | `this-week.test.ts` (4) | overdue / due-soon / beyond buckets; excludes done; never dates pending-anchor; nextUp = earliest beyond window |
| **Printable report** | `report.test.ts` (4) | estimated marked estimated; pending-anchor dateless; overdue/done honest; hero = first not-done; HTML-escapes titles (no injection) |
| **Weekly email digest** | `email-digest.test.ts` (6) | incomplete interview → null (no spam); pressing items → capped, overdue-first; nothing-in-window → null; deterministic; done items never appear; unsubscribe token sign/verify + tamper-fail |
| **Guide prose** | `guide-prose.test.ts` (3) | covers every obligation & nothing else; substantive (no stubs); **digit-lint** (never introduces a number the title lacks — invariant 3) |
| **Date normalization** | `date-input.test.ts` (7) | strict ISO; "2026-April-25"; Spanish months; unambiguous numerics only; today/hoy; rejects junk; preview label |
| **API contract** (opt-in, hits staging) | `api.contract.test.ts` (7) | /api/lola 400/413/role validation; /api/tts 400/413 + GET audio happy path |
| **Plan structure = frozen (localization guard)** | `plan-snapshot.test.ts` (10) | every persona's plan snapshotted as `id\|phase\|severity\|timing-state` (clock frozen) — the engine takes NO locale, so this proves localization surgery never changes WHICH steps / order / timing; + no-dupes/non-empty |
| **Abuse guards** | `api-guard.test.ts` (7) | `isAllowedOrigin` (own origins, per-deploy `camino--*`, localhost, foreign & look-alike rejects, referer); `corsPreflight` grants allowed / denies foreign / no-origin |
| **Email origin** | `server-email.test.ts` (3) | `siteOrigin` is the canonical host per env, never derived from request.url (the leak it exists to prevent) |
| **Region layer** | `regions.test.ts` (5) | `regionLabel` known/`not_sure`/unknown/non-string; slugs are stable kebab; 17+2 comunidades |
| **Sample plan validity** | `sample-profile.test.ts` (3) | only sets real slot fields; arrival floats to the future; rich plan with the right signature steps (nie/scout/720/citizenship) and the right absences (no empadronamiento without an address) |
| **Display formatters** (via RN stub) | `plan-format.test.ts` (8) | `plansDiffer` honesty gate (no-op false; add/remove/date-shift true); `diffSummary` narration; `completionLine` on-time/late/early; phase & severity label completeness |
| **Change hints** | `plan-coach.test.ts` (2) | `changeHint` per category + generic fallback |

**Infra:** `tests/stubs/react-native.ts` + `@`/`react-native` aliases in `vitest.config.ts` let
the display layer (formatters, hints — the surfaces localization touches most) be unit-tested.

**Still not unit-tested (known gaps, ranked):** the **API route handlers** beyond lola/tts
(`feedback`, `account/delete`, `email/welcome`, `email/weekly`, `email/unsubscribe`) — these do
real auth + DB work, best covered by focused integration tests or extending the opt-in contract
suite; `lib/emailTemplates.ts` HTML rendering (localization target — worth a render-snapshot);
`lib/analytics.ts` / `lib/monitoring.ts` (thin wrappers, low risk). See the strategy below.

---

## 2. Web E2E user flows (Playwright) — 11 tests

Runs against a deployed env on every deploy. **Public** = signed-out, no secrets. **Authed** =
a seeded staging test user (magic-link token → session → storageState; the seed refuses prod).

### Public (6)
1. **Home renders** — hero, "Build my free roadmap" CTA, footer disclaimer; zero uncaught JS errors.
2. **Interview starts (live LLM)** — /interview → "Let's get started" → a real `/api/lola` turn →
   Lola's first question (passport) appears → composer + voice pill present.
3. **Plan empty state (signed out)** — /plan → "No roadmap yet" + footer; a real page, not a crash.
4. **Content pages load** — how-it-works, the how-i-was-built essay, the build log.
5. **Sample plan** — /sample-plan renders the full read-only roadmap (Susan & Tom), phase headers,
   the interview CTA, and signature obligations (non-lucrative visa, empadronamiento).
6. **SEO surface** — robots.txt is open + points at the sitemap; sitemap.xml lists /guide pages;
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
3. **03-interview** — launch → "Build my free roadmap" → Lola's landing → "Let's get started" →
   Question 1 (a real `/api/lola` turn) → type an answer, **verified it landed** → send →
   Question 2 (a second real turn). Exercises native keyboard input + the LLM path.

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
2. **Interview extraction is language-agnostic** (opt-in network test): Spanish input →
   correct English slug (`"Somos estadounidenses"` → `nationalities: ["US"]`;
   `"trabajo en remoto para una empresa de EE. UU."` → `employed_remote`). Proves the interview
   already works in Spanish *before* we localize, and can't regress. Add to `api.contract.test.ts`.
3. **Catalog/guide title completeness per locale** — once catalogs exist: a runtime test that
   every obligation id has a title (and prose) in every shipped locale (belt-and-suspenders to the
   tsc `Record<ObligationId,…>` type). 
4. **The four i18n lint gates** (design in `docs/LOCALIZATION.md`) as vitest, wired at L0:
   *completeness* (no missing keys), *digit-lint per locale* (a translation never changes a
   number — invariant 3), *placeholder-lint* (`{{var}}` parity), *brand-lint* ("Get Camino"/"Lola"
   verbatim). These are the mechanical guardrails that make L1/L3 fill-in-the-blanks.
5. **Email/report render snapshots** — `emailTemplates` + `reportHtml` → HTML snapshot per locale,
   so a translation can't break the markup or drop a section.

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

## 5. How to keep this honest

- **Add a row here in the same PR** that adds/removes a test — this file should never lag the suite.
- When a bug reaches a person, add its regression test to the owning layer and note it here.
- Candidate tests we intend to add: `docs/BUILD.md` → "Growing E2E coverage".
