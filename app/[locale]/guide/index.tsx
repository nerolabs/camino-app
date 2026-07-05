import { WEB_LOCALES } from '@/lib/i18n';

export function generateStaticParams(params: { locale?: string } = {}): Record<string, string>[] {
  return params.locale ? [{ locale: params.locale }] : WEB_LOCALES.map(locale => ({ locale }));
}
export { default } from '../../guide/index';
