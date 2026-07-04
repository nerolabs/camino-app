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

**Current (2026-07-02, after the source-taxonomy change): 54 `official` / 5 `recommendation`.**
(History: an earlier milestone read 28 `webinar` / 26 `official`; the B10 grounding pass reached
52 `official` / 6 `webinar` / 1 `domain` before the taxonomy was simplified — see next section.)

### ⚠️ Correction (2026-07-03 audit): tag ≠ citation — RESOLVED same day

A full audit found that **28 of the 54 `official` items carried no `source_url`** — earlier passes
verified claims and logged notes here but never attached the canonical URL to the catalog entry,
so the app showed "verified against an official source" with no link to check. `npm run audit`
now fails-soft on any such item (it reported 28; it reports **0** after the pass below).

## Re-verification pass — all 28 missing citations attached (2026-07-03)

Each item re-verified against its issuing authority and given its canonical URL:

- **AEAT sede (procedure pages, `procedimientoini/*`):** modelo-030 → G321 · modelo-100 → G229 ·
  modelo-130 → G601 · modelo-303 → G414 · modelo-200 → GE04 · modelo-720 → GI34 ·
  wealth-tax (Modelo 714) → G611 · register-autonomo (Modelo 036 censal) → G322 ·
  nonresident-property-tax → Modelo 210 IRNR gestiones page.
- **Seguridad Social:** autonomo-social-security → Importass "Alta en trabajo autónomo" (RETA;
  alta due same day activity starts, filable up to 60 days ahead — mandatory electronic).
- **Extranjería / Inclusión:** criminal-background-check, medical-certificate, nlv-income-proof,
  nlv-health-insurance → Hoja 6 (NLV initial authorisation — lists all four requirements) ·
  dnv-income-proof, dnv-coverage-certificate → UGE teletrabajadores page ·
  family-reunification → Hoja 8 (reagrupación familiar) ·
  student-visa-health-insurance → Hoja 1 (estancia por estudios: insurer authorised in Spain,
  SNS-equivalent cover) · residencia (TIE) → interior.gob.es TIE page.
- **DGT:** dgt-exchange → sede.dgt canje de permisos extranjeros (non-EU licences valid only
  6 months after residence; exchange requires a bilateral agreement) · dgt-exam → dgt.es
  requisitos/presentación a examen.
- **Citizenship:** citizenship-track-standard + citizenship-track-latam → mjusticia nacionalidad
  por residencia (10-year / 2-year Ibero-American rules) · dele-a2-exam →
  examenes.cervantes.es DELE A2 · ccse-exam → examenes.cervantes.es nacionalidad (CCSE).
- **Property:** property-transfer-tax → administracion.gob.es compraventa-impuestos (state
  explainer; ITP is 100% ceded to regions, rates vary ~6–13%) · ibi-property-tax →
  BOE RDL 2/2004 (TRLRHL — the statutory basis of the IBI; the tax itself is municipal).
- **Education:** escolarizacion → educagob (Ministerio de Educación) primary-admission page
  (also covers late/off-cycle incorporation of foreign pupils, LOE art. 84).

## New obligation: `eu-registration-certificate` (2026-07-03)

The audit's persona check exposed that an EU long-stay profile had **no registration step at
all**. Added: EU/EEA nationals staying >3 months must register in person in the Registro Central
de Extranjeros within 3 months of entry (form EX-18, fee 790-012; certificate valid 5 years).
Source: Hoja 65, `…/w/65.-certificado-de-registro-de-ciudadano-de-la-union-europea` (also on
sede.policia.gob.es). Gated `is_eu` + `intends_long_stay`; title notes Spanish nationals
themselves don't need it (household-level profile granularity). **Catalog: 59 → 60** —
mix **55 `official` (all with `source_url`) / 5 `recommendation`, 0 uncited.**

## Source taxonomy simplified: `official` | `recommendation` (2026-07-02)

Retired the mining-era `webinar` / `domain` source values. Now that grounding is done, the honest
user-facing distinction is **official requirement vs. Camino recommendation** (provenance history
lives in this file; `webinar_url` staff links are unaffected). `severity` stays orthogonal (how
important), so a recommendation can be strongly or gently suggested.

- **`recommendation` (5):** `scout-where-to-live` (was `domain`), `tax-planning-consultation`,
  `exit-tax-return`, `spanish-bank-account`, `property-legal-due-diligence` (last four were
  `webinar`). These are practical advice, not codified law — no official `source_url`. Note:
  `spanish-bank-account` and `property-legal-due-diligence` were also downgraded `required` →
  `recommended` so severity matches their advisory nature.
