# Obligations backlog — pulled pending sourcing

These are **real, correct Spanish obligations** that were drafted during the webinar
mining pass but pulled from the live `CATALOG` because the underlying claim does **not**
appear in any of the 15 mined webinar transcripts. They are model/domain knowledge.

**Re-add each once it has a citable source** (official: AEAT, extranjería, BOE, or a new
mined webinar that covers it). When re-adding, set `source: 'official'` (or `'webinar'`)
on the entry — see the `Source` type in `engine-controller.ts`.

Pulled on 2026-06-30.

---

## `sworn-translation` — certified sworn translation (traductor jurado)
Foreign official documents must be translated into Spanish by a *traductor jurado*. Pairs
with `apostille-documents` (which IS grounded). Almost certainly required; just not named
in the transcripts.

```ts
{
  id: 'sworn-translation',
  title: 'Obtain certified sworn translations (traductor jurado) of all apostilled foreign documents into Spanish',
  category: 'admin', severity: 'required',
  applies_if: NON_EU,
  depends_on: ['apostille-documents'],
  timing: { kind: 'relative_to_obligation', after: 'apostille-documents', offset_days: 7 },
}
```

## `convenio-especial` — buy into public healthcare
A regional scheme letting residents pay a monthly premium to access public healthcare
after a residency period. Real, but the term "convenio" never appears in the transcripts,
and the "after 1 year" detail is unverified.

```ts
{
  id: 'convenio-especial',
  title: 'Enrol in Convenio Especial to buy into public healthcare (available after 1 year of continuous residence, NLV holders)',
  category: 'health', severity: 'recommended',
  applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
  depends_on: ['nlv-health-insurance'],
  timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 365 },
}
```

## `modelo-390` — annual VAT summary
Annual VAT summary declaration for autónomos/businesses. Form number not in transcripts;
the "January" filing month is unverified.

```ts
{
  id: 'modelo-390',
  title: 'File annual VAT summary declaration (Modelo 390) in January',
  category: 'tax', severity: 'penalty',
  applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
  depends_on: ['modelo-303'],
  timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1' },
}
```

## `citizenship-jura` — oath of allegiance
Final naturalization step: the *jura* (oath) at the civil registry. The term never appears
in the transcripts. Note: when re-added, `depends_on: ['citizenship-application']` must
also be re-added to the catalog (it currently still depends on this being present only if
both are in).

```ts
{
  id: 'citizenship-jura',
  title: 'Complete jura (oath of allegiance to the Spanish Constitution and the King) at the civil registry',
  category: 'residency', severity: 'required',
  applies_if: NON_EU,
  depends_on: ['citizenship-application'],
  timing: { kind: 'relative_to_obligation', after: 'citizenship-application', offset_days: 365 },
}
```
