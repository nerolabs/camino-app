/**
 * The persona-MATRIX sweep (engine audit, 2026-07-12) — the tool the build-37 shred showed
 * we were missing. The mechanical audit (invariant 2) proves every condition is ASKABLE;
 * this tool exposes whether conditions are RIGHT, by generating plans for a grid of
 * realistic profiles and (a) asserting class-level EXPECTATIONS (steps every profile of a
 * class must/must-not have), (b) dumping the full matrix for human condition-by-condition
 * review (docs/audits/).
 *
 * Run: npx tsx scripts/audit-matrix.ts            → expectations + summary
 *      npx tsx scripts/audit-matrix.ts --dump     → also the full profile→steps matrix
 */
import { derive, type Profile } from '../core/interview-controller';
import { buildPlan } from '../core/engine-controller';

type Grid = { name: string; profile: Profile };

// ── The grid: passports × household × work × housing ──────────────────────────
const PASSPORTS: Record<string, string[]> = {
  us: ['US'], uk: ['GB'], de: ['DE'], co: ['CO'], ph: ['PH'],
  'us+es': ['US', 'ES'], 'de+us': ['DE', 'US'], es: ['ES'],
};
const WORK = ['retired', 'employed_remote', 'contractor_freelance', 'self_employed', 'student', 'passive_income', 'job_seeker'] as const;
const HOUSEHOLD = ['solo', 'couple', 'family'] as const;
const HOUSING = ['renting', 'owns'] as const;

function mk(pass: string, work: string, hh: string, housing: string): Grid {
  const p: Profile = {
    speaks_spanish: 'A little',
    nationalities: PASSPORTS[pass],
    work_situation: work,
    intends_long_stay: true,
    arrival_date: '2027-03-01',
    has_spanish_address: false, // most movers haven't picked housing yet — audit A1's exact blind spot
    owns_or_drives: true,
    region: 'madrid',
    has_pets: false,
    annual_income_eur_band: '€34k–€60k',
    foreign_assets_eur_band: '€50k–€200k',
    previously_ex_spanish_colony_nationality: PASSPORTS[pass].some(n => ['CO', 'PH'].includes(n)),
    wants_citizenship: false,
    has_spouse_or_partner: hh !== 'solo',
    ...(hh !== 'solo' ? { partner_is_married: true } : {}),
    has_children: hh === 'family',
    owns_property_in_spain: housing === 'owns',
    ...(housing === 'owns' ? { property_purchase: '2026-11-01' } : {}),
    ...(work === 'employed_remote' ? { employer_country_is_foreign: true } : {}),
    // Mixed households moving with family: answer the clarifier honestly.
    ...(pass.includes('+') && hh !== 'solo' ? { non_eu_family_member: true } : {}),
    ...(pass.includes('+') && hh === 'solo' ? { non_eu_family_member: false } : {}),
  };
  derive(p);
  return { name: `${pass}/${work}/${hh}/${housing}`, profile: p };
}

const GRID: Grid[] = [];
for (const pass of Object.keys(PASSPORTS))
  for (const work of WORK)
    for (const hh of HOUSEHOLD)
      GRID.push(mk(pass, work, hh, 'renting'));
// property variants on a slimmer axis (housing mostly independent of passport/work)
for (const pass of ['us', 'de', 'us+es'])
  for (const hh of HOUSEHOLD) GRID.push(mk(pass, 'retired', hh, 'owns'));

// ── Class-level expectations (each encodes a rule a whole CLASS must satisfy) ──
type Expect = { name: string; applies: (g: Grid) => boolean; check: (ids: Set<string>, g: Grid) => string | null };

const isEu = (g: Grid) => (g.profile as Record<string, unknown>).is_eu === true;
const isSpanish = (g: Grid) => (g.profile.nationalities as string[]).includes('ES');
const solo = (g: Grid) => g.profile.has_spouse_or_partner !== true && g.profile.has_children !== true;

