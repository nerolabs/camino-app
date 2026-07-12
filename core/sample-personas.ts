import { type Profile } from './interview-controller';
import { sampleProfile, SAMPLE_NAME } from './sample-profile';

/**
 * The public sample-plan personas (SEO expansion, TODO 23, 2026-07-12). Each is a canned
 * profile rendered read-only by the REAL engine at /sample-plan/<id> — same honesty rules
 * as Susan & Tom (core/sample-profile.ts): the plan is never hand-written, it's
 * buildPlan(profile), so every persona page stays current as the catalog evolves.
 *
 * Chosen to light up DIFFERENT branches of the catalog, so between them a searcher can see
 * their own situation: the EU path (no visa cluster), the digital-nomad visa, and the
 * property-owner cluster. Display names/blurbs live in locales/<lang>/plan.json under
 * "sample.personas.<id>" so each language meets people with native names.
 *
 * Arrival dates float (like Susan & Tom's) so deadlines always read as a live move.
 */

export type SamplePersona = {
  id: string;              // URL slug: /sample-plan/<id>
  reference: string;       // internal/English reference name (audit + comments)
  profile: () => Profile;
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export const SAMPLE_PERSONAS: SamplePersona[] = [
  {
    // The default — Susan & Tom (US retirees → NLV, dog, undecided region, citizenship hopes).
    id: 'retirees',
    reference: SAMPLE_NAME,
    profile: sampleProfile,
  },
  {
    // The EU path: no visa cluster at all — registration certificate, padrón, schooling for
    // two kids, healthcare — the "it's simpler for you, and here's exactly how" story.
    id: 'eu-family',
    reference: 'Anna & Max (DE family)',
    profile: (): Profile => ({
      speaks_spanish:                       'A little',
      nationalities:                        ['DE'],
      work_situation:                       'employed_remote',
      employer_country_is_foreign:          true,
      annual_income_eur_band:               '€60k+',
      has_spouse_or_partner:                true,
      partner_is_married:                   true,
      has_children:                         true,
      intends_long_stay:                    true,
      arrival_date:                         days(240),
      has_spanish_address:                  false,
      owns_or_drives:                       true,
      owns_property_in_spain:               false,
      region:                               'comunidad-valenciana',
      has_pets:                             false,
      foreign_assets_eur_band:              'under €50k',
      previously_ex_spanish_colony_nationality: false,
      wants_citizenship:                    false,
    }),
  },
  {
    // The digital-nomad visa cluster: solo, remote employment, income comfortably above the
    // DNV requirement (so the advisory check stays silent — this page shows the happy path).
    id: 'digital-nomad',
    reference: 'Maya (CA remote employee)',
    profile: (): Profile => ({
      speaks_spanish:                       'Conversational',
      nationalities:                        ['CA'],
      work_situation:                       'employed_remote',
      employer_country_is_foreign:          true,
      annual_income_eur_band:               '€60k+',
      has_spouse_or_partner:                false,
      has_children:                         false,
      intends_long_stay:                    true,
      arrival_date:                         days(270),
      has_spanish_address:                  false,
      owns_or_drives:                       false,
      owns_property_in_spain:               false,
      region:                               'cataluna',
      has_pets:                             false,
      foreign_assets_eur_band:              'under €50k',
      previously_ex_spanish_colony_nationality: false,
      wants_citizenship:                    false,
    }),
  },
  {
    // The property cluster: UK couple who already bought in Andalucía — notary/registry/
    // transfer-tax chain, IBI, the UK licence exchange clock, and the foreign-assets
    // declaration. Region-specific steps get a named region here.
    id: 'property-owners',
    reference: 'James & Priya (UK, own property)',
    profile: (): Profile => ({
      speaks_spanish:                       'A little',
      nationalities:                        ['GB'],
      work_situation:                       'retired',
      annual_income_eur_band:               '€34k–€60k',
      has_spouse_or_partner:                true,
      partner_is_married:                   true,
      has_children:                         false,
      intends_long_stay:                    true,
      arrival_date:                         days(270),
      has_spanish_address:                  true,
      owns_or_drives:                       true,
      owns_property_in_spain:               true,
      property_purchase:                    days(180),
      region:                               'andalucia',
      has_pets:                             false,
      foreign_assets_eur_band:              '€200k–€700k',
      previously_ex_spanish_colony_nationality: false,
      wants_citizenship:                    false,
    }),
  },
];

export const personaById = new Map(SAMPLE_PERSONAS.map(p => [p.id, p]));
// The default persona keeps living at /sample-plan (no slug) — the extra pages link back.
export const DEFAULT_PERSONA_ID = 'retirees';
export const EXTRA_PERSONAS = SAMPLE_PERSONAS.filter(p => p.id !== DEFAULT_PERSONA_ID);
