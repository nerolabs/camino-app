# Obligations backlog — CLEARED (all re-added 2026-07-02)

These four obligations were pulled from the live `CATALOG` on 2026-06-30 because the claim
wasn't grounded in any mined webinar. On **2026-07-02** each was verified against an official
`.gob.es` source (details corrected where the draft was wrong) and re-added with
`source: 'official'` + `source_url`. Nothing here is pending anymore — kept for provenance.

| id | official source | correction applied on re-add |
|----|-----------------|------------------------------|
| `sworn-translation` | MAEC (exteriores.gob.es) — sworn-translator registry | title notes only a MAEC-appointed *traductor jurado* confers official validity |
| `convenio-especial` | Ministerio de Sanidad (sanidad.gob.es) | added the real figures: ≥1 yr continuous residence + padrón; €60/mo under 65, €157/mo 65+ |
| `modelo-390` | AEAT sede | confirmed: informative recap of the year's Modelo 303, first 30 days of January, electronic only |
| `citizenship-jura` | Ministerio de Justicia (mjusticia.gob.es) | title now states the real rule: jura within **180 days** of the grant notification (art. 23 CC) or the concession lapses |

The original drafts + rationale are preserved below.

---

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
