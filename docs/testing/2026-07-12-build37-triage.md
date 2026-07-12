# Build 37 shred — triage (started 2026-07-12 ~15:50)

Build 37 (a582e47c, from b3feecf) = the Cristina-shred build; fixes bus into **build 38 =
the submission candidate** (web-visible fixes deploy immediately as usual).

| # | Found by | Finding | Root cause | Bus | Status |
|---|----------|---------|------------|-----|--------|
| 1 | Andrew (device) | Share dialog's "Share…" button does nothing on iOS | iOS can't present the OS share sheet while an RN `Modal` is open (presents from the root VC, which the Modal covers) — silent no-op. Fix: dismiss dialog first, present after the animation (~500 ms); also switched to the `url` payload on iOS. | native → 38 | **FIXED** (pending device verify on 38) |
| 2 | (self, from #1's screenshot) | Share button was amber — brand invariant says amber = Lola only | Reused the celebrate-modal's button style | both (web deploys now) | **FIXED** (cobalt) |

Side note for the record: Cristina's shred is delayed for the best possible reason — she's
out following her own Camino roadmap (driving-test steps). Her es language pass is complete
(TODO item 5 closed).
