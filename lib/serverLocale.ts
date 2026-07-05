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
import frEmails from '@/locales/fr/emails.json';
import deEmails from '@/locales/de/emails.json';
import itEmails from '@/locales/it/emails.json';

export type EmailLang = 'en' | 'es' | 'fr' | 'de' | 'it';

export type EmailStrings = typeof enEmails;

// The locales with a prefixed web route tree — the SERVER-SAFE twin of lib/i18n's WEB_LOCALES
// (the sitemap route imports this; it can't touch lib/i18n's native storage imports).
// tests/i18n-lint.test.ts pins the two lists identical, so L3 languages can't ship half-wired.
export const WEB_LOCALES: EmailLang[] = ['es', 'fr', 'de', 'it'];

const EMAIL_TABLES: Record<EmailLang, EmailStrings> = {
  en: enEmails,
  es: esEmails as EmailStrings,
  fr: frEmails as EmailStrings,
  de: deEmails as EmailStrings,
  it: itEmails as EmailStrings,
};

export function resolveEmailLang(md: Record<string, unknown> | null | undefined): EmailLang {
  const lang = md?.lang;
  return typeof lang === 'string' && lang !== 'en' && lang in EMAIL_TABLES ? (lang as EmailLang) : 'en';
}

export function emailStrings(lang: EmailLang): EmailStrings {
  return EMAIL_TABLES[lang] ?? enEmails;
}

/** Minimal {{var}} interpolation — same placeholder syntax as the app catalogs, so the
 *  placeholder-lint gate covers these files too. */
export function interp(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''));
}

const DATE_LOCALES: Record<EmailLang, string> = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' };
export const emailDateLocale = (lang: EmailLang): string => DATE_LOCALES[lang] ?? 'en-GB';
