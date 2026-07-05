/**
 * es guide-prose gates (L1) — the Spanish twin of guide-prose.test.ts, plus the sync-pin
 * that keeps lib/guideLocale's localized describeTiming byte-identical to the core English
 * one (core stays i18n-free because server code imports it).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { GUIDES, describeTiming, CATEGORY_LABEL } from '../core/guide-content';
import { GUIDE_PROSE } from '../core/guide-prose';
import { ES_GUIDE_PROSE } from '../core/i18n/es/guide-prose';
import { ES_CATALOG_TITLES } from '../core/i18n/es/catalog';
import { describeTimingLocalized, categoryLabel, categoryTip } from '../lib/guideLocale';
import { CATEGORY_TIP } from '../core/email-digest';
import i18n from '../lib/i18n';

const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();
const count = (s: string, term: string) => s.split(term).length - 1;

describe('es guide prose (invariant 3, per locale)', () => {
  it('covers every catalog obligation, and nothing else', () => {
    const missing = GUIDES.filter(g => !(g.id in ES_GUIDE_PROSE)).map(g => g.id);
    expect(missing, 'obligations missing es prose').toEqual([]);
    const ids = new Set(GUIDES.map(g => g.id));
    const orphans = Object.keys(ES_GUIDE_PROSE).filter(id => !ids.has(id));
    expect(orphans, 'es prose for unknown ids').toEqual([]);
  });

  it('never introduces a number the (es) title does not carry — digit-lint', () => {
    for (const g of GUIDES) {
      const prose = ES_GUIDE_PROSE[g.id];
      if (!prose) continue;
      const allowed = new Set(digitsOf(ES_CATALOG_TITLES[g.id] ?? g.title));
      const offenders = digitsOf(prose).filter(d => !allowed.has(d));
      expect(offenders, `es prose for "${g.id}" introduces numbers its title lacks`).toEqual([]);
    }
  });

  it('is substantive prose (no stubs), and brand terms match the English twin', () => {
    for (const g of GUIDES) {
      const es = ES_GUIDE_PROSE[g.id] ?? '';
      const en = GUIDE_PROSE[g.id] ?? '';
      expect(es.length, `es prose for "${g.id}" suspiciously short`).toBeGreaterThan(en.length * 0.5);
      for (const term of ['Get Camino', 'Lola']) {
        expect(count(es, term), `"${term}" count differs from English in "${g.id}"`).toBe(count(en, term));
      }
    }
  });
});

describe('localized guide helpers stay in sync with core (en parity)', () => {
  afterEach(async () => { await i18n.changeLanguage('en'); });

  it('describeTimingLocalized(en) is byte-identical to core describeTiming for all 60', () => {
    for (const g of GUIDES) {
      expect(describeTimingLocalized(g), `timing drift for "${g.id}"`).toBe(describeTiming(g));
    }
  });

  it('categoryLabel/categoryTip(en) match the core maps', () => {
    for (const cat of Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]) {
      expect(categoryLabel(cat)).toBe(CATEGORY_LABEL[cat]);
      expect(categoryTip(cat)).toBe(CATEGORY_TIP[cat]);
    }
  });

  it('es: timing sentences and categories render in Spanish', async () => {
    await i18n.changeLanguage('es');
    expect(categoryLabel('tax')).toBe('Impuestos');
    const results = GUIDES.map(g => describeTimingLocalized(g)).join('\n');
    expect(results).not.toMatch(/Due |Follows |A yearly obligation/);
    expect(results).toMatch(/Vence /);
  });
});
