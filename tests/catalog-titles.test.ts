/**
 * Per-locale catalog-title gates (L1/L3): the 63 obligation titles are the roadmap's legal
 * content, so every shipped locale's titles get the same four disciplines, sourced from the
 * CATALOG itself so obligation #61 fails here until every locale follows. Locales enroll via
 * core/i18n/registry.ts — an entry can't ship half-translated.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '../core/guide-content';
import { CATALOG_TITLES } from '../core/i18n/registry';
import i18n from '../lib/i18n';
import { displayTitle } from '../lib/catalogTitles';

const objectives = new Map(GUIDES.map(o => [o.id, o.title]));
const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();
const LOCALES = Object.keys(CATALOG_TITLES);

describe.each(LOCALES)('catalog titles "%s" (localization gates on the legal content)', lang => {
  const titles = CATALOG_TITLES[lang];

  it('completeness — all 73 obligations have a title, and no orphans', () => {
    expect(objectives.size).toBe(73);
    const missing = [...objectives.keys()].filter(id => !(id in titles));
    expect(missing, `obligations missing a ${lang} title`).toEqual([]);
    const orphans = Object.keys(titles).filter(id => !objectives.has(id));
    expect(orphans, `${lang} titles for ids not in the catalog (typo?)`).toEqual([]);
  });

  it('digit-lint — a translated title never changes a number (invariant 3)', () => {
    for (const [id, enTitle] of objectives) {
      const translated = titles[id];
      if (!translated) continue; // completeness already fails this
      expect(digitsOf(translated), `${lang} title for "${id}" — digits diverge from English`)
        .toEqual(digitsOf(enTitle));
    }
  });

  it('substantive — no stub or suspiciously short translations', () => {
    for (const [id, enTitle] of objectives) {
      const translated = titles[id] ?? '';
      expect(translated.length, `${lang} title for "${id}" is suspiciously short vs English`)
        .toBeGreaterThan(enTitle.length * 0.5);
    }
  });

  it('displayTitle resolves the locale and falls back to English', async () => {
    const [id, enTitle] = [...objectives.entries()][0];
    try {
      await i18n.changeLanguage(lang);
      expect(displayTitle({ id, title: enTitle })).toBe(titles[id]);
      expect(displayTitle({ id: 'not-a-real-id', title: enTitle })).toBe(enTitle);
      await i18n.changeLanguage('en');
      expect(displayTitle({ id, title: enTitle })).toBe(enTitle);
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
