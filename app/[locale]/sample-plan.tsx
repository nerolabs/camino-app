import { WEB_LOCALES } from '@/lib/i18n';

// Cascaded {locale} params come from ../_layout; returning them per-locale here makes the
// static exporter emit a concrete page per shipped web locale.
export function generateStaticParams(params: { locale?: string } = {}): Record<string, string>[] {
  return params.locale ? [{ locale: params.locale }] : WEB_LOCALES.map(locale => ({ locale }));
}
export { default } from '../sample-plan';
