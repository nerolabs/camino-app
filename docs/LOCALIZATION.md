# Localization — technical design (2026-07-04, **APPROVED by user** — see §10 answers)

**Execution gate: E2E green first (user directive) — no localization surgery before that.**

Decision context: Spanish (es-ES) ships **before launch** (a moving-to-Spain product must
speak Spanish — authenticity); French, German, Italian fast-follow; suggested tier 3 = Dutch,
Portuguese; later cohort-driven (Romanian, Polish, Arabic, Chinese). The brand **"Get Camino"
and "Lola" never localize**. Nothing here starts until E2E is green (user gate).

## 1. Goals / non-goals

- Goal: the complete product experience — UI, interview, roadmap, guides, report, emails,
  legal — reads natively in each locale, and localized guide pages become an SEO surface.
- Non-goals (v1): localizing the how-i-was-built pages (the build story stays English —
  revisit on demand); per-locale catalogs of DIFFERENT obligations (the engine is
  language-free; every locale sees the same steps); es-419 (LatAm) as a separate locale
  (es-ES first, revisit with traffic).

## 2. The five string surfaces (and who owns each)

| Surface | Examples | Mechanism |
|---|---|---|
| App chrome | nav, buttons, dialogs, plan labels, empty states | i18next JSON catalogs |
| Catalog content | 60 obligation titles; guide prose; timing clauses | per-locale TS modules keyed by obligation id, tsc-enforced complete |
| Interview | STATIC_QUESTIONS fallbacks; Lola's LLM phrasing | JSON for statics; a language directive in LLM prompts |
| Generated text | formatTiming, report HTML, weekly email | i18next interpolation + `toLocaleDateString(locale)` |
| Legal pages | privacy/terms/aviso | per-locale drafts, "English prevails" clause |

Deliberately NOT translated: obligation ids, option slugs (`employed_remote`), region slugs,
band strings' semantics (they're €-numeric), API contracts, official `source_url`s (they
point at Spanish government pages — already the target language for es users).

## 3. Plumbing

- **Library: i18next + react-i18next + expo-localization.** Mature, SSR-safe with Expo
  Router static rendering, plural rules for all planned locales, interpolation, namespaces.
  (Alternatives considered: react-intl — heavier ICU ceremony; lingui — great extraction but
  smaller ecosystem on RN. i18next is the boring, correct pick.)
- **Resource layout:** `locales/<lang>/{common,interview,plan,guides,legal,emails}.json` +
  `core/i18n/<lang>/catalog.ts` (obligation titles) + `core/i18n/<lang>/guide-prose.ts`.
  English files are the source of truth; every other locale is derived from them.
- **Locale resolution order:** URL prefix (web) → user's saved choice → device/browser
  locale → `en`. Persisted in localStorage/AsyncStorage; for signed-in users ALSO in
  Supabase auth `user_metadata.lang` (zero migration — the weekly-email engine already
  reads user_metadata for optout/welcomed bookkeeping) so emails match the app language.
- **Switcher:** a small language item in the ☰ menu (present on every screen).

## 4. Catalog & guide content (the invariant-3 surface)

- `CATALOG` in the engine keeps ONLY English titles (engine stays language-free; plans,
  ids, timing are locale-independent). Display resolves titles via
  `catalogTitle(id, locale)` falling back to English.
- Per-locale modules are typed `Record<ObligationId, { title: string }>` — **tsc fails the
  build if a locale is missing an obligation**, so adding obligation #61 forces every
  language to follow.
- Guide prose: same pattern (`Record<ObligationId, string[]>`); `describeTiming` /
  `metaDescription` template sentences move into i18next with interpolation so each locale
  owns its grammar.
- **Mechanized translation gates (vitest, join the deploy gate):**
  1. *Digit-lint per locale* — the numbers in a translated title/prose must be exactly the
     numbers in the English source (a mistranslated "90 days" is invariant 3 broken).
  2. *Placeholder-lint* — every `{{var}}` in English exists in the translation.
  3. *Completeness* — no missing keys in any shipped locale.
  4. *Brand-lint* — "Get Camino" and "Lola" appear verbatim, never translated/inflected.
- **Human verification workflow:** Claude drafts every translation → a human verifier
  signs off before ship (es-ES: user/Cristina pass; professional review at revenue, same
  queue as legal). Machine-drafted, human-verified, mechanically linted — the same
  discipline as the catalog itself.

## 5. Interview & Lola

