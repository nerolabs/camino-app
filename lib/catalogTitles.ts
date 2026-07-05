/**
 * Locale resolution for catalog step titles (L1 — design §4).
 *
 * The ENGINE stays language-free: `buildPlan` returns English titles and every plan-shape
 * decision is locale-independent (proven by plan-snapshot). Display surfaces call
 * `displayTitle(obj)` at render time; unknown ids fall back to the English title so a missing
 * translation can never blank a step (tests/catalog-titles.test.ts makes "missing" impossible
 * for shipped locales anyway).
 */
import i18n from '@/lib/i18n';
import { ES_CATALOG_TITLES } from '@/core/i18n/es/catalog';

export function displayTitle(obj: { id: string; title: string }): string {
  if (i18n.language === 'es') return ES_CATALOG_TITLES[obj.id] ?? obj.title;
  return obj.title;
}
