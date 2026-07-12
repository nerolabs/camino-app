# Engine/catalog audit — 2026-07-12 (user call: ahead of everything)

**Why now:** the build-37 shred proved the mechanical audit (invariant 2) can't catch WRONG
conditions — only unaskable fields. Three condition-level bugs reached a real household in
one afternoon (Spanish national offered EX-18; mixed household's non-EU spouse stepless;
the "Andrew" test persona ASSERTING the bug). Last condition-level cross-check: 2026-07-03.
Catalog has moved 60 → 64 since; the interview was rebuilt.

**Method:**
1. **Persona-matrix sweep** — `scripts/audit-matrix.ts`: 177 profiles (passports × work ×
   household × housing) × class-level expectations, plus `--dump` for eyeball review.
   Expectations grow as findings are fixed (each fix adds its rule to the matrix).
2. **Condition-by-condition review** of all 64 obligations — substrate: `docs/CATALOG.md`
   (regenerated same day; human-readable applies_if + reverse index).
3. **Slot/derivation review** — every derivation's semantics vs its consumers.

**Fix discipline:** like the shred fixes — regression tests + changelog entry + locale
sweep per fix; anything needing new sourced content goes to the ranked backlog below, not
into the catalog on vibes (invariant 3).

---

## Findings

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| A1 | HIGH | `empadronamiento` + `tarjeta-sanitaria` gated on `has_spanish_address` — movers who haven't picked housing NEVER see the padrón (the most fundamental arrival step). Applicability confused with timing: the padrón applies to every long-stay mover; the address just isn't known *yet*. Also silently weakened `residencia`'s ordering (its padrón prerequisite vanished). The old "Minimal" persona note had flagged the empty-plan symptom. | **FIXED 2026-07-12** — gate on `intends_long_stay` (tarjeta keeps its NLV exclusion); snapshots deliberately updated; matrix expectation added |
| A2 | MED | `job_seeker → visa_type 'nlv'` — a job seeker was served the full NLV cluster *including the notarized not-going-to-work declaration*. The NLV forbids work; no general job-seeker visa exists for non-EU. | **FIXED 2026-07-12** — job_seeker now derives `visa_type: null` (honest unknown): they keep `choose-visa-type` + the generic document mechanics, lose the misleading NLV cluster. Advisory step for the work-sponsorship reality → backlog B1 |
| A3 | MED | The `work_permit` and `self_employment` visa ROUTES have no route-specific catalog steps (work_permit: nothing; self_employment: only post-arrival autónomo registration). Generic mechanics (consulate/apostille/criminal/translations) do apply. | **BACKLOG B1** — needs a sourcing session (employer-sponsored work-visa steps; cuenta-propia visa evidence), not a same-day patch |
| A4 | MED | Student path thin: exactly ONE student-gated item (visa health insurance). No enrollment/homologación steps for anyone; EU students see nothing student-shaped at all. (From the shred, row 6.) | **BACKLOG B2** — sourcing session |
| A5 | — | (from the shred, already fixed today) Spanish nationals offered EX-18; mixed households missing EX-19. | FIXED pre-audit; matrix expectations encode both |

## Ranked backlog (needs sourced content — do NOT patch on vibes)

- **B1 — work-route steps** (work_permit + self_employment visas): employer-files-it advisory
  for sponsored work; cuenta-propia evidence list. Sources: inclusion.gob.es autorizaciones.
- **B2 — student steps**: university enrollment timing, homologación de títulos (credential
  recognition), student-TIE nuances. Sources: universidades.gob.es + sede.educacion.
- **B3 — job-seeker advisory**: a `recommendation` step stating the honest reality (non-EU
  job seekers generally need an employer-sponsored visa arranged BEFORE moving) — needs
  careful wording + source.
- **B4 — short-stay EU advisories**: A1's fix makes short-stay EU plans honestly
  advisory-only/empty (correct!). Consider sourced niceties: EHIC card, travel-insurance
  note — plus friendly "short stays travel light" empty-state copy (A6).

## Additional findings (during A1/A2 implementation)

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| A6 | LOW | Short-stay EU plans are now honestly empty/advisory-only — /plan and the pane should SAY why ("short stays travel light") instead of a generic empty state | BACKLOG (with B4) |
| A7 | META | THREE more tests were found asserting buggy behavior as correct (sample-profile pinned "padrón absent"; the audit script + persona floor treated the bug's side-effects as invariants). Pattern: when fixing a condition, grep tests for assertions that encode the OLD behavior — they will pass until reality disagrees. | Noted in fix discipline |
| A8 | LOW | audit-catalog's empty-plan check now allowlists the short-stay-EU class by DERIVED formula (not persona names) — keep it formula-based | DONE |

## Condition-by-condition review (64 obligations)

Substrate: docs/CATALOG.md. Mark each ✓ (condition right), ✗ (finding above), ○ (not yet
reviewed). Sections below get filled as the pass proceeds — IN PROGRESS.

- ✗→✓ empadronamiento, tarjeta-sanitaria (A1) · ✓ eu-registration-certificate,
  eu-family-member-card (fixed in shred) · ✓ nie, residencia, choose-visa-type,
  consulate-appointment (reviewed with A1/A2) · ✗ (A2) visa_type derivation (fixed) ·
  ○ everything else — resume here.
