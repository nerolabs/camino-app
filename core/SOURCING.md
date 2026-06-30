# Obligation sourcing log

Provenance for obligations marked `source: 'official'` in `engine-controller.ts`.
Verified 2026-06-30 via web research. Re-verify annually — several figures track IPREM
or the minimum wage (SMI) and change with the national budget.

> ⚠️ These were verified against official Spanish government portals
> (agenciatributaria.gob.es / AEAT, exteriores.gob.es, Instituto Cervantes) plus
> consistent corroboration across professional tax/immigration sources. Where only
> secondary sources were available, the fact was cross-checked across several.

## Corrections made during this pass (were wrong → now fixed)

- **`modelo-720`** — title previously said *"penalty up to 150% of asset value"*. That
  proportional penalty regime was **struck down by the CJEU on 27 Jan 2022** and replaced
  with flat-rate penalties (general regime: min €300). Threshold is €50,000 **per asset
  category** (accounts / securities / property), filed **1 Jan – 31 Mar**.
- **`register-autonomo`** — title previously listed *"Modelo 036/037"*. **Modelo 037 was
  abolished on 9 Feb 2025**; all altas now use Modelo 036. Order matters: 036 first, then
  RETA the same day or within 60 days.

## Verified figures

| Obligation | Key fact (2026) | Source |
|---|---|---|
| `nlv-income-proof` | €28,800/yr main + €7,200/yr per dependent = 400% IPREM; IPREM €600/mo (frozen, no new budget) | exteriores.gob.es; movingtospain.com/iprem-spain |
| `dnv-income-proof` | ~€34,188/yr = 200% SMI (€1,221/mo ×14); +75% SMI spouse (~€13k), +25% per child (~€4k) | vissumlex.com; jobbatical.com SMI guide |
| `modelo-720` | €50k per category; 1 Jan–31 Mar; post-2022 flat penalties | lawants.com/en/modelo-720; CJEU C-788/19 |
| `wealth-tax` (714) | €700k state allowance (Catalonia €500k); ~€300k main-home exemption; rates 0.2–3.5%; solidarity tax >€3M | PwC taxsummaries.pwc.com/spain |
| `modelo-100` (IRPF) | 2 Apr – 30 Jun; direct-debit by 25 Jun | AEAT contributor calendar; taxadora.com |
| `modelo-130` | Quarterly: 1–20 Apr/Jul/Oct, 1–30 Jan | selfemployedspain.com; europeaccountants.com |
| `modelo-303` (VAT) | Quarterly: 1–20 Apr/Jul/Oct, 1–30 Jan | sede.agenciatributaria.gob.es (modelo-303 plazo) |
| `modelo-200` (IS) | 1–25 Jul (Jan–Dec fiscal year) | sede.agenciatributaria.gob.es GE04 |
| `modelo-030` | Census registration / NIF; ~3-month window | sede.agenciatributaria.gob.es G321 |
| `register-autonomo` | Modelo 036 (037 abolished 2025); RETA within 60 days; tarifa plana ~€87–88/mo yr 1 | deel.com; getrenn.com autonomo-social-security |
| `autonomo-social-security` | RETA tarifa plana ~€87–88/mo first year, then income-based brackets | seg-social.es; deel.com; getrenn.com |
| `nonresident-property-tax` (210) | Imputed income on un-rented property; cadastral-value base; due 31 Dec of following year | sede.agenciatributaria.gob.es; iberiantax.com/modelo-210 |
| `ibi-property-tax` | Municipal; cadastral-value base; 0.4–1.1%; owner as of 1 Jan; billing May–Oct varies | taxadora.com IBI guide |
| `dele-a2-exam` | DELE A2 required for naturalization; exempt if from Spanish-speaking country; Instituto Cervantes; ~€130 | dele.org; cervantes.to |
| `ccse-exam` | CCSE constitutional/sociocultural; Instituto Cervantes; €85; 25 Qs, 60% to pass | jobbatical.com; iiischools.com |