- **The two required-but-uncited process steps were sourced instead of downgraded** (they're
  genuinely mandatory, just not tied to a figure): `choose-visa-type` → Min. de Inclusión
  authorisations catalog (`…/migraciones/autorizaciones`); `consulate-appointment` → MAEC cita
  previa (`sede.maec.gob.es/pagina/index/directorio/citaprevia`). Both now `official`, still
  `required`.

## B10 grounding pass — 9 promoted `webinar` → `official` (2026-07-02)

Researched each remaining webinar obligation against official Spanish sources and promoted the
9 that map to a citable statutory/procedural rule; corrected details in the title where the
webinar draft was imprecise:

- **`community-fees`** → BOE, Ley 49/1960 de Propiedad Horizontal, art. 9(1)(e) (statutory duty of
  every owner to pay comunidad fees). `https://www.boe.es/buscar/act.php?id=BOE-A-1960-10906`
- **`completion-deed-notary`** → administración.gob.es (Notarías y Registros). The notarial
  *escritura pública* is the standard legal formalisation of the sale; mandatory with a mortgage.
- **`land-registry-registration`** → same admin.gob.es page. **Correction:** registration is
  **voluntary** in Spain (mandatory only with a mortgage) → severity `required` → **`recommended`**,
  title now says "technically voluntary… but strongly recommended (court-protected title)".
- **`apostille-documents`** → Ministerio de Justicia, Legalización única / Apostilla de la Haya
  (1961 Hague Convention). Nuance added: each document is apostilled **in its issuing country**.
- **`nlv-renewal`** → Min. de Inclusión, "Hoja 7". **Correction:** window is **60 days before
  expiry → up to 90 days after** (late = minor infraction, fine ≤ €500), not just "60 days before".
- **`dnv-renewal`** → Min. de Inclusión / UGE-CE, Startups Law (Ley 28/2022): renewable for 2-year
  periods while qualifying conditions hold.
- **`student-visa-health-insurance`** → national student-visa requirement (exteriores): insurer
  authorised in Spain, SNS-equivalent cover, no copays/waiting, repatriation. Promoted to
  `official`; no clean canonical URL attached (documented here instead — same pattern as
  `nlv-health-insurance`).
- **`nlv-letter-of-intent`** and **`nlv-non-work-declaration`** → Min. de Inclusión, "Hoja 6"
  (initial NLV authorisation requirements). `…/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa`

