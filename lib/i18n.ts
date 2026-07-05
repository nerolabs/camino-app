/**
 * i18n plumbing (L0 — docs/LOCALIZATION.md).
 *
 * i18next initializes SYNCHRONOUSLY with the bundled English catalogs, so static rendering
 * (expo export) and the first client render are always English — the hydration-safe pattern
 * (raw client-only state in render caused React #418 on every page once; see NavBar).
 * The saved/device locale is applied AFTER mount via applyStoredLocale() in the root layout.
 *
 * Resolution order (design §3): user's saved choice → device/browser locale → en.
 * (URL-prefix resolution for /es web routes arrives with the L2 route tree.)
 * The choice persists in AsyncStorage (localStorage on web) and — for signed-in users — in
 * Supabase auth user_metadata.lang, so the weekly email can match the app language (L1).
 *
 * English is the source of truth: every other locale's catalogs are derived from
 * locales/en/*.json and held to it by the four i18n lint gates (tests/i18n-lint.test.ts).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import enCommon from '@/locales/en/common.json';
import enPlan from '@/locales/en/plan.json';
import enInterview from '@/locales/en/interview.json';

// Each locale is listed by its OWN name (user requirement: the switcher is a feature —
// "Español", never "Spanish"). Spanish joins at L1; FR/DE/IT at L3.
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

const STORAGE_KEY = 'camino.locale';

export function isSupportedLocale(code: unknown): code is LocaleCode {
  return typeof code === 'string' && SUPPORTED_LOCALES.some(l => l.code === code);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, plan: enPlan, interview: enInterview },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'plan', 'interview'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // values render into RN <Text>, not HTML
  react: { useSuspense: false },         // resources are bundled — nothing to suspend on
});

/** The device/browser language, if we ship it; otherwise null. */
export function deviceLocale(): LocaleCode | null {
  const code = getLocales()[0]?.languageCode;
  return isSupportedLocale(code) ? code : null;
}

/** Saved choice → device → en. Called once after mount (root layout) — never during render. */
export async function applyStoredLocale(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    const target = isSupportedLocale(saved) ? saved : deviceLocale() ?? 'en';
    if (target !== i18n.language) await i18n.changeLanguage(target);
  } catch {
    // storage unavailable (private mode etc.) — stay on the default; never block startup
  }
}

/** The user's explicit choice: switch now, persist locally. Supabase metadata sync is the
 *  caller's job (the switcher has the session; this module stays auth-free). */
export async function setAppLocale(code: LocaleCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // persistence is best-effort; the in-memory switch already happened
  }
}

export default i18n;
