# CLAUDE.md — camino-app

This is the Expo app. Two files give you the full picture — read both before working:

1. **`./HANDOFF.md`** — current state of this app, where everything lives, what was
   just done, and the suggested next tasks. Start here.
2. **`./docs/THESIS.md`** — the canonical design memory: what Camino is, the design
   thesis, and the four invariants you must not break. (Folded in from the original
   `nerolabs/camino` seed repo, now archived — this app is the single source of truth.)
3. **`./docs/STRATEGY.md`** — the standing strategy & risk review (position, growth,
   legal/PR/personal risks). Consult it whenever planning, prioritizing, or shipping
   anything user-facing; backtest its calls as reality comes in and update it when it's
   wrong. Its actionable queue lives in TODO.md's open backlog (Phase 6 growth items 20–28
   plus the ops items 16 and 31).

## Standing rules

- **With every PR / release batch:** update the two public "homework" pages so they
  stay honest — `app/how-i-was-built/log.tsx` (add a row for what shipped and the key
  decisions) and `app/how-i-was-built/roadmap.tsx` (move items between Just shipped /
  In progress / Next; bump the `UPDATED` date). Source of truth: TODO.md's roadmap.
- **When you add or remove a test:** update `docs/TEST-COVERAGE.md` in the same change —
  it's the living map of what's covered (unit/integration + web & mobile E2E user flows).
  Every bug that reaches a person earns a regression test in the layer that owns it.

@AGENTS.md