- `phraseQuestion` / `phraseClarify` / plan-coach prompts gain one line: *"Respond in
  {{language}}."* Claude is natively strong in all five launch languages. `prompt_hint`s
  stay English (they instruct the model, not the user).
- `extractAnswer` is already language-agnostic (users can answer in Spanish today; slugs
  come back in English). Add an explicit "the user may answer in any language" line.
- STATIC_QUESTIONS (the deterministic fallbacks) are translated per locale in JSON.
- **TTS:** ElevenLabs `eleven_multilingual_v2` + the current voice already speak all five
  languages natively — no per-locale voice work needed for launch; revisit per-language
  voice tuning (speakability rephrasings) after Spanish ships.

## 6. Web routing & SEO (the growth half)

- **English keeps its current unprefixed URLs** (zero churn on everything indexed so far).
  Other locales live under a path prefix: `/es/...`, `/fr/...` via one dynamic route tree:
  `app/[locale]/…` mirroring the public pages, with screens extracted into shared
  components used by both trees. `generateStaticParams` = locale × page (guides: 4 × 60).
- `Seo` component gains `hreflang` alternates (each page lists all locale variants +
  `x-default` = en); sitemap.xml grows the localized URLs; JSON-LD `inLanguage` set.
- Localized SLUGS (`/es/guia/nie` vs `/es/guide/nie`): keep English slugs under the locale
  prefix for v1 (ids are stable identifiers; the prefix carries the language signal for
  search). Revisit localized slugs only if SEO data demands.
- Native apps don't need routes — locale is state. Web-native parity via the same i18n
  context.

## 7. Emails, report, dates

- Templates per locale in `locales/<lang>/emails.json`; the weekly engine picks the user's
  `user_metadata.lang` (default en). Subject lines included in the digit/brand lints.
- `reportHtml(objectives, today, locale)` — labels from i18next, dates via
  `toLocaleDateString(locale)` (es: "18 abr 2026"). PDF filename stays ASCII.
- Legal pages: es-ES gets a reviewed translation with an "English version prevails"
  clause; FR/DE/IT launch with English legal + a one-line native notice (industry-normal),
  translated properly in L3.

## 8. Phasing & estimates

- **L0 — plumbing (~1–1.5 days):** i18next setup, locale resolution/persistence/switcher,
  extract ALL app-chrome strings to `en` JSON (the big mechanical sweep — every screen),
  the four lint gates wired into `npm test`. Product looks identical after L0 (English via
  the new pipe) — that's the proof it worked.
- **L1 — Spanish content (~1.5–2 days + review):** es-ES chrome, catalog titles, guide
  prose, static questions, emails, legal draft, Lola directive, locale dates. Ends with
  the human verification pass.  ← **launch gate**
- **L2 — web SEO tree (~1 day):** `[locale]` route tree, hreflang, sitemap, JSON-LD.
  (Can ship right after L1; es pages start earning search presence immediately.)
- **L3 — FR/DE/IT (~0.5–1 day each, mostly content):** re-run the L1 pipeline per language;
  the lints and tsc-completeness make each one a fill-in-the-blanks exercise.
- Native strings ride the next build after each phase (one build per phase batch).

## 9. Risks / notes

- German length breaks layouts (nav caps, chips) — the L0 sweep adds a pseudo-locale
  stretch test; the Dynamic-Type lessons (no-wrap caps) already protect the worst spots.
- The interview quality dashboard should segment clarify-rates by language once es ships —
  extraction quality in Spanish is expected-good but must be watched, not assumed.
- Sample plan, homework pages, and the build log stay English in v1 (documented above).
- E2E: one Maestro/Playwright smoke per non-English locale (home renders in es, interview
  first question arrives in es) added in L2 — cheap, catches the "half-translated screen"
  class.

## 10. Review answers (user, 2026-07-04) — all decided

1. **URL scheme:** ✅ English unprefixed + `/es/...` prefixes.
2. **Homework pages:** ✅ English-only for now.
3. **Spanish verification:** ✅ Cristina is the es-ES human verifier.
4. **Legal:** ✅ fully translated es-ES legal (with "English prevails" clause).
5. **Register:** ✅ tú — "warmer spanish is good."

**Additional user requirement:** the language selector in the ☰ menu is a FEATURE, not a
buried setting — device/browser language is the default, but the switcher must be visibly
present so users see the app honors their native language. Design the menu item to show
the current language by its own name (e.g. "Language · Español") and list each option in
its own language (Español, Français, Deutsch, Italiano, English).