**Left as `webinar` on purpose (6)** — these are recommendations or practical steps, not Spanish
statutory obligations, so there is no `.gob.es` law to cite: `choose-visa-type` (orientation),
`consulate-appointment` (the "8–16 weeks" lead time is a soft, country-specific estimate),
`exit-tax-return` (depends on the *home* country's tax authority), `tax-planning-consultation`
(professional advice), `spanish-bank-account` (practical, not a legal duty),
`property-legal-due-diligence` (recommended professional advice). Honest to keep them flagged
`webinar` rather than dress them up as official.

## `tarjeta-sanitaria` applicability (2026-06-30)

Gated off the NLV path: NLV holders are required to carry private health insurance and are
**not** entitled to the public health card (tarjeta sanitaria) on arrival. The obligation now
applies to anyone with a Spanish address **except** `visa_type === 'nlv'`. Still `source:
'webinar'` — the gating is a process correction, not a new citable figure.

## `scout-where-to-live` — advisory obligation (2026-07-02)

New obligation recommending a **scouting trip** and a framework for **choosing where to live**
(cost of living, healthcare access, climate, transport, expat/English support, schools). Kept as
`source: 'domain'` deliberately: it asserts **no deadlines, costs, or laws** — only evaluation
*dimensions* — so it does not require an official citation and stays within invariant 3. Shown to
anyone who does not already `owns_property_in_spain`. This reintroduces a single `domain` item to
the catalog by design (advisory, not a citable fact); the audit queue for *factual* claims is
still empty. Catalog now **29 `webinar` / 26 `official` / 1 `domain`**.

## B10 — webinar → official promotion pass (2026-07-02, batch 1)

Researching webinar-sourced obligations against official sources and flipping to `source: 'official'`
with a canonical `source_url` (surfaced as a "View the official source" link in the roadmap).
Corrections noted. Also added `webinar_url` (staff-only) to keep the original YouTube for
cross-checking (URLs TBD — need per-obligation mapping from the user).

| id | official source | note / correction |
|---|---|---|
| `digital-certificate` | sede.fnmt.gob.es/certificados/persona-fisica | FNMT is the issuer; free for any DNI/NIE holder. |
| `beckham-law` | sede.agenciatributaria.gob.es …/regimen-especial.html | **Corrected:** 24% flat up to €600k for 6 yrs; since 2023 also covers remote workers/entrepreneurs (was "employed only"); usually not standard autónomos; election via Modelo 149 within ~6 months. |
| `empadronamiento` | administracion.gob.es …/detalleTramite idT=32988 | Managed by each ayuntamiento. |
| `citizenship-application` | mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia | Ministry of Justice online (Modelo 790 fee). |
| `permanent-residence` | administracion.gob.es …/residencia-permanente.html | 5 yrs continuous legal residence (absence limits apply). |
| `property-transfer-tax` | (regional — set per CCAA, no single national page) | **Corrected:** range 6–11% (was 7–10%); rate set by each autonomous community. `source_url` omitted (regional). |

Source mix after batch 1: **32 official / 22 webinar / 1 domain**. Remaining webinar items to work
through in later batches: nie, apostille-documents, consulate-appointment (soft estimate — may stay
webinar), NLV/DNV docs + renewals, tarjeta-sanitaria, spanish-bank-account, pet-import, student-visa
insurance, property (due diligence/notary/registry/community fees), tax-planning-consultation +
exit-tax-return (advisory — likely reclassify, not "official").

## B10 batch 2 (2026-07-02) — 7 more promoted

| id | official source | note / correction |
|---|---|---|
| `nie` | policia.es/_es/extranjeria_extranjeros.php | Form EX-15; Policía Nacional / Oficina de Extranjería. |
| `tarjeta-sanitaria` | sanidad.gob.es …/tarjetaSanitariaSNS/home.htm | Issued by the CCAA once healthcare right is recognised. |
| `pet-import` | mapa.gob.es …/viajar-perros-gatos-hurones | **Corrected:** rabies valid ≥21 days after 1st dose; from a non-EU country (US) an EU animal health certificate within 10 days of entry (intra-EU uses an EU pet passport). |
| `dnv-remote-work-proof` · `dnv-qualification-proof` · `dnv-company-activity-proof` · `dnv-employer-permission-letter` | inclusion.gob.es …/unidadgrandesempresas/teletrabajadores | UGE Teletrabajadores (Ley 14/2013 as amended by Ley 28/2022). |

Source mix after batch 2: **39 official / 15 webinar / 1 domain**. Remaining webinar (15) are mostly
soft estimates / advisory / process items to work through or reclassify next.

Webinar YouTube corpus captured in `docs/webinar-sources.md` (16 videos); no per-obligation mapping
yet — needed to populate the staff-only `webinar_url`.

## Webinar → obligation mapping (2026-07-02, batch 1)

Re-unpacked the transcripts (yt-dlp + Chrome cookies). Got 4/16 videos before YouTube throttled
(intermittent — the rest are fetchable incrementally). Titles recovered:
- 8zyT1TG9S5E — "Buying a Home in Spain"
- 2A19YnqiO4g — "Mistakes Americans Make in Spain"
- 9RUa0LsfFCQ — "Living in Madrid"
- C_UxMIqTd0Q — "Living in Malaga"

**Mapped (batch 1):** the property-purchase obligations → "Buying a Home in Spain" (8zyT), with
timestamps found in the transcript (bank account 3:11, community fees 3:37, notary 4:43):
`spanish-bank-account`, `community-fees`, `completion-deed-notary`, `property-legal-due-diligence`,
`land-registry-registration`, and `property-transfer-tax` (kept as **supplementary** — it already
has an official `source_url`, per user: webinar stays even when official). `webinar_url` is
staff-only for now.

Remaining: fetch the other 12 transcripts incrementally, read for accurate per-obligation
attribution + timestamps, and populate the rest.

## Webinar → obligation mapping (2026-07-02, batch 2 — all 16 transcripts captured)

The throttle reset and **all 16 transcripts** are now cached. Full title set:
Buying a Home (8zyT), Mistakes Americans Make (2A19), Living in Madrid (9RUa), Malaga (C_UxMIqTd0Q),
Spain Taxes 101 (HP55), Living in Catalonia (NwecXut5e24), Healthcare & Insurance (OnLKyPbpALY),
Digital Nomad Visa (SqmxlLuJ_bY), Retiring in Spain (U6_AOU1JdAE), Living in Valencia (b1E-RQIdv4A),
Cost of Living (gEY3Xkqs6so), How to Move to Spain – Key Steps (gtruvbQhphE), Renting (tQvPYhH99Nw),
Non-Lucrative Visa (tZJk56EH1ms), Spain Visas 101 (uH927kx3igU), Citizenship 101 (vAeqa_xdrTY).

Mapped **37 more obligations** to their topic-dedicated webinar with transcript-verified timestamps
(all **supplementary** / staff-only, kept even where an official `source_url` exists):
- **Admin/tax (Spain Taxes 101, HP55):** empadronamiento*, nie* (via Malaga C_UxMIqTd0Q), beckham-law,
  autonomo-social-security, register-autonomo, wealth-tax, modelo-720, exit-tax-return,
  tax-planning-consultation.
- **Visas 101 (uH927kx3igU):** choose-visa-type, consulate-appointment, criminal-background-check,
  medical-certificate, apostille-documents.
- **DNV (SqmxlLuJ_bY):** dnv-remote-work-proof, dnv-income-proof, dnv-coverage-certificate,
  dnv-employer-permission-letter, dnv-company-activity-proof, dnv-qualification-proof, dnv-renewal.
- **NLV (tZJk56EH1ms):** nlv-income-proof, nlv-health-insurance, nlv-letter-of-intent,
  nlv-non-work-declaration, nlv-renewal.
- **Healthcare (OnLKyPbpALY):** tarjeta-sanitaria, student-visa-health-insurance.
- **Citizenship 101 (vAeqa_xdrTY):** citizenship-track-standard, citizenship-track-latam,
  citizenship-application, dele-a2-exam, ccse-exam.
- **Regional/misc:** scout-where-to-live (Cost of Living gEY3Xkqs6so), dgt-exchange + dgt-exam
  (Mistakes 2A19), pet-import (Retiring U6).

Total: **43/55 obligations** now carry a supplementary `webinar_url`. The 12 left unmapped are
tax-form technicalities (modelo-030/100/130/303/200, ibi-property-tax, nonresident-property-tax) and
admin items (residencia, digital-certificate, escolarizacion, family-reunification,
permanent-residence) that the webinars don't cover with enough specificity to cite honestly.

## Backlog re-add — 4 obligations restored with official sources (2026-07-02)

The four obligations pulled to `OBLIGATIONS_BACKLOG.md` on 2026-06-30 (unverified domain knowledge)
were each verified against an official `.gob.es` source and re-added to the live catalog as
`source: 'official'` with a `source_url`. Catalog grows **55 → 59** (44 official / 15 webinar).

- **`sworn-translation`** — MAEC:
  `https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Traductores-Interpretes-Jurados.aspx`.
  Verified: foreign↔Spanish translations are official only if by a MAEC-appointed *traductor jurado*.
  Depends on `apostille-documents`.
- **`convenio-especial`** — Ministerio de Sanidad:
  `https://www.sanidad.gob.es/servCiudadanos/internacional/convenioEspecial.htm`.
  Verified figures added to the title: ≥1 year continuous residence + empadronamiento; monthly
  premium **€60 (<65) / €157 (65+)** (Orden TAS/2865/2003). NLV-scoped.
- **`modelo-390`** — AEAT:
  `https://sede.agenciatributaria.gob.es/Sede/iva/modelo-390-iva-declaracion-resumen-anual.html`.
  Verified: informative annual VAT recap of the year's Modelo 303, filed in the **first 30 days of
  January**, electronic only. `severity: penalty`, depends on `modelo-303`.
- **`citizenship-jura`** — Ministerio de Justicia:
  `https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia`.
  Correction: the jura/promesa (art. 23 Código Civil) must be done **within 180 days of the grant
  notification** or the concession lapses (caducidad) — title now states this. Depends on
  `citizenship-application`.

All four verified present in `buildPlan` output for a NON-EU NLV self-employed profile (phases:
before_you_go / when_settled / ongoing / when_settled respectively) — no dependency cycles.

## Webinar-anchor audit — 17 timestamps corrected (2026-07-03)

Applied the same rigor as the source_url re-verification to the staff-only `webinar_url` links:
every anchor's `t=` offset was checked against the cached transcript (what is actually being said
in a [t−10s, t+55s] window). ~23 were solid; **17 were wrong or weak** and were re-anchored to
where the topic is genuinely discussed:

