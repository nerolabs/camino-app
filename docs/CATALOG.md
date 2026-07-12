# The Camino catalog — obligations × the questions that gate them

> **Generated** by `npm run docs:catalog` on 2026-07-12 — do not hand-edit; regenerate after any
> catalog or interview change. This is the human-reviewable view of the deterministic core:
> which interview answers exist, what gets derived from them, and exactly which combination
> switches each obligation on.

**Totals:** 64 obligations · 20 interview questions · 17 derivations.

## 1 · The interview (every question asked)

| # | Field | Type | Asked when | Hint (what Lola asks about) |
|---|---|---|---|---|
| 1 | `speaks_spanish` | band | always | how much Spanish they already speak |
| 2 | `nationalities` | list | always | what passports everyone in the household holds — people sometimes hold more than one |
| 3 | `work_situation` | list | always | their work situation when they move — remote employee, freelancer, retired, studying, etc. |
| 4 | `employer_country_is_foreign` | bool | work_situation = "employed_remote" | whether their employer is based outside Spain (vs a Spanish company hiring them) |
| 5 | `annual_income_eur_band` | band | is_eu = false | their rough annual household income in euros — checked against the NLV/DNV visa income thresholds for their ho… |
| 6 | `has_spouse_or_partner` | bool | always | whether a spouse or partner will be relocating with them |
| 7 | `partner_is_married` | bool | has_spouse_or_partner = true | whether they are legally married or in a registered civil partnership |
| 8 | `non_eu_family_member` | bool | household_mixed_eu = true AND (has_spouse_or_partner = true OR has_children = true) | whether anyone moving with them does NOT hold an EU (or Spanish) passport of their own |
| 9 | `has_children` | bool | always | whether school-age children will be making this move |
| 10 | `intends_long_stay` | bool | always | whether this is a long-term move (more than 183 days a year) or a shorter extended stay |
| 11 | `arrival_date` | date | always | roughly when they plan to arrive in Spain — even an approximate month is enough to anchor real deadlines |
| 12 | `has_spanish_address` | bool | always | whether they already have a Spanish address — rented or owned |
| 13 | `owns_or_drives` | bool | always | whether anyone in the household will drive in Spain |
| 14 | `owns_property_in_spain` | bool | always | whether they own or are actively planning to purchase property in Spain |
| 15 | `property_purchase` | date | owns_property_in_spain = true | roughly when they completed (or expect to complete) the property purchase — anchors the notary, registry, and … |
| 16 | `region` | band | always | which comunidad autónoma (region of Spain) they'll settle in — if they name a city or province, map it to its … |
| 17 | `has_pets` | bool | always | whether any pets — dogs, cats, or ferrets — will be making this move with them |
| 18 | `foreign_assets_eur_band` | band | is_tax_resident = true | roughly, total assets held outside Spain — only a range is needed, drives Modelo 720 |
| 19 | `previously_ex_spanish_colony_nationality` | bool | is_eu = false AND NOT is_ex_colony_national = true | whether they hold nationality from a former Spanish colony (most Latin American countries, Philippines) — this… |
| 20 | `wants_citizenship` | bool | is_spanish_national = false AND intends_long_stay = true | whether, longer term, they hope to become a Spanish citizen — or plan to just keep renewing their residence to… |

## 2 · Derivations (fields computed, never asked)

| Derived field | Computed from |
|---|---|
| `is_eu` | `nationalities` |
| `nationality_has_dgt_agreement` | `nationalities` |
| `is_ex_colony_national` | `nationalities` |
| `is_spanish_speaking_national` | `nationalities` |
| `is_spanish_national` | `nationalities` |
| `household_mixed_eu` | `nationalities` |
| `is_tax_resident` | `intends_long_stay` |
| `knows_where_to_live` | `region` |
| `foreign_assets_eur` | `foreign_assets_eur_band` |
| `annual_income_eur` | `annual_income_eur_band` |
| `family_extra_count` | `has_spouse_or_partner`, `has_children` |
| `nlv_income_threshold` | `family_extra_count` |
| `dnv_income_threshold` | `has_spouse_or_partner`, `has_children` |
| `income_may_fall_short_nlv` | `annual_income_eur_band`, `nlv_income_threshold` |
| `income_may_fall_short_dnv` | `annual_income_eur_band`, `dnv_income_threshold` |
| `visa_type` | `is_eu`, `work_situation` |
| `is_self_employed_in_spain` | `work_situation` |

