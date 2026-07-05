/**
 * The per-locale content registry (L3): catalog titles and guide prose for every non-English
 * locale, keyed by language code. Pure data imports — safe everywhere (client, vitest, and
 * the Workers runtime). Adding a language = add its two files and register them here; the
 * per-locale test suites iterate this registry, so an entry can't ship half-translated.
 */
import { ES_CATALOG_TITLES } from './es/catalog';
import { ES_GUIDE_PROSE } from './es/guide-prose';
import { FR_CATALOG_TITLES } from './fr/catalog';
import { FR_GUIDE_PROSE } from './fr/guide-prose';
import { DE_CATALOG_TITLES } from './de/catalog';
import { DE_GUIDE_PROSE } from './de/guide-prose';
import { IT_CATALOG_TITLES } from './it/catalog';
import { IT_GUIDE_PROSE } from './it/guide-prose';

export const CATALOG_TITLES: Record<string, Record<string, string>> = {
  es: ES_CATALOG_TITLES,
  fr: FR_CATALOG_TITLES,
  de: DE_CATALOG_TITLES,
  it: IT_CATALOG_TITLES,
};

export const GUIDE_PROSE_BY_LOCALE: Record<string, Record<string, string>> = {
  es: ES_GUIDE_PROSE,
  fr: FR_GUIDE_PROSE,
  de: DE_GUIDE_PROSE,
  it: IT_GUIDE_PROSE,
};

export function titleFor(lang: string, id: string, fallback: string): string {
  return CATALOG_TITLES[lang]?.[id] ?? fallback;
}
