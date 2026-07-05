/**
 * Per-locale guide-prose gates (L1/L3) — every shipped locale's 60 explainers get the same
 * honesty contract as English, plus the sync-pin that keeps lib/guideLocale's localized
 * describeTiming byte-identical to the core English one (core stays i18n-free because server
 * code imports it). Locales enroll via core/i18n/registry.ts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { GUIDES, describeTiming, CATEGORY_LABEL } from '../core/guide-content';
import { GUIDE_PROSE } from '../core/guide-prose';
import { CATALOG_TITLES, GUIDE_PROSE_BY_LOCALE } from '../core/i18n/registry';
import { describeTimingLocalized, categoryLabel, categoryTip } from '../lib/guideLocale';
import { CATEGORY_TIP } from '../core/email-digest';
import i18n from '../lib/i18n';

const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();
const count = (s: string, term: string) => s.split(term).length - 1;
const LOCALES = Object.keys(GUIDE_PROSE_BY_LOCALE);

describe.each(LOCALES)('guide prose "%s" (invariant 3, per locale)', lang => {
  const prose = GUIDE_PROSE_BY_LOCALE[lang];
  const titles = CATALOG_TITLES[lang] ?? {};

  it('covers every catalog obligation, and nothing else', () => {
    const missing = GUIDES.filter(g => !(g.id in prose)).map(g => g.id);
    expect(missing, `obligations missing ${lang} prose`).toEqual([]);
    const ids = new Set(GUIDES.map(g => g.id));
    const orphans = Object.keys(prose).filter(id => !ids.has(id));
    expect(orphans, `${lang} prose for unknown ids`).toEqual([]);
  });

  it('never introduces a number the localized title does not carry — digit-lint', () => {
    for (const g of GUIDES) {
      const p = prose[g.id];
      if (!p) continue;
      const allowed = new Set(digitsOf(titles[g.id] ?? g.title));
      const offenders = digitsOf(p).filter(d => !allowed.has(d));
      expect(offenders, `${lang} prose for "${g.id}" introduces numbers its title lacks`).toEqual([]);
    }
  });

  it('is substantive prose (no stubs), and brand terms match the English twin', () => {
    for (const g of GUIDES) {
      const p = prose[g.id] ?? '';
      const en = GUIDE_PROSE[g.id] ?? '';
      expect(p.length, `${lang} prose for "${g.id}" suspiciously short`).toBeGreaterThan(en.length * 0.5);
      for (const term of ['Get Camino', 'Lola']) {
        expect(count(p, term), `"${term}" count differs from English in ${lang} "${g.id}"`).toBe(count(en, term));
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

  it.each(LOCALES)('%s: timing sentences leave no English behind', async lang => {
    await i18n.changeLanguage(lang);
    const results = GUIDES.map(g => describeTimingLocalized(g)).join('\n');
    expect(results).not.toMatch(/Due |Follows |A yearly obligation|an earlier/);
  });
});