- **Agenda-mention → substance (HP55 "Spain Taxes 101"):** wealth-tax (→13:14), modelo-720
  (→20:46), beckham-law (→27:23), register-autonomo + autonomo-social-security (→7:59) — all had
  pointed at the webinar's opening table-of-contents.
- **Wrong topic entirely:** empadronamiento (was a private-school aside in the Málaga video →
  Key Steps padrón discussion), student-visa-health-insurance (was a physiotherapy anecdote →
  Visas 101 student-documents segment), apostille-documents (was a duplicate of the criminal-check
  anchor → the actual document-legalization discussion), citizenship-track-latam (was the
  democratic-memory-law segment → the 2-year residency track), pet-import (was a joke about five
  dogs in first class → "overview of bringing pets to Spain"), exit-tax-return (was the Spanish
  filing window → the home-country/US-taxes-still-owed discussion), tax-planning-consultation
  (→ "do this before you move to structure").
- **Missing timestamps (t=0):** property-legal-due-diligence (→1:59), land-registry-registration
  (→9:30), property-transfer-tax (→12:00) in "Buying a Home in Spain".
- **Refinements:** dnv-qualification-proof (→ the degree/experience requirement), dnv-renewal
  (→ the actual renewal terms).
- **Kept, imperfect but honest:** `nie` (Málaga school-paperwork mention — no webinar discusses
  the NIE substantively; noted), `dgt-*` (the only licence discussion in any webinar is the 2A19
  Q&A), `scout-where-to-live` (regional-affordability segment).

