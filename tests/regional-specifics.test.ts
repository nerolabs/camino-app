import { describe, it, expect } from 'vitest';
import { REGIONAL_SPECIFICS, regionalSpecific } from '../core/regional-specifics';
import { CATALOG } from '../core/engine-controller';
import { SLOTS } from '../core/interview-controller';
import en from '../locales/en/plan.json';

// The regional facts are the most correction-prone data in the product (Valencia changed
// its rate WEEKS before this file was written). Pin the structural honesty: real regions,
// real regional obligations, official https sources, dated verification, and digits that
// live only in the data file.

const REGION_KEYS = new Set(SLOTS.find(s => s.field === 'region')!.options!);
const CATALOG_BY_ID = new Map(CATALOG.map(o => [o.id, o]));
const TEMPLATES = (en as Record<string, unknown>).regionalFacts as Record<string, string>;

describe('regional specifics (TODO 21, staged)', () => {
  it('every fact points at a real region and a real regional obligation', () => {
    for (const f of REGIONAL_SPECIFICS) {
      expect(REGION_KEYS.has(f.region), `${f.region} is not a region key`).toBe(true);
      const o = CATALOG_BY_ID.get(f.obligation_id);
      expect(o, `${f.obligation_id} not in catalog`).toBeTruthy();
      expect(o!.regional, `${f.obligation_id} is not flagged regional`).toBe(true);
    }
  });

  it('every fact carries an https official source and an ISO verification date', () => {
    for (const f of REGIONAL_SPECIFICS) {
      expect(f.source_url).toMatch(/^https:\/\/(www\.)?(atc\.gencat\.cat|atv\.gva\.es|comunidad\.madrid|juntadeandalucia\.es|hacienda\.gob\.es|boe\.es|atriga\.gal)\//);
      expect(f.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('templates exist in the catalogs and carry NO digits of their own (digits live in the data file)', () => {
    for (const f of REGIONAL_SPECIFICS) {
      const tpl = TEMPLATES[f.template];
      expect(tpl, `template regionalFacts.${f.template} missing`).toBeTruthy();
      expect(tpl.replace(/\{\{\s*[\w.]+\s*\}\}/g, '')).not.toMatch(/\d/);
      // every placeholder the template needs is provided (region comes from the app)
      for (const m of tpl.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
        const key = m[1];
        if (key !== 'region') expect(f.values[key], `${f.template} needs ${key}`).toBeTruthy();
      }
    }
  });

  it('lookup: right fact for (obligation, region); silent for unverified regions', () => {
    expect(regionalSpecific('property-transfer-tax', 'andalucia')?.values.rate).toBe('7 %');
    expect(regionalSpecific('property-transfer-tax', 'madrid')?.values.rate).toBe('6 %');
    expect(regionalSpecific('property-transfer-tax', 'comunidad-valenciana')?.values.rate).toBe('9 %');
    expect(regionalSpecific('property-transfer-tax', 'cataluna')?.template).toBe('itp_brackets');
    expect(regionalSpecific('property-transfer-tax', 'galicia')?.values.rate).toBe('8 %');   // tranche 2
    expect(regionalSpecific('property-transfer-tax', 'murcia')?.values.rate).toBe('7.75 %'); // Ley 3/2025 catch
    expect(regionalSpecific('wealth-tax', 'comunidad-valenciana')?.values.exempt).toBe('€1,000,000'); // Ley 5/2025 catch
    expect(regionalSpecific('property-transfer-tax', 'pais-vasco')).toBeUndefined();  // foral — own pass
    expect(regionalSpecific('property-transfer-tax', 'not_sure')).toBeUndefined();
    expect(regionalSpecific('wealth-tax', 'madrid')?.template).toBe('wealth_relief');
  });
});
