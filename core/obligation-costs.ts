/**
 * Per-obligation COST registry — the money layer for the move-budget feature.
 *
 * Mirrors the core/legal-figures.ts pattern (value + source + verified_at, drift-guarded by a
 * test) but keyed by obligation id, so the 73-entry CATALOG in engine-controller.ts stays
 * untouched and the engine stays deterministic. Costs have their own verification cadence, so
 * keeping them in one auditable file lets the monthly freshness robot watch them as a unit.
 *
 * Every obligation falls into one of four cost KINDS (from the researched costed catalog):
 *   'firm'     — a fixed statutory fee, the same for everyone, traced to a government tasa.
 *                Carries an exact `eur`. Camino states the number.
 *   'soft'     — a real cost that scales with a number the USER provides (home price, cadastral
 *                value, income, net wealth). Carries `base` + `pct` or `pctRange`. Camino states
 *                the sourced rate; the user supplies the base. `recurring` splits one-time move
 *                costs (ITP, notary) from ongoing ones (IBI, income tax) so the headline "cost to
 *                move" is never inflated by lifetime taxes.
 *   'personal' — a discretionary/market cost with NO official fee to cite. Camino asserts NO euro;
 *                `typicalEur` is an OPTIONAL third-party market band (Flavor B), absent for
 *                truly-your-call items like a scouting trip (Flavor A).
 *   (none)     — obligations with no cost (documents you hold, heads-up checks, free gov acts)
 *                simply have NO entry here; the budget engine treats a missing id as free.
 *
 * ⚠️ verified:false on every entry — these are a RESEARCHED FIRST PASS (five parallel passes,
 * 2026 figures) and have NOT been through Camino's per-figure verification against the official
 * source. The move-budget feature must stay flag-gated / show these as "estimate — pending
 * verification" until each entry's `verified` flips true (the App Attest / Play Integrity playbook:
 * land the mechanism flag-off, prove the data, then turn it on). Known must-verifies are noted
 * inline; the nationality-specific consulate visa fee must resolve at runtime, not from one euro.
 */

export type CostConfidence = 'high' | 'med' | 'low';
export type CostKind = 'firm' | 'soft' | 'personal';
export type CostBase = 'home_price' | 'cadastral_value' | 'income' | 'net_wealth';

export type ObligationCost = {
  kind: CostKind;
  display: string;               // the human string the UI shows verbatim (e.g. "€16.08", "6–13% of price", "your call")
  confidence: CostConfidence;
  verified: boolean;             // has this passed Camino's per-figure verification? (research seed = false)
  recurring?: 'monthly' | 'annual'; // absent = one-time (counts toward the "cost to move" headline)
  source_url?: string;           // required for firm/soft; omitted for personal (no official fee)
  verified_at?: string;          // YYYY-MM-DD last checked at source (firm/soft)
  note?: string;

  // kind === 'firm'
  eur?: number;                  // the exact fee

  // kind === 'soft' — a percentage of a user-provided base
  base?: CostBase;
  pct?: number;                  // single representative rate (region/bracket known)
  pctRange?: [number, number];   // when it genuinely varies by region or bracket

  // kind === 'personal' — optional market band; absent means "no hint, truly your call"
  typicalEur?: [number, number];
  perUnit?: string;              // e.g. "per page" when typicalEur is a unit price, not a total
};

const RESEARCHED = '2026-07-31'; // date of the research pass; NOT a Camino verification stamp

