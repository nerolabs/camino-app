/**
 * Region-by-region specifics (TODO 21, STAGED — first tranche 2026-07-12).
 *
 * Every figure here was verified on the named region's OWN official tax portal on
 * `verified_at` (invariant 3: no invented or secondhand rates). The digits live ONLY in
 * this file — the sentences around them are localized templates (locales/<lang>/plan.json
 * "regionalFacts.*") interpolating these values, so a translation can never change a
 * number by construction.
 *
 * STAGING RECORD (what's in, what's deliberately not yet):
 *  - IN: ITP resale-property rates for Andalucía, Madrid, Cataluña, C. Valenciana (the
 *    four biggest expat regions), + the wealth-tax regional reliefs for Madrid and
 *    Andalucía (clean, stable facts).
 *  - TRANCHE 2 (2026-07-13): the remaining 10 common-regime comunidades' ITP + the
 *    Cataluña/C. Valenciana wealth scales — verified in the Ministry of Hacienda's
 *    official "Tributación Autonómica, Medidas 2026" Cap-IV compilation (statute-cited,
 *    updated Apr 2026). Two more live catches: Murcia's ITP cut 8%→7.75% (Ley 3/2025 —
 *    ATRM's own FAQ was stale) and CV's wealth exemption €500k→€1M (Ley 5/2025).
 *  - STILL NOT COVERED (honest gaps): País Vasco + Navarra (FORAL regimes — per-territorio
 *    rates, need their own pass), Ceuta/Melilla (special regime), school-enrollment windows
 *    (move EVERY year — a wrong month is worse than no month), IBI (municipal — may never
 *    fit this table honestly).
 *
 * Notable finds from the verification pass, kept as comments so the next pass starts warm:
 *  - Cataluña reformed ITP mid-2025 (progressive 10→13% since 27 Jun 2025; 20% for large
 *    holders/whole buildings).
 *  - C. Valenciana cut its general rate 10% → 9% effective 1 Jun 2026 — weeks before this
 *    pass. Secondhand summaries still widely say 10%.
 */

export type RegionalSpecific = {
  region: string;         // key from core/regions.ts
  obligation_id: string;  // catalog id this fact attaches to
  template: string;       // plan.json key under regionalFacts.*
  values: Record<string, string>; // the verified figures — the ONLY place digits live
  source_url: string;     // the region's own official page (shown as the fact's source)
  verified_at: string;    // YYYY-MM-DD of the verification against source_url
};

export const REGIONAL_SPECIFICS: RegionalSpecific[] = [
  // ── ITP (property-transfer-tax) ─────────────────────────────────────────────
  {
    region: 'andalucia', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '7 %' },
    source_url: 'https://www.juntadeandalucia.es/organismos/economiahaciendayfondoseuropeos/areas/tributos-juego/tributos/paginas/impuestos-cedidos-transmisiones.html',
    verified_at: '2026-07-12',
  },
  {
    region: 'madrid', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '6 %' },
    source_url: 'https://www.comunidad.madrid/atencion-contribuyente/transmisiones-patrimoniales-onerosas',
    verified_at: '2026-07-12',
  },
  {
    region: 'cataluna', obligation_id: 'property-transfer-tax',
    template: 'itp_brackets', values: { low: '10 %', cap: '€600,000', high: '13 %' },
    source_url: 'https://atc.gencat.cat/ca/tributs/itpajd/tpo/tarifes-tipus/',
    verified_at: '2026-07-12',
  },
  {
    region: 'comunidad-valenciana', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '9 %' }, // cut from 10% effective 1 Jun 2026
    source_url: 'https://atv.gva.es/es/itpajd',
    verified_at: '2026-07-12',
  },
  // ── ITP tranche 2 (2026-07-13, all verified in the Ministry of Hacienda's official
  //    "Tributación Autonómica — Medidas 2026, Capítulo IV" compilation, updated Apr 2026,
  //    which cites each region's statute; Galicia additionally on ATRIGA, Murcia on BOE) ──
  {
    region: 'asturias', obligation_id: 'property-transfer-tax',
    template: 'itp_brackets', values: { low: '8 %', cap: '€300,000', high: '10 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'cantabria', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '9 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'la-rioja', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '7 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'castilla-la-mancha', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '9 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'canarias', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '6.5 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'extremadura', obligation_id: 'property-transfer-tax',
    template: 'itp_brackets', values: { low: '8 %', cap: '€360,000', high: '11 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'baleares', obligation_id: 'property-transfer-tax',
    template: 'itp_brackets', values: { low: '8 %', cap: '€400,000', high: '13 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'castilla-y-leon', obligation_id: 'property-transfer-tax',
    template: 'itp_brackets', values: { low: '8 %', cap: '€250,000', high: '10 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    region: 'galicia', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '8 %' },
    source_url: 'https://www.atriga.gal/es_ES/preguntas-frecuentes/imposto-sobre-transmisions-patrimoniais-e-actos-xuridicos-documentados',
    verified_at: '2026-07-13',
  },
  {
    // Cut from 8% by Ley 3/2025 (BORM 24-7-2025) — ATRM's own FAQ still said 8% at
    // verification time; the BOE-published law is the primary source.
    region: 'murcia', obligation_id: 'property-transfer-tax',
    template: 'itp_flat', values: { rate: '7.75 %' },
    source_url: 'https://www.boe.es/buscar/doc.php?id=BOE-A-2025-16147',
    verified_at: '2026-07-13',
  },
  // ── Wealth tax (regional reliefs) ───────────────────────────────────────────
  {
    region: 'madrid', obligation_id: 'wealth-tax',
    template: 'wealth_relief', values: { pct: '100 %', threshold: '€3 million' },
    source_url: 'https://www.comunidad.madrid/atencion-contribuyente/patrimonio',
    verified_at: '2026-07-12',
  },
  {
    region: 'andalucia', obligation_id: 'wealth-tax',
    template: 'wealth_relief', values: { pct: '100 %', threshold: '€3 million' },
    source_url: 'https://www.juntadeandalucia.es/organismos/economiahaciendayfondoseuropeos/areas/tributos-juego/tributos/paginas/impuestos-cedidos-patrimonio.html',
    verified_at: '2026-07-12',
  },
  // ── Wealth-tax scales (2026-07-13, Hacienda Cap-IV compilation) ─────────────
  {
    region: 'cataluna', obligation_id: 'wealth-tax',
    template: 'wealth_scale', values: { exempt: '€500,000', top: '2.75 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
  {
    // Raised from €500,000 by Ley 5/2025, effective 31-12-2025 — most secondhand
    // summaries still carry the old figure.
    region: 'comunidad-valenciana', obligation_id: 'wealth-tax',
    template: 'wealth_scale', values: { exempt: '€1,000,000', top: '3.5 %' },
    source_url: 'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf',
    verified_at: '2026-07-13',
  },
];

export function regionalSpecific(obligationId: string, region: string | undefined | null): RegionalSpecific | undefined {
  if (!region) return undefined;
  return REGIONAL_SPECIFICS.find(s => s.obligation_id === obligationId && s.region === region);
}
