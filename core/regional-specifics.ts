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
 *  - NOT YET (needs its own verification pass): the other 13 comunidades' ITP; wealth-tax
 *    scales for Cataluña/C. Valenciana (bracketed, nuanced); school-enrollment windows
 *    everywhere (they move EVERY year — a wrong month is worse than no month); IBI (set
 *    per municipality, not per comunidad — may never fit this table honestly).
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
];

export function regionalSpecific(obligationId: string, region: string | undefined | null): RegionalSpecific | undefined {
  if (!region) return undefined;
  return REGIONAL_SPECIFICS.find(s => s.obligation_id === obligationId && s.region === region);
}
