/**
 * Chip localization coverage (interview redesign, Phase 1 — see docs/INTERVIEW-REDESIGN.md).
 * A missing label would render a raw enum value ("employed_remote") as a chip — this guards it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SLOTS } from '../core/interview-controller';
import { regionLabel } from '../core/regions';

const LANGS = ['en', 'es', 'fr', 'de', 'it'] as const;
const load = (lang: string) =>
  JSON.parse(readFileSync(new URL(`../locales/${lang}/interview.json`, import.meta.url), 'utf8'));

describe('chip localization coverage', () => {
  it('every slot has static question copy in every locale', () => {
    for (const lang of LANGS) {
      const j = load(lang);
      for (const s of SLOTS) expect(j.static[s.field], `${lang}:${s.field}`).toBeTruthy();
    }
  });

  it('chips yes/no/other/notSure exist in every locale', () => {
    for (const lang of LANGS) {
      const j = load(lang);
      for (const k of ['yes', 'no', 'other', 'notSure']) expect(j.chips[k], `${lang}:${k}`).toBeTruthy();
    }
  });

  it('every option value on an option slot has a label in every locale', () => {
    for (const lang of LANGS) {
      const j = load(lang);
      for (const s of SLOTS) {
        if (!s.options?.length) continue;
        if (s.field === 'region') {
          // Region names are proper nouns via regionLabel; "not_sure" comes from chips.notSure.
          for (const v of s.options) if (v !== 'not_sure') expect(regionLabel(v), v).toBeTruthy();
          continue;
        }
        const map = j.options?.[s.field];
        expect(map, `${lang}:options.${s.field}`).toBeTruthy();
        for (const v of s.options) expect(map[v], `${lang}:${s.field}.${v}`).toBeTruthy();
      }
    }
  });
});
