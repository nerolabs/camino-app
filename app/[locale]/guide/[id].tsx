import { WEB_LOCALES } from '@/lib/i18n';
import { guideById } from '@/core/guide-content';

// locale × guide id — 60 prerendered pages per shipped web locale (cascaded {locale} from
// the [locale] layout when present).
export function generateStaticParams(params: { locale?: string } = {}): Record<string, string>[] {
  const locales = params.locale ? [params.locale] : WEB_LOCALES;
  return locales.flatMap(locale => [...guideById.keys()].map(id => ({ locale, id })));
}
export { default } from '../../guide/[id]';