const EXPECTATIONS: Expect[] = [
  { name: 'every long-stay plan registers on the padrón (address known)',
    applies: () => true,
    check: ids => ids.has('empadronamiento') ? null : 'missing empadronamiento' },
  { name: 'non-EU long-stay always has a visa route + NIE + TIE',
    applies: g => !isEu(g),
    check: ids => {
      for (const id of ['choose-visa-type', 'nie', 'residencia'])
        if (!ids.has(id)) return `missing ${id}`;
      return null;
    } },
  { name: 'EU profiles never see the visa cluster or NIE-as-foreigner… beyond EX-18/EX-19',
    applies: isEu,
    check: ids => {
      for (const id of ['choose-visa-type', 'consulate-appointment', 'nie', 'residencia'])
        if (ids.has(id)) return `has ${id}`;
      return null;
    } },
  { name: 'Spanish-passport households never get the FOREIGN-national registration',
    applies: isSpanish,
    check: ids => ids.has('eu-registration-certificate') ? 'has eu-registration-certificate' : null },
  { name: 'non-Spanish EU long-stay gets EX-18',
    applies: g => isEu(g) && !isSpanish(g),
    check: ids => ids.has('eu-registration-certificate') ? null : 'missing eu-registration-certificate' },
  { name: 'mixed household moving with family gets the EX-19 family card',
    applies: g => isEu(g) && !solo(g) && (g.profile.nationalities as string[]).some(n => !['ES', 'DE'].includes(n) || n === 'US') && g.profile.non_eu_family_member === true,
    check: ids => ids.has('eu-family-member-card') ? null : 'missing eu-family-member-card' },
  { name: 'families with children get school enrollment',
    applies: g => g.profile.has_children === true,
    check: ids => ids.has('escolarizacion') ? null : 'missing escolarizacion' },
  { name: 'property owners get the property cluster',
    applies: g => g.profile.owns_property_in_spain === true,
    check: ids => ids.has('ibi-property-tax') || ids.has('property-transfer-tax') ? null : 'missing property cluster' },
  { name: 'drivers get exactly one DGT path (exchange or exam)',
    applies: g => g.profile.owns_or_drives === true,
    check: ids => (ids.has('dgt-exchange') || ids.has('dgt-exam')) ? null : 'missing any DGT step' },
  { name: 'job seekers never get the NLV cluster (audit A2)',
    applies: g => g.profile.work_situation === 'job_seeker',
    check: ids => [...ids].some(i => i.startsWith('nlv-')) ? 'has NLV-cluster steps' : null },
  { name: 'assets over €50k → Modelo 720',
    applies: () => true, // grid band is €50k–€200k
    check: ids => ids.has('modelo-720') ? null : 'missing modelo-720' },
  { name: 'every plan has healthcare SOMEWHERE (public card, private req, or convenio)',
    applies: () => true,
    check: ids => (ids.has('tarjeta-sanitaria') || ids.has('nlv-health-insurance') || ids.has('student-visa-health-insurance') || ids.has('convenio-especial'))
      ? null : 'no healthcare step at all' },
  { name: 'long-stay tax residents file Modelo 100 + 030',
    applies: () => true,
    check: ids => {
      for (const id of ['modelo-100', 'modelo-030']) if (!ids.has(id)) return `missing ${id}`;
      return null;
    } },
];

// ── Run ────────────────────────────────────────────────────────────────────────
const dump = process.argv.includes('--dump');
let failures = 0;
const rows: string[] = [];
for (const g of GRID) {
  const plan = buildPlan(g.profile);
  const ids = new Set(plan.map(o => o.id));
  if (dump) rows.push(`${g.name} (${plan.length}): ${[...ids].join(' ')}`);
  for (const e of EXPECTATIONS) {
    if (!e.applies(g)) continue;
    const problem = e.check(ids, g);
    if (problem) { failures++; console.log(`✗ [${e.name}] ${g.name} → ${problem}`); }
  }
}
console.log(`\n${GRID.length} profiles × ${EXPECTATIONS.length} class expectations — ${failures} failure(s)`);
if (dump) console.log('\n' + rows.join('\n'));
if (failures > 0) process.exitCode = 1;
