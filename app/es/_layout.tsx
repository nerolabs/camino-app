import { Slot } from 'expo-router';

// The Spanish web route tree (L2 — docs/LOCALIZATION.md §6): every fully-translated public
// page also lives under /es/… as a RE-EXPORT of the same screen; the root layout's
// route-locale forcing makes them render (and statically export) in Spanish. English keeps
// its unprefixed URLs (x-default).
//
// STATIC directories per locale, deliberately NOT a dynamic [locale] segment: on server
// output the routes manifest is first-match ordered and a root-level dynamic segment
// swallowed every single-segment route (/plan, /interview, even /sitemap.xml) — caught by
// the post-deploy E2E gate 2026-07-05. the locale-tree lint in tests/i18n-lint.test.ts keeps every WEB_LOCALE's tree complete.
//
// how-it-works and the how-i-was-built pages are deliberately absent: their long-form prose
// is still English-only, and a half-translated page is worse than an honest English one.

export default function EsLayout() {
  return <Slot />;
}
