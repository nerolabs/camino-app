/**
 * Locale resolution for catalog step titles (L1/L3 — design §4).
 *
 * The ENGINE stays language-free: `buildPlan` returns English titles and every plan-shape
 * decision is locale-independent (proven by plan-snapshot). Display surfaces call
 * `displayTitle(obj)` at render time; titles come from the per-locale registry with English
 * fallback so a missing translation can never blank a step (the per-locale tests make
 * "missing" impossible for shipped locales anyway).
 */
import i18n from '@/lib/i18n';
import { titleFor } from '@/core/i18n/registry';

export function displayTitle(obj: { id: string; title: string }): string {
  return titleFor(i18n.language, obj.id, obj.title);
}
