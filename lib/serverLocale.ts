/**
 * Locale plumbing for SERVER-rendered surfaces (emails, printable report).
 *
 * Deliberately NOT i18next: these run in the Workers runtime (email routes) and in the pure
 * report generator, where lib/i18n's native storage imports don't belong. Pure JSON tables +
 * an explicit lang parameter — the language comes from Supabase auth `user_metadata.lang`
 * (written by the app's language switcher) or from the caller's current app language.
 */
import enEmails from '@/locales/en/emails.json';
import esEmails from '@/locales/es/emails.json';

export type EmailLang = 'en' | 'es';

export type EmailStrings = typeof enEmails;

export function resolveEmailLang(md: Record<string, unknown> | null | undefined): EmailLang {
  return md?.lang === 'es' ? 'es' : 'en';
}

export function emailStrings(lang: EmailLang): EmailStrings {
  return lang === 'es' ? (esEmails as EmailStrings) : enEmails;
}

/** Minimal {{var}} interpolation — same placeholder syntax as the app catalogs, so the
 *  placeholder-lint gate covers these files too. */
export function interp(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export const emailDateLocale = (lang: EmailLang): string => (lang === 'es' ? 'es-ES' : 'en-GB');
