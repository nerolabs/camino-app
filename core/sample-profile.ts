import { type Profile } from './interview-controller';

// The public "sample plan" persona: Susan & Tom, US retirees heading for the non-lucrative visa,
// hoping to become citizens one day, still choosing their region, bringing a dog. Chosen because
// this profile lights up a rich, representative roadmap (visa docs cluster, scouting, padrón/NIE/
// TIE chain, Modelo 720, driving exam, pet import, renewal + citizenship track).
//
// The plan page renders `buildPlan(sampleProfile())` read-only — the REAL engine on a canned
// profile, so the sample stays current automatically as the catalog evolves (and the interview
// remains the only way to get a personalized one). The arrival date floats ~3 months out so the
// sample's deadlines always read as a live, upcoming move rather than a stale demo.
//
// scripts/audit-catalog.ts validates these fields against SLOTS exactly like the test personas.

// DISPLAY name + blurb live in locales/<lang>/plan.json ("sample.name"/"sample.blurb") so each
// language meets a couple with names native to it (es: "Susana y Tomás" — user decision
// 2026-07-05; the PROFILE stays a US couple, which is what drives the NLV plan). This constant
// is the internal/English reference (audit script, comments).
export const SAMPLE_NAME = 'Susan & Tom';

export function sampleProfile(): Profile {
  // ~9 months out: the earliest pre-arrival offsets are −180 days (visa choice, tax planning),
  // so anything closer than +180d would render PAST due dates on the sample — stale-looking for
  // a marketing page. +270d keeps every step comfortably in the future, forever.
  const arrival = new Date(Date.now() + 270 * 86_400_000);
  return {
    nationalities:                        ['US'],
    work_situation:                       'retired',
    annual_income_eur_band:               '€34k–€60k',
    has_spouse_or_partner:                true,
    partner_is_married:                   true,
    has_children:                         false,
    intends_long_stay:                    true,
    arrival_date:                         arrival.toISOString().slice(0, 10),
    has_spanish_address:                  false,
    owns_or_drives:                       true,
    owns_property_in_spain:               false,
    knows_where_to_live:                  false,
    has_pets:                             true,
    foreign_assets_eur_band:              '€50k–€200k',
    us_resident:                          true,
    previously_ex_spanish_colony_nationality: false,
    wants_citizenship:                    true,
  };
}
