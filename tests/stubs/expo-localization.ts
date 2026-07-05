// Vitest stub — expo-localization needs a native/web runtime; tests always start in English
// (lib/i18n's synchronous init) and switch languages explicitly via i18n.changeLanguage.
export function getLocales() {
  return [{ languageCode: 'en', languageTag: 'en-GB' }];
}
