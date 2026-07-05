/**
 * The four i18n lint gates (docs/LOCALIZATION.md §4 — L0's definition of done, wired into
 * `npm test` so they run on every push and every deploy):
 *
 *   1. COMPLETENESS  — every locale has exactly the English key set (no missing, no orphans).
 *   2. DIGIT-LINT    — a translation never changes a number (invariant 3: "90 days" must
 *                      survive translation as 90).
 *   3. PLACEHOLDER   — every {{var}} in English exists in the translation, and vice versa.
 *   4. BRAND-LINT    — "Get Camino" and "Lola" appear verbatim, never translated/inflected.
 *
 * The gates scan `locales/<lang>/*.json` from disk, so adding a locale directory (L1: es)
 * enrolls it automatically — nothing to register. English also gets self-checks (no empty
 * values, well-formed placeholders) so the source of truth stays lintable.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { WEB_LOCALES as APP_WEB_LOCALES } from '../lib/i18n';
import { WEB_LOCALES as SERVER_WEB_LOCALES } from '../lib/serverLocale';

const LOCALES_DIR = path.resolve(__dirname, '../locales');
const SOURCE = 'en';
const BRAND_TERMS = ['Get Camino', 'Lola'];

type Flat = Record<string, string>;

function flatten(obj: unknown, prefix = '', out: Flat = {}): Flat {
  if (typeof obj === 'string') { out[prefix] = obj; return out; }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === '_comment') continue; // scaffolding notes, not UI strings
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  throw new Error(`non-string leaf at "${prefix}" — catalogs hold strings only`);
}

function loadLocale(lang: string): Record<string, Flat> {
  const dir = path.join(LOCALES_DIR, lang);
  const namespaces: Record<string, Flat> = {};
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const ns = file.replace(/\.json$/, '');
    namespaces[ns] = flatten(JSON.parse(readFileSync(path.join(dir, file), 'utf8')));
  }
  return namespaces;
}

const digitsOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).sort();
const placeholdersOf = (s: string) => (s.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort();
const count = (s: string, term: string) => s.split(term).length - 1;

const en = loadLocale(SOURCE);
const otherLocales = existsSync(LOCALES_DIR)
  ? readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== SOURCE)
      .map(d => d.name)
  : [];

describe('locale wiring stays in sync', () => {
  it('app and server WEB_LOCALES lists are identical (sitemap/routes vs switcher)', () => {
    expect([...SERVER_WEB_LOCALES].sort()).toEqual([...APP_WEB_LOCALES].sort());
  });

  it('every non-English locale directory is a shipped locale (no orphan translations)', () => {
    expect(otherLocales.sort()).toEqual([...APP_WEB_LOCALES].sort());
  });

  it('every web locale has its complete app/<locale> route tree (the SEO pages)', () => {
    // The trees are hand-copied re-exports (deliberately STATIC dirs — see app/es/_layout.tsx);
    // this is the guard that a new language can't ship with its web pages silently missing.
    const expected = ['_layout.tsx', 'index.tsx', 'sample-plan.tsx', 'privacy.tsx', 'terms.tsx',
                      'aviso-legal.tsx', 'guide/index.tsx', 'guide/[id].tsx'];
    for (const locale of APP_WEB_LOCALES) {
      for (const file of expected) {
        expect(existsSync(path.resolve(__dirname, `../app/${locale}/${file}`)),
          `app/${locale}/${file} missing — the ${locale} web tree is incomplete`).toBe(true);
      }
    }
  });
});

describe('en catalogs (source of truth) are well-formed', () => {
  it('has no empty strings and no malformed placeholders', () => {
    for (const [ns, flat] of Object.entries(en)) {
      for (const [key, value] of Object.entries(flat)) {
        expect(value.trim(), `${ns}:${key} is empty`).not.toBe('');
        // after removing well-formed {{placeholders}}, no brace may remain (catches {{typo} etc.)
        const leftovers = value.replace(/\{\{\s*[\w.]+\s*\}\}/g, '');
        expect(/[{}]/.test(leftovers), `${ns}:${key} has malformed braces: ${value}`).toBe(false);
      }
    }
  });
});

// The four gates proper. With only `en` shipped (L0) these pass vacuously — they exist so the
// FIRST translated file is linted from its first commit (L1 es fills them with real work).
describe.each(otherLocales)('locale "%s" against English', lang => {
  const target = loadLocale(lang);

  it('1. completeness — identical namespace and key sets', () => {
    expect(Object.keys(target).sort(), `namespace files differ`).toEqual(Object.keys(en).sort());
    for (const ns of Object.keys(en)) {
      const missing = Object.keys(en[ns]).filter(k => !(k in target[ns]));
      const orphans = Object.keys(target[ns]).filter(k => !(k in en[ns]));
      expect(missing, `${lang}/${ns} missing keys`).toEqual([]);
      expect(orphans, `${lang}/${ns} has keys English lacks`).toEqual([]);
    }
  });

  it('2. digit-lint — a translation never changes a number (invariant 3)', () => {
    for (const ns of Object.keys(en)) {
      for (const [key, enValue] of Object.entries(en[ns])) {
        const translated = target[ns]?.[key];
        if (typeof translated !== 'string') continue; // completeness already fails this
        expect(digitsOf(translated), `${lang}/${ns}:${key} — digits diverge from English`)
          .toEqual(digitsOf(enValue));
      }
    }
  });

  it('3. placeholder-lint — {{var}} parity with English', () => {
    for (const ns of Object.keys(en)) {
      for (const [key, enValue] of Object.entries(en[ns])) {
        const translated = target[ns]?.[key];
        if (typeof translated !== 'string') continue;
        expect(placeholdersOf(translated), `${lang}/${ns}:${key} — placeholders diverge`)
          .toEqual(placeholdersOf(enValue));
      }
    }
  });

  it('4. brand-lint — "Get Camino" and "Lola" verbatim, never translated', () => {
    for (const ns of Object.keys(en)) {
      for (const [key, enValue] of Object.entries(en[ns])) {
        const translated = target[ns]?.[key];
        if (typeof translated !== 'string') continue;
        for (const term of BRAND_TERMS) {
          expect(count(translated, term), `${lang}/${ns}:${key} — "${term}" count differs from English`)
            .toBe(count(enValue, term));
        }
      }
    }
  });
});
