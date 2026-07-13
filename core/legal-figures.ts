/**
 * Single source of truth for the national legal FIGURES (council fix C6).
 *
 * The regional-specifics pattern (core/regional-specifics.ts) applied to national numbers: each
 * figure carries its value, its display string, the official source, and a verified_at stamp.
 * Before this, €28,800 lived as an engine constant AND as hand-typed prose in two obligation
 * titles, with nothing testing they agreed — a budget-law change had to be caught in N places.
 *
 * Now: the engine reads `.value` from here, the obligation titles cite `.eur` (guarded by
 * tests/legal-figures.test.ts so prose can't drift), and the steps that turn on a figure inherit
 * its `verified_at` so their "last verified" stamp reflects THIS figure, not the blanket default.
 *
 * These track IPREM and are set by the annual budget law — re-verify every January (🔁 freshness
 * beat). Pure data; the engine stays i18n-free and deterministic.
 */
export type LegalFigure = {
  value: number;        // the number the engine compares against
  eur: string;          // the exact display string used in titles/prose (drift-guarded)
  source_url: string;   // official source for the figure
  verified_at: string;  // YYYY-MM-DD — last checked at the source
  note?: string;        // provenance (e.g. the IPREM multiple)
};

export const LEGAL_FIGURES = {
  // NLV sufficient-means: 400% of IPREM for the main applicant, +100% of IPREM per dependent.
  nlvIncomeBase: {
    value: 28_800, eur: '€28,800',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    verified_at: '2026-07-13', note: '400% of IPREM (2026)',
  },
  nlvIncomePerDependent: {
    value: 7_200, eur: '€7,200',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    verified_at: '2026-07-13', note: '100% of IPREM (2026)',
  },
  // Modelo 720: any category of overseas assets over this figure triggers the declaration.
  modelo720Threshold: {
    value: 50_000, eur: '€50,000',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI34.shtml',
    verified_at: '2026-07-13',
  },
  // Wealth tax (Modelo 714): the state net-assets allowance (regions vary).
  wealthTaxAllowance: {
    value: 700_000, eur: '€700,000',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G611.shtml',
    verified_at: '2026-07-13',
  },
} as const satisfies Record<string, LegalFigure>;

export type LegalFigureKey = keyof typeof LEGAL_FIGURES;
