# Camino — TODO / status tracker

Living list of what we're tracking against. Update as work moves. Newest context at top.
See `HANDOFF.md` for the fuller picture and `core/SOURCING.md` for obligation provenance.

Last updated: 2026-06-30.

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

## 🔜 Next (candidates, not yet started)

- [ ] **Capture `residency_established` as a known-later field** — let users update it post-move
      so residency-anchored items become firm instead of estimated. (Needs a post-move edit flow.)
- [ ] **Re-add backlog items once sourced** — `sworn-translation`, `convenio-especial`,
      `modelo-390`, `citizenship-jura` (see `core/OBLIGATIONS_BACKLOG.md`).
- [ ] **More webinars** (when available) — health insurance, schooling, banking detail — toward
      the ~100-obligation target.

## 🐞 Known issues

- _(none open — `tsc --noEmit` is green.)_

## Invariants (do not break — see ../camino/CLAUDE.md)

1. Engine is deterministic — no LLM in plan-building.
2. Interview is derived from the catalog (every `applies_if` field has a slot or derivation).
3. Lola never invents deadlines/costs/laws — hence the `source` field + SOURCING.md.
4. The plan is a pure function of the profile.