## Original-catalog audit (the "Spain Visas 101" inheritance)

Re-verified the 21 original obligations that carried inherited `source: 'webinar'`.
**10 promoted to `official`** (below); **7 left as `webinar`** (generic process steps / soft
estimates — not specific legal figures needing a cite: `choose-visa-type`,
`consulate-appointment` [US wait is variable], `nie`, `empadronamiento`, `tarjeta-sanitaria`,
`exit-tax-return`, `dnv-remote-work-proof`); 3 were already verified in the prior pass.

### Corrections made

- **`family-reunification`** — timing was modeled at **residencia + 30 days**, which is wrong:
  reagrupación needs **~1 year of legal residence with a renewed permit**. Re-anchored to
  `residency_established + 365`. Added housing-report + means (≈150% IPREM + 50%/extra).
- **`medical-certificate`** — dropped "apostilled". Apostille is confirmed for the criminal
  check and civil records, **not** a private doctor's certificate; it needs issuing within
  90 days + Spanish translation.
- **`criminal-background-check`** — reframed around the real constraint: issued within 90 days,
  apostilled + translated (US channeler speeds the FBI report; "8–12 weeks" was imprecise).
- **`escolarizacion`** — window corrected from "Feb–Apr" to spring **≈March–May**, plus the
  "fuera de plazo" off-cycle route.
- **`dgt-exchange`** — added the **6-month** validity-after-residency limit and "medical check".
- **`residencia`** — clarified the 30-day rule is to **start** the TIE process, not receive the card.

| Obligation | Key fact verified | Source |
|---|---|---|
| `residencia` | Start TIE (huella) within 30 days of entry; city waits vary | immigrationspain.es; visalimmigration.com |
| `nlv-health-insurance` | Spanish-authorized insurer, no co-pay, no waiting period, repatriation | caserexpatinsurance.com; healthinsurance-spain.com |
| `criminal-background-check` | Issued within 90 days; apostille + translation | es.usembassy.gov/criminal-records; sespanish.com |
| `medical-certificate` | Within 90 days; no apostille; translated | NLV checklists (costaluzlawyers.com) |
| `dnv-coverage-certificate` | Totalization cert of coverage / UK A1, or join Spanish SS | exteriores.gob.es DNV; remoteworkeurope.eu |
| `dgt-exchange` | Foreign licence valid ~6 mo after residency; bilateral = medical check, no test | administracion.gob.es; expatandalucia.com |
| `dgt-exam` | Non-agreement (US/CA/AU): theory + practical at autoescuela | waypointsur.com |
| `escolarizacion` | Ordinary admission ≈Mar–May; results by June; fuera de plazo off-cycle | malagaschools.com; spaineasy.com |
| `family-reunification` | After ~1 yr residence + renewed permit; housing report; 150% IPREM +50%/extra | exteriores.gob.es; RD 1155/2024; balcellsgroup.com |
| `citizenship-track-standard` | 10 years general | administracion.gob.es obtencion-nacionalidad |
| `citizenship-track-latam` | 2 years for Ibero-America + Andorra/Philippines/Eq.Guinea/Portugal | jobbatical.com; spanishcitizenship.org |

## Still flagged for caution

- Region-specific figures (wealth-tax thresholds, ITP rate, IBI rate/month) genuinely
  vary by autonomous community / municipality. Titles say so rather than asserting one number.

## Catalog source mix

After promoting `autonomo-social-security` → `official`, the catalog stands at
**28 `webinar` / 26 `official`** (0 `domain` — the audit queue is empty).

## `tarjeta-sanitaria` applicability (2026-06-30)

Gated off the NLV path: NLV holders are required to carry private health insurance and are
**not** entitled to the public health card (tarjeta sanitaria) on arrival. The obligation now
applies to anyone with a Spanish address **except** `visa_type === 'nlv'`. Still `source:
'webinar'` — the gating is a process correction, not a new citable figure.
