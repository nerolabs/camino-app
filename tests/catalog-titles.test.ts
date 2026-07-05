/**
 * Per-locale catalog-title gates (L1 — the runtime side of the "tsc-enforced complete" design):
 * the 60 obligation titles are the roadmap's legal content, so their translations get the same
 * four disciplines as the JSON catalogs, sourced from the CATALOG itself so obligation #61
 * fails here until every locale follows.
 */
import { describe, it, expect } from 'vitest';
import { GUIDES } from '../core/guide-content';
import { ES_CATALOG_TITLES } from '../core/i18n/es/catalog';
import i18n from '../lib/i18n';
import { displayTitle } from '../lib/catalogTitles';

// Every catalog obligation with its English title — GUIDES re-exports the full CATALOG,
// so obligation #61 lands here automatically and fails until every locale follows.
function allObjectives(): Map<string, string> {
  return new Map(GUIDES.map(o => [o.id, o.title]));
}

const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();

describe('es catalog titles (localization gates on the legal content)', () => {
  const objectives = allObjectives();

  it('completeness — all 60 obligations have an es title, and no orphans', () => {
    expect(objectives.size).toBe(60);
    const missing = [...objectives.keys()].filter(id => !(id in ES_CATALOG_TITLES));
    expect(missing, 'obligations missing an es title').toEqual([]);
    const orphans = Object.keys(ES_CATALOG_TITLES).filter(id => !objectives.has(id));
    expect(orphans, 'es titles for ids not in the catalog (typo?)').toEqual([]);
  });

  it('digit-lint — a translated title never changes a number (invariant 3)', () => {
    for (const [id, enTitle] of objectives) {
      const esTitle = ES_CATALOG_TITLES[id];
      if (!esTitle) continue; // completeness already fails this
      expect(digitsOf(esTitle), `es title for "${id}" — digits diverge from English`)
        .toEqual(digitsOf(enTitle));
    }
  });

  it('substantive — no stub or suspiciously short translations', () => {
    for (const [id, enTitle] of objectives) {
      const esTitle = ES_CATALOG_TITLES[id] ?? '';
      expect(esTitle.length, `es title for "${id}" is suspiciously short vs English`)
        .toBeGreaterThan(enTitle.length * 0.5);
    }
  });

  it('displayTitle resolves es and falls back to English', async () => {
    const [id, enTitle] = [...objectives.entries()][0];
    try {
      await i18n.changeLanguage('es');
      expect(displayTitle({ id, title: enTitle })).toBe(ES_CATALOG_TITLES[id]);
      expect(displayTitle({ id: 'not-a-real-id', title: enTitle })).toBe(enTitle);
      await i18n.changeLanguage('en');
      expect(displayTitle({ id, title: enTitle })).toBe(enTitle);
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
