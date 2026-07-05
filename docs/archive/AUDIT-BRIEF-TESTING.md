> ARCHIVED 2026-07-05: this brief was EXECUTED the same day (all 5 deliverables — see
> docs/TEST-COVERAGE.md §5 and HANDOFF.md). Kept for the record of mandate + method.

# AUDIT BRIEF — fresh-eyes testing audit (prepared 2026-07-05 for a new session)

**Mandate (user):** with fresh eyes, audit ALL testing — end-to-end, unit, integration, the build
pipeline's critical-path coverage, and native testing — before the localization push begins.
Testing and localization are the two named areas of complexity heading into launch; the core
product is ~95% done and about to absorb heavy user feedback. **Challenge prior decisions, don't
inherit them** — the scoping calls below were made under iteration pressure by the previous
session; verifying OR overturning them is in scope.

## Method (suggested)
1. Read `docs/TEST-COVERAGE.md` (the claimed map) — then **verify it against reality**: run
   `npm test` (expect 82 passed / 7 skipped), read the specs, confirm the doc doesn't flatter.
2. Read `docs/BUILD.md` (the two-tier gate + pipeline) and `scripts/deploy.sh` (the per-deploy
   web-E2E gate). Confirm the gates actually run what they claim.
3. Walk the **critical paths** below against the suites; produce a coverage verdict per path.
4. Update `docs/TEST-COVERAGE.md` with findings; fix cheap gaps directly; plan expensive ones.

## Critical paths (verify each has automated coverage somewhere, or an explicit honest exception)
1. Visitor → interview (live LLM) → **completed roadmap** (the funnel; web E2E currently stops
   after ONE answer — the full journey is planned §4B, not built).
2. Email-me-my-roadmap → silent account → emailed link → signed-in roadmap (magic-link machinery).
3. Saved roadmap living-plan ops: mark-done/undo, date re-flow, re-model (real + no-op honesty).
4. This-week view · PDF export · region-aware rendering.
5. Guides/SEO surface (60 pages, sitemap, robots, JSON-LD).
6. Email loop: welcome-once, weekly digest caps/honesty, unsubscribe, nudge.
7. Account deletion (hard delete) · feedback route.
8. API abuse guards: payload caps, durable rate limits, strict CORS (unit + live burst).
9. Native shell: launch, render, navigation, keyboard input, one LLM turn.
10. (Soon) localization invariants: engine locale-free; translations change no numbers/brands.

## Decisions to re-examine with fresh judgment (made under pressure 2026-07-04→05)
- **Native flow 03 trimmed** to stop before "Question 2" (a 2nd sequential LLM call failed both
  retries in CI run #9). Trim committed but **UNVERIFIED in CI** — verify on the next deliberate
  big-build run. Is stopping at "answer posted" the right scope, or is there a smarter
  deterministic anchor (e.g. the thinking spinner appearing) worth asserting?
- **Native authed deep-link flow (04) excluded** from CI on Maestro bug #2610 (SpringBoard alert
  invisible to a11y tree; memory `maestro-ios-deeplink-flake`). Re-check: has #2610 moved? Is
  pinning pre-1.40 Maestro on the runner a cheap win worth a spike?
- **Two-tier policy** (web E2E per-deploy; native E2E big-builds-only, retry-once) — sanity-check
  the tiers against actual cost/flakiness data from runs #1–#9 (`gh run list --workflow=e2e-ios`).
- **Production deploys run public-suite only** (authed seeds a test user; must never touch prod
  DB). Confirm this boundary is airtight (seed.mjs hard-refuses prod — verify).
- **API contract tests are opt-in/network** (`test:api`) — should any become part of the
  per-deploy gate now that deploy.sh already tolerates network steps?

## Known gaps the previous session left (ranked; see TEST-COVERAGE §4)
- **Localization gate items (BLOCKING L0):** Spanish-input extraction test (Spanish answer →
  correct English slug — proves the interview already speaks Spanish); email/report HTML render
  snapshots; the 4 i18n lint gates (completeness / per-locale digit-lint / placeholder / brand)
  to be built INTO L0.
- Web E2E: full interview→roadmap journey; real re-model; region-aware; PDF; per-locale smoke.
- Unit: API route handlers (feedback / account-delete / welcome / weekly / unsubscribe).
- Mobile: one-at-a-time additions (PDF share sheet, voice toggle, This-week) — each proven
  reliable (2 green) before the next.

## Constraints (standing)
- EAS **builds only on user command**; `e2e-ios` is big-builds-only — **don't burn runs
  iterating**; batch native-flow changes for the next deliberate run.
- Web deploys are cheap and auto-run the Playwright gate — use staging freely.
- Update `docs/TEST-COVERAGE.md` in the same change as any test add/remove (CLAUDE.md rule).
- Localization work (TODO Phase 2) is HARD-GATED on the localization-testing items above.

## Deliverables
1. Verified/updated `docs/TEST-COVERAGE.md` (the map must match reality).
2. Critical-path coverage verdict (table: path → covered by → confidence → gap/action).
3. The localization-gate tests built and green (unblocks L0).
4. A native-testing verdict: keep current scope / extend / change approach — with reasons.
5. TODO.md updated; anything discovered mid-audit follows the every-bug-earns-a-test rule.
