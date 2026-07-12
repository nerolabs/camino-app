# Build 37 shred — triage (started 2026-07-12 ~15:50)

Build 37 (a582e47c, from b3feecf) = the Cristina-shred build; fixes bus into **build 38 =
the submission candidate** (web-visible fixes deploy immediately as usual).

| # | Found by | Finding | Root cause | Bus | Status |
|---|----------|---------|------------|-----|--------|
| 1 | Andrew (device) | Share dialog's "Share…" button does nothing on iOS | iOS can't present the OS share sheet while an RN `Modal` is open (presents from the root VC, which the Modal covers) — silent no-op. Fix: dismiss dialog first, present after the animation (~500 ms); also switched to the `url` payload on iOS. | native → 38 | **FIXED** (pending device verify on 38) |
| 2 | (self, from #1's screenshot) | Share button was amber — brand invariant says amber = Lola only | Reused the celebrate-modal's button style | both (web deploys now) | **FIXED** (cobalt) |
| 3 | Cristina (dual US/ES profile) | "Roadmap stopped populating" — pane empty until Q6 | Mostly BY DESIGN for her profile (fluent + EU passport zeroes the early adders; everything waits on `intends_long_stay`) — but the silent pane reads as broken. Fix: EU-aware empty state ("no visa paperwork to add — steps appear as we pin down timing"), ×5 locales. | both | **FIXED** (UX) |
| 4 | Cristina (same run) | Spanish passport holder offered "Central Register of FOREIGN Nationals" (EX-18) | `applies_if` treated all EU passports alike; the step's own title says "not needed for Spanish nationals". New `is_spanish_national` derivation + condition; regression tests (dual US/ES excluded, DE still included); /changelog entry. | both | **FIXED** (catalog) |
| 5 | Andrew (challenge on #4) | Mixed household (US + ES passports) isn't "a full EU household" — the US spouse had NO residence step at all | The passports answer is a SET (can't say who holds what) and `is_eu = anyone-EU` waved the whole household through. New clarifying question (asked only for mixed households moving with family) + NEW catalog obligation `eu-family-member-card` (EX-19, verified vs inclusion.gob.es hoja 62). Catalog 63→64. The kicker: the "Andrew" test persona had been ASSERTING the buggy behavior — the suite blessed the bug until the real household hit it. | both | **FIXED** (catalog + interview) |
| 6 | Andrew ("what does Student add?") | "Student" answer adds nothing visible for an EU profile — and the student catalog is thin overall | For EU/Spanish students that's CORRECT (no student visa) — but the catalog has exactly ONE student-gated item (visa health insurance); no university-enrollment/credential-recognition (homologación) steps exist for anyone. | — | **LOGGED** → feeds the full engine audit (below) |

Side note for the record: Cristina's shred is delayed for the best possible reason — she's
out following her own Camino roadmap (driving-test steps). Her es language pass is complete
(TODO item 5 closed).