export const OBLIGATION_COSTS: Record<string, ObligationCost> = {
  // ─────────────── FIRM (fixed official tasas) ───────────────
  residencia:                     { kind: 'firm', eur: 16.08, display: '€16.08', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'TIE card issuance · tasa 790/012' },
  nie:                            { kind: 'firm', eur: 9.84,  display: '€9.84',  source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'NIE assignment · tasa 790/012' },
  'eu-registration-certificate':  { kind: 'firm', eur: 12.00, display: '€12.00', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Green cert · tasa 790/012' },
  'eu-family-member-card':        { kind: 'firm', eur: 12.00, display: '€12.00', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'med',  verified: false, note: 'EX-19 · tasa; often waived for direct-line EU family — VERIFY' },
  'dele-a2-exam':                 { kind: 'firm', eur: 138.00, display: '€138.00', source_url: 'https://examenes.cervantes.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Instituto Cervantes DELE A2' },
  'ccse-exam':                    { kind: 'firm', eur: 85.00, display: '€85.00', source_url: 'https://examenes.cervantes.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Instituto Cervantes CCSE' },
  'homologacion-titulos':         { kind: 'firm', eur: 166.50, display: '€166.50', source_url: 'https://universidades.sede.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'University degree · tasa 790/107; non-university uses 790/079 (lower)' },
  'dgt-eu-licence-check':         { kind: 'firm', eur: 28.87, display: '€28.87', source_url: 'https://sede.dgt.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'EU licence canje/registro · DGT tasa 2.3' },
  'consulate-appointment':        { kind: 'firm', eur: 80,    display: '≈€80', source_url: 'https://www.exteriores.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Long-stay visa fee — NATIONALITY-SPECIFIC (US ≈€125); resolve at runtime, do not ship one euro' },
  'work-visa-employer-sponsored': { kind: 'firm', eur: 91,    display: '≈€91', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Visa fee (≈€80, reciprocity) + authorization tasa 790/052 (€10.94)' },
  'self-employment-visa-authorization': { kind: 'firm', eur: 10.94, display: '€10.94', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Initial residence authorization · tasa 790/052' },
  'family-reunification':         { kind: 'firm', eur: 10.94, display: '€10.94', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Reunification authorization · tasa 790/052 (+ TIE card later)' },
  'nlv-renewal':                  { kind: 'firm', eur: 19.30, display: '€19.30', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, recurring: undefined, note: 'TIE renewal card · tasa 790/012 (years away — not a move cost)' },
  'dnv-renewal':                  { kind: 'firm', eur: 19.30, display: '€19.30', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'TIE renewal card · tasa 790/012 (years away — not a move cost)' },
  'permanent-residence':          { kind: 'firm', eur: 21.87, display: '€21.87', source_url: 'https://sede.policia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Larga duración card · tasa 790/012 (5+ years away)' },
  'citizenship-application':      { kind: 'firm', eur: 104.05, display: '€104.05', source_url: 'https://www.mjusticia.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Naturalisation · tasa 790/026 (years away); sources vary 104.05–105.82' },
  'autonomo-social-security':     { kind: 'firm', eur: 87, display: '≈€87', recurring: 'monthly', source_url: 'https://www.seg-social.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'RETA flat rate €80 + MEI, year 1; income-based after — VERIFY 2026' },
  'convenio-especial':            { kind: 'firm', eur: 60, display: '€60/mo (<65) · €157/mo (≥65)', recurring: 'monthly', source_url: 'https://www.seg-social.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Public-healthcare buy-in · RD 576/2013; €157 for ≥65 — VERIFY 2026 indexation' },
  'dgt-exchange':                 { kind: 'firm', eur: 28.87, display: '€28.87 + ~€35–40 medical', source_url: 'https://sede.dgt.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Exchange tasa; psicotécnico medical (~€35–40) is a separate personal cost' },
  'dgt-exam':                     { kind: 'firm', eur: 94.05, display: '€94.05 tasa', source_url: 'https://sede.dgt.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'DGT exam tasa; autoescuela lessons (~€1,000–1,400) are personal' },

  // ─────────────── SOFT (scales with a user number) ───────────────
  'property-transfer-tax':        { kind: 'soft', base: 'home_price', pctRange: [6, 13], display: '6–13% of price', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'ITP resale; region-set (most 6–10%). Key off comunidad; youth/first-home reliefs apply' },
  'completion-deed-notary':       { kind: 'soft', base: 'home_price', pctRange: [0.2, 0.5], display: '≈0.2–0.5% of price', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Notary arancel by price band · RD 1426/1989 (+21% IVA)' },
  'land-registry-registration':   { kind: 'soft', base: 'home_price', pctRange: [0.1, 0.25], display: '≈0.1–0.25% of price', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Registry arancel by value · RD 1427/1989 (5% discount, +21% IVA)' },
  'community-fees':               { kind: 'soft', base: 'home_price', pctRange: [0, 0], display: '≈€50–110/mo', recurring: 'monthly', source_url: 'https://www.boe.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Comunidad quota scales with building/services, not price — treat display as market band' },
  'ibi-property-tax':             { kind: 'soft', base: 'cadastral_value', pctRange: [0.4, 1.1], display: '0.4–1.1% of cadastral /yr', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Municipal, on cadastral value (≈50–60% of price)' },
  'nonresident-property-tax':     { kind: 'soft', base: 'cadastral_value', pctRange: [0.25, 0.5], display: '~0.25–0.5% of cadastral /yr', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'low', verified: false, note: 'Modelo 210: 1.1–2% cadastral × 19/24% — effective rate approximated' },
  'wealth-tax':                   { kind: 'soft', base: 'net_wealth', pctRange: [0.2, 3.5], display: '0.2–3.5% above €700k', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'med', verified: false, note: 'Modelo 714; region overrides heavily (Madrid ≈€0). Only above allowance' },
  'modelo-100':                   { kind: 'soft', base: 'income', pctRange: [19, 47], display: '19–47% of income', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'IRPF progressive; filing free. Ongoing life cost, not a move cost' },
  'modelo-130':                   { kind: 'soft', base: 'income', pctRange: [20, 20], display: '~20% of profit', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Quarterly IRPF prepay (self-employed); filing free' },
  'modelo-303':                   { kind: 'soft', base: 'income', pctRange: [21, 21], display: '21% VAT collected − paid', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Quarterly VAT; filing free, VAT is pass-through' },
  'modelo-200':                   { kind: 'soft', base: 'income', pctRange: [15, 25], display: '25% (15% first yrs)', recurring: 'annual', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Corporation tax; filing free' },
  'modelo-720':                   { kind: 'soft', base: 'net_wealth', pctRange: [0, 0], display: '€0 to file', source_url: 'https://sede.agenciatributaria.gob.es', verified_at: RESEARCHED, confidence: 'high', verified: false, note: 'Informative declaration — free; penalties only if late/wrong' },

  // ─────────────── PERSONAL (no official fee; optional market band) ───────────────
  'scout-where-to-live':          { kind: 'personal', display: 'your call', confidence: 'high', verified: false, note: 'A scouting trip: flights + lodging in 2–3 areas — origin-dependent, no hint' },
  'language-classes':             { kind: 'personal', display: 'your call', confidence: 'high', verified: false, note: 'Academy / course fees — varies too widely to suggest' },
  'tax-planning-consultation':    { kind: 'personal', display: 'your call', confidence: 'high', verified: false, note: 'Cross-border tax adviser — discretionary professional fee' },
  'nlv-non-work-declaration':     { kind: 'personal', display: 'notary fee varies', confidence: 'med', verified: false, note: 'Notarised abroad; provider-set' },
  'dnv-qualification-proof':      { kind: 'personal', display: 'apostille fee varies', confidence: 'med', verified: false, note: 'Degree apostille by home authority' },
  'apostille-documents':          { kind: 'personal', display: 'home-country fee', confidence: 'high', verified: false, note: 'Set by your home authority — no Spanish tasa' },
  'university-admission':         { kind: 'personal', display: 'tuition', confidence: 'high', verified: false, note: 'Set by the institution' },
  'spanish-bank-account':         { kind: 'personal', display: 'usually €0', typicalEur: [0, 60], recurring: 'annual', confidence: 'med', verified: false, note: 'Many banks free; some non-resident accounts charge' },
  'property-legal-due-diligence': { kind: 'personal', display: '~€1,000–3,000', typicalEur: [1000, 3000], confidence: 'med', verified: false, note: 'Private conveyancing lawyer (~1% market convention); no official tasa' },
  'nlv-health-insurance':         { kind: 'personal', display: '~€46–74/mo', typicalEur: [46, 74], recurring: 'monthly', confidence: 'med', verified: false, note: 'Private full-cover premium; market-quoted by age/insurer' },
  'student-visa-health-insurance':{ kind: 'personal', display: '~€37–50/mo', typicalEur: [37, 50], recurring: 'monthly', confidence: 'med', verified: false, note: 'Visa-compliant private premium; market-quoted' },
  'pet-import':                   { kind: 'personal', display: '~€200–400', typicalEur: [200, 400], confidence: 'high', verified: false, note: 'Vet: microchip, rabies vaccine, EU health cert' },
  'medical-certificate':          { kind: 'personal', display: '~€50–100', typicalEur: [50, 100], confidence: 'high', verified: false, note: 'Private doctor; your provider sets it' },
  'sworn-translation':            { kind: 'personal', display: '~€30–60 / page', typicalEur: [30, 60], perUnit: 'per page', confidence: 'high', verified: false, note: 'Traductor jurado, per-page market rate; no fixed tasa' },
  'criminal-background-check':    { kind: 'personal', display: '~€0–50', typicalEur: [0, 50], confidence: 'med', verified: false, note: 'Home-country record issuance fee' },
};

export type ObligationCostId = keyof typeof OBLIGATION_COSTS;