## 3 · The obligations (what applies, when)

| Obligation | Sev | Source | Applies when | Depends on | Timing |
|---|---|---|---|---|---|
| `language-classes` | recommended | recommendation | speaks_spanish in [None yet, A little] | — | -180d before arrival |
| `scout-where-to-live` | recommended | recommendation | NOT owns_property_in_spain = true AND knows_where_to_live = false | — | -270d before arrival |
| `choose-visa-type` | required | official | is_eu = false AND intends_long_stay = true | — | -180d before arrival |
| `consulate-appointment` | required | official | is_eu = false AND intends_long_stay = true | `choose-visa-type` | -150d before arrival |
| `criminal-background-check` | required | official | is_eu = false AND intends_long_stay = true | `choose-visa-type` | -120d before arrival |
| `medical-certificate` | required | official | is_eu = false AND intends_long_stay = true | `choose-visa-type` | -45d before arrival |
| `nlv-income-proof` | required | official | visa_type = "nlv" | `choose-visa-type` | -60d before arrival |
| `nlv-income-check` | recommended | recommendation | visa_type = "nlv" AND income_may_fall_short_nlv = true | `choose-visa-type` | -180d before arrival |
| `nlv-health-insurance` | required | official | visa_type = "nlv" | `choose-visa-type` | -45d before arrival |
| `convenio-especial` | recommended | official | visa_type = "nlv" | `nlv-health-insurance` | +365d after residency_established |
| `dnv-remote-work-proof` | required | official | visa_type = "dnv" | `choose-visa-type` | -60d before arrival |
| `dnv-income-proof` | required | official | visa_type = "dnv" | `choose-visa-type` | -60d before arrival |
| `dnv-income-check` | recommended | recommendation | visa_type = "dnv" AND income_may_fall_short_dnv = true | `choose-visa-type` | -180d before arrival |
| `dnv-coverage-certificate` | required | official | visa_type = "dnv" AND work_situation = "employed_remote" | `choose-visa-type` | -60d before arrival |
| `empadronamiento` | required | official | intends_long_stay = true | — | ASAP (window from arrival) |
| `nie` | required | official | (is_eu = false AND (intends_long_stay = true OR owns_property_in_spain = true) OR is_eu = true AND is_spanish_national = false AND owns_property_in_spain = true AND NOT intends_long_stay = true) | — | +30d after arrival |
| `eu-registration-certificate` | required | official | is_eu = true AND is_spanish_national = false AND intends_long_stay = true | — | +90d after arrival |
| `eu-family-member-card` | required | official | is_eu = true AND non_eu_family_member = true AND intends_long_stay = true | — | +90d after arrival |
| `residencia` | required | official | is_eu = false AND intends_long_stay = true | `empadronamiento`<br>`nie` | +0d after `nie` |
| `tarjeta-sanitaria` | required | official | intends_long_stay = true AND NOT visa_type = "nlv" | `empadronamiento` | +14d after `empadronamiento` |
| `exit-tax-return` | recommended | recommendation | is_tax_resident = true | — | -30d before arrival |
| `modelo-720` | penalty | official | is_tax_resident = true AND foreign_assets_eur gt 50000 | — | yearly (months: 1,2,3) |
| `dgt-exchange` | required | official | (is_eu = false OR non_eu_family_member = true) AND owns_or_drives = true AND nationality_has_dgt_agreement = true | `residencia` | +183d after residency_established |
| `dgt-exam` | required | official | (is_eu = false OR non_eu_family_member = true) AND owns_or_drives = true AND NOT nationality_has_dgt_agreement = true | `residencia` | +183d after residency_established |
| `escolarizacion` | required | official | has_children = true AND intends_long_stay = true | `empadronamiento` | +7d after `empadronamiento` |
| `family-reunification` | required | official | is_eu = false AND intends_long_stay = true AND has_spouse_or_partner = true AND partner_is_married = true | `residencia` | +365d after residency_established |
| `citizenship-track-standard` | info | official | wants_citizenship = true AND is_ex_colony_national = false | `residencia` | +3650d after residency_established |
| `citizenship-track-latam` | info | official | wants_citizenship = true AND is_ex_colony_national = true | `residencia` | +730d after residency_established |
| `tax-planning-consultation` | recommended | recommendation | intends_long_stay = true | — | -180d before arrival |
| `apostille-documents` | required | official | is_eu = false AND intends_long_stay = true | `choose-visa-type` | -90d before arrival |
| `sworn-translation` | required | official | is_eu = false AND intends_long_stay = true | `apostille-documents` | +7d after `apostille-documents` |
| `nlv-letter-of-intent` | required | official | visa_type = "nlv" | `choose-visa-type` | -90d before arrival |
| `nlv-non-work-declaration` | recommended | official | visa_type = "nlv" AND NOT work_situation in [retired, passive_income] | `choose-visa-type` | -90d before arrival |
| `dnv-qualification-proof` | required | official | visa_type = "dnv" | `choose-visa-type` | -90d before arrival |
| `dnv-company-activity-proof` | required | official | visa_type = "dnv" | `choose-visa-type` | -60d before arrival |
| `dnv-employer-permission-letter` | required | official | visa_type = "dnv" AND work_situation = "employed_remote" | `choose-visa-type` | -60d before arrival |
| `spanish-bank-account` | recommended | recommendation | intends_long_stay = true | `nie` | ASAP (window from arrival) |
| `digital-certificate` | recommended | official | is_tax_resident = true | `nie` | +30d after `nie` |
| `modelo-030` | recommended | official | is_tax_resident = true | `empadronamiento` | +14d after `empadronamiento` |
| `beckham-law` | recommended | official | visa_type = "dnv" AND work_situation = "employed_remote" | `residencia` | +180d after residency_established |
| `modelo-100` | penalty | official | is_tax_resident = true | `residencia` | yearly (months: 4,5,6) |
| `wealth-tax` | penalty | official | is_tax_resident = true AND foreign_assets_eur gt 700000 | `residencia` | yearly (months: 4,5,6) |
| `register-autonomo` | required | official | is_self_employed_in_spain = true | `nie`<br>`residencia` | +30d after residency_established |
| `autonomo-social-security` | penalty | official | is_self_employed_in_spain = true | `register-autonomo` | yearly (months: 12) |
| `modelo-130` | penalty | official | is_self_employed_in_spain = true | `register-autonomo` | yearly (months: 1,4,7,10) |
| `modelo-303` | penalty | official | is_self_employed_in_spain = true | `register-autonomo` | yearly (months: 1,4,7,10) |
| `modelo-390` | penalty | official | is_self_employed_in_spain = true | `modelo-303` | yearly (months: 1) |
| `modelo-200` | penalty | official | work_situation = "business_owner" | `residencia` | yearly (months: 7) |
| `student-visa-health-insurance` | required | official | visa_type = "student" | `choose-visa-type` | -45d before arrival |
| `nlv-renewal` | required | official | visa_type = "nlv" | `residencia` | +305d after residency_established |
| `dnv-renewal` | required | official | visa_type = "dnv" | `residencia` | +1035d after residency_established |
| `permanent-residence` | recommended | official | is_eu = false AND intends_long_stay = true | `residencia` | +1825d after residency_established |
| `property-legal-due-diligence` | recommended | recommendation | owns_property_in_spain = true | `nie` | ASAP (window from arrival) |
| `completion-deed-notary` | required | official | owns_property_in_spain = true | `property-legal-due-diligence` | at property_purchase |
| `land-registry-registration` | recommended | official | owns_property_in_spain = true | `completion-deed-notary` | +30d after property_purchase |
| `property-transfer-tax` | penalty | official | owns_property_in_spain = true | `completion-deed-notary` | +30d after property_purchase |
| `ibi-property-tax` | penalty | official | owns_property_in_spain = true | `completion-deed-notary` | yearly (months: 9,10) |
| `community-fees` | required | official | owns_property_in_spain = true | `completion-deed-notary` | yearly (months: 12) |
| `nonresident-property-tax` | penalty | official | owns_property_in_spain = true AND NOT is_tax_resident = true | `completion-deed-notary` | yearly (months: 12) |
| `pet-import` | required | official | has_pets = true | — | -10d before arrival |
| `dele-a2-exam` | required | official | wants_citizenship = true AND is_spanish_speaking_national = false | `residencia` | +1825d after residency_established |
| `ccse-exam` | required | official | wants_citizenship = true | `residencia` | +1825d after residency_established |
| `citizenship-application` | required | official | wants_citizenship = true | `citizenship-track-standard`<br>`citizenship-track-latam`<br>`ccse-exam` | +3650d after residency_established |
| `citizenship-jura` | required | official | wants_citizenship = true | `citizenship-application` | +365d after `citizenship-application` |