## Source-link QA click-test — all 55 official URLs verified (2026-07-04)

Launch-final QA (sequenced-backlog Phase 1 #4): every `source_url` fetched with a browser UA
(status + final URL + `<title>`/H1 checked against its obligation), the bot-walled ones
re-verified individually.

- **53/55 rendered the right page; 2 replaced (below).** Notes for the record: the two
  `sanidad.gob.es` pages carry a broken site-wide `<title>` template but the correct H1s
  ("Convenio especial de prestación de asistencia sanitaria", "Tarjeta Sanitaria Individual");
  all `inclusion.gob.es` + `sede.maec.gob.es` links fail *programmatic* TLS verification
  (server omits the intermediate cert — browsers repair it via AIA, users unaffected) but
  serve exactly the right pages (Hoja 6 NLV / Hoja 7 renovación / Hoja 8 reagrupación /
  Hoja 65 certificado UE / Teletrabajadores UGE / Autorizaciones / Cita previa MAEC);
  `interior.gob.es` (residencia/TIE) Cloudflare-challenges non-browser clients but renders
  the right page in a real browser (verified); the `portal.seg-social.gob.es` importass page
  (autonomo-social-security) is a JS portal with a generic `<title>` but its body is the
  correct "Alta en trabajo autónomo" content.
- **Dead link fixed — `empadronamiento`:** the old
  `administracion.gob.es/pagFront/buscadortramites/detalleTramite.htm?idT=32988` is a hard 404
  (portal retired; its `Tu-espacio-europeo/...` candidates are soft-404s — HTTP 200 with an
  "Error" H1, beware). Replaced with the legal basis itself:
  **BOE-A-1985-5392 (Ley 7/1985 Reguladora de las Bases del Régimen Local)** — art. 15 states
  the exact obligation ("Toda persona que viva en España está obligada a inscribirse en el
  Padrón del municipio en el que resida habitualmente"). Same pattern as community-fees (LPH)
  and ibi-property-tax (Haciendas Locales). Verified 200 + content 2026-07-04.
- **Cookie-walled link fixed — `nie`:** `policia.es/_es/extranjeria_extranjeros.php` lands on
  the site's cookie interstitial (`/_es/cookies.php`) even in a real browser — users clicking
  "View the official source" never reached NIE content. Replaced with the Ministerio del
  Interior's canonical NIE page
  (`interior.gob.es/.../extranjeria/ciudadanos-de-la-union-europea/numero-de-Identidad-de-extranjero-nie/`
  — general NIE assignment rules despite the EU-citizens nav placement): assignment
  requirements, where to apply (extranjería offices / comisarías / consulates), and the
  normalized application form, matching the step's EX-15 reference. Browser-verified
  2026-07-04.
