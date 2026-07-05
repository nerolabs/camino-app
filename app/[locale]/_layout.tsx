import { Slot, Redirect, useLocalSearchParams } from 'expo-router';
import { isSupportedLocale, WEB_LOCALES } from '@/lib/i18n';

// The [locale] segment's params originate HERE and cascade to every child route
// (expo-router: "generateStaticParams cascades from nested parents down to children").
export function generateStaticParams(): Record<string, string>[] {
  return WEB_LOCALES.map(locale => ({ locale }));
}

// The localized web route tree (L2 — docs/LOCALIZATION.md §6): every fully-translated public
// page also lives under /<locale>/… (English keeps its unprefixed URLs; x-default). The pages
// are RE-EXPORTS of the same screens — the root layout's route-locale forcing is what makes
// them render (and statically export) in the locale the URL names. English slugs stay under
// the prefix (/es/guide/nie) — ids are stable identifiers; the prefix carries the language.
//
// how-it-works and the how-i-was-built pages are deliberately absent: their long-form prose
// is still English-only (design §1 non-goals / L1 scope), and a half-translated page is worse
// than an honest English one.

export default function LocaleLayout() {
  const { locale } = useLocalSearchParams<{ locale: string }>();
  // Only shipped non-English locales exist here; anything else (including /en) goes home.
  if (!isSupportedLocale(locale) || locale === 'en') return <Redirect href="/" />;
  return <Slot />;
}