## 4 · The branching — which fields gate which obligations

Every field that any `applies_if` tests, and the obligations that hinge on it. This is the
review view: change an answer, these are the items that can appear or disappear.

| Field | Gates (103 references) |
|---|---|
| `visa_type` | `nlv-income-proof` · `nlv-income-check` · `nlv-health-insurance` · `convenio-especial` · `dnv-remote-work-proof` · `dnv-income-proof` · `dnv-income-check` · `dnv-coverage-certificate` · `tarjeta-sanitaria` · `nlv-letter-of-intent` · `nlv-non-work-declaration` · `dnv-qualification-proof` · `dnv-company-activity-proof` · `dnv-employer-permission-letter` · `beckham-law` · `student-visa-health-insurance` · `nlv-renewal` · `dnv-renewal` |
| `intends_long_stay` | `choose-visa-type` · `consulate-appointment` · `criminal-background-check` · `medical-certificate` · `empadronamiento` · `nie` · `eu-registration-certificate` · `eu-family-member-card` · `residencia` · `tarjeta-sanitaria` · `escolarizacion` · `family-reunification` · `tax-planning-consultation` · `apostille-documents` · `sworn-translation` · `spanish-bank-account` · `permanent-residence` |
| `is_eu` | `choose-visa-type` · `consulate-appointment` · `criminal-background-check` · `medical-certificate` · `nie` · `eu-registration-certificate` · `eu-family-member-card` · `residencia` · `dgt-exchange` · `dgt-exam` · `family-reunification` · `apostille-documents` · `sworn-translation` · `permanent-residence` |
| `owns_property_in_spain` | `scout-where-to-live` · `nie` · `property-legal-due-diligence` · `completion-deed-notary` · `land-registry-registration` · `property-transfer-tax` · `ibi-property-tax` · `community-fees` · `nonresident-property-tax` |
| `is_tax_resident` | `exit-tax-return` · `modelo-720` · `digital-certificate` · `modelo-030` · `modelo-100` · `wealth-tax` · `nonresident-property-tax` |
| `wants_citizenship` | `citizenship-track-standard` · `citizenship-track-latam` · `dele-a2-exam` · `ccse-exam` · `citizenship-application` · `citizenship-jura` |
| `work_situation` | `dnv-coverage-certificate` · `nlv-non-work-declaration` · `dnv-employer-permission-letter` · `beckham-law` · `modelo-200` |
| `is_self_employed_in_spain` | `register-autonomo` · `autonomo-social-security` · `modelo-130` · `modelo-303` · `modelo-390` |
| `non_eu_family_member` | `eu-family-member-card` · `dgt-exchange` · `dgt-exam` |
| `is_spanish_national` | `nie` · `eu-registration-certificate` |
| `foreign_assets_eur` | `modelo-720` · `wealth-tax` |
| `owns_or_drives` | `dgt-exchange` · `dgt-exam` |
| `nationality_has_dgt_agreement` | `dgt-exchange` · `dgt-exam` |
| `is_ex_colony_national` | `citizenship-track-standard` · `citizenship-track-latam` |
| `speaks_spanish` | `language-classes` |
| `knows_where_to_live` | `scout-where-to-live` |
| `income_may_fall_short_nlv` | `nlv-income-check` |
| `income_may_fall_short_dnv` | `dnv-income-check` |
| `has_children` | `escolarizacion` |
| `has_spouse_or_partner` | `family-reunification` |
| `partner_is_married` | `family-reunification` |
| `has_pets` | `pet-import` |
| `is_spanish_speaking_national` | `dele-a2-exam` |

