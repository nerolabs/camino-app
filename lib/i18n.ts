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
import enGuides from '@/locales/en/guides.json';
import esCommon from '@/locales/es/common.json';
import esPlan from '@/locales/es/plan.json';
import esInterview from '@/locales/es/interview.json';
import esGuides from '@/locales/es/guides.json';
import frCommon from '@/locales/fr/common.json';
import frPlan from '@/locales/fr/plan.json';
import frInterview from '@/locales/fr/interview.json';
import frGuides from '@/locales/fr/guides.json';

// Each locale is listed by its OWN name (user requirement: the switcher is a feature —
// "Español", never "Spanish"). FR/DE/IT join at L3.
// `llmName`: how the language directive names it to the LLM (phrase/clarify/coach prompts).
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', llmName: 'English' },
  { code: 'es', name: 'Español', llmName: 'Spanish (es-ES — address the user with tú, never usted)' },
  { code: 'fr', name: 'Français', llmName: 'French (fr-FR — tutoie the user, warm and informal, never vous)' },
] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

const STORAGE_KEY = 'camino.locale';

export function isSupportedLocale(code: unknown): code is LocaleCode {
  return typeof code === 'string' && SUPPORTED_LOCALES.some(l => l.code === code);
}

/** The locales that get a prefixed web route tree (everything but unprefixed English). */
export const WEB_LOCALES = SUPPORTED_LOCALES.filter(l => l.code !== 'en').map(l => l.code);

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, plan: enPlan, interview: enInterview, guides: enGuides },
    es: { common: esCommon, plan: esPlan, interview: esInterview, guides: esGuides },
    fr: { common: frCommon, plan: frPlan, interview: frInterview, guides: frGuides },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'plan', 'interview', 'guides'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // values render into RN <Text>, not HTML
  react: { useSuspense: false },         // resources are bundled — nothing to suspend on
});

/** BCP 47 tag for date formatting in the current language ("18 abr 2026" in es). */
const DATE_LOCALES: Record<string, string> = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' };
export function dateLocale(): string {
  return DATE_LOCALES[i18n.language] ?? 'en-GB';
}

/** The current language as a supported code (for APIs that take an explicit lang param —
 *  reportHtml, email previews — rather than reading the singleton). */
export function currentLang(): LocaleCode {
  return isSupportedLocale(i18n.language) ? i18n.language : 'en';
}

/** The language-directive line for LLM prompts (phrase/clarify/coach). Empty for English so
 *  the English prompts stay byte-identical to pre-localization behavior. */
export function languageDirective(): string {
  const cur = SUPPORTED_LOCALES.find(l => l.code === i18n.language);
  return cur && cur.code !== 'en' ? `\nRespond in ${cur.llmName}.` : '';
}

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

/** The user's EXPLICIT saved choice (null when they've only ever ridden the device default).
 *  Lets SessionSync decide between adopting the account language and mirroring the local one. */
export async function getStoredLocale(): Promise<LocaleCode | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return isSupportedLocale(saved) ? saved : null;
  } catch {
    return null;
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