## 5 · Field-flow graph (questions → derived fields)

Obligations hang off these fields per the tables above; drawing all 64 would be
unreadable, so this graph shows how raw answers become the derived switches.

```mermaid
flowchart LR
  subgraph Asked["Interview answers"]
    nationalities[nationalities]
    work_situation[work_situation]
    annual_income_eur_band[annual_income_eur_band]
    has_spouse_or_partner[has_spouse_or_partner]
    has_children[has_children]
    intends_long_stay[intends_long_stay]
    region[region]
    foreign_assets_eur_band[foreign_assets_eur_band]
  end
  subgraph Derived["Derived (never asked)"]
    is_eu((is_eu))
    nationality_has_dgt_agreement((nationality_has_dgt_agreement))
    is_ex_colony_national((is_ex_colony_national))
    is_spanish_speaking_national((is_spanish_speaking_national))
    is_spanish_national((is_spanish_national))
    household_mixed_eu((household_mixed_eu))
    is_tax_resident((is_tax_resident))
    knows_where_to_live((knows_where_to_live))
    foreign_assets_eur((foreign_assets_eur))
    annual_income_eur((annual_income_eur))
    family_extra_count((family_extra_count))
    nlv_income_threshold((nlv_income_threshold))
    dnv_income_threshold((dnv_income_threshold))
    income_may_fall_short_nlv((income_may_fall_short_nlv))
    income_may_fall_short_dnv((income_may_fall_short_dnv))
    visa_type((visa_type))
    is_self_employed_in_spain((is_self_employed_in_spain))
  end
  nationalities --> is_eu
  nationalities --> nationality_has_dgt_agreement
  nationalities --> is_ex_colony_national
  nationalities --> is_spanish_speaking_national
  nationalities --> is_spanish_national
  nationalities --> household_mixed_eu
  intends_long_stay --> is_tax_resident
  region --> knows_where_to_live
  foreign_assets_eur_band --> foreign_assets_eur
  annual_income_eur_band --> annual_income_eur
  has_spouse_or_partner --> family_extra_count
  has_children --> family_extra_count
  family_extra_count --> nlv_income_threshold
  has_spouse_or_partner --> dnv_income_threshold
  has_children --> dnv_income_threshold
  annual_income_eur_band --> income_may_fall_short_nlv
  nlv_income_threshold --> income_may_fall_short_nlv
  annual_income_eur_band --> income_may_fall_short_dnv
  dnv_income_threshold --> income_may_fall_short_dnv
  is_eu --> visa_type
  work_situation --> visa_type
  work_situation --> is_self_employed_in_spain
```

## 6 · Direct-gate fields (asked, used as-is by obligations)

`speaks_spanish` · `owns_property_in_spain` · `intends_long_stay` · `work_situation` · `non_eu_family_member` · `owns_or_drives` · `has_children` · `has_spouse_or_partner` · `partner_is_married` · `wants_citizenship` · `has_pets`
