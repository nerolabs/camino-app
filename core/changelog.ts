/**
 * The public regulatory changelog — the dated record of what changed in the catalog and
 * why, distilled from core/SOURCING.md (the internal provenance log). This is the trust
 * engine: we fix fast and publish the diff. Entries are DATA, appended when a correction
 * or verification pass lands (same-PR discipline as the privacy page); the page at
 * /changelog renders straight from this file.
 *
 * Honesty rules: every entry describes something that actually happened on that date, in
 * plain language; `ids` reference real catalog entries (tested); nothing here is generated.
 */
import { CATALOG, type Obligation } from './engine-controller';

export type ChangelogEntry = {
  date: string;          // YYYY-MM-DD — the day the change shipped
  title: string;
  details: string[];     // plain-language bullets, no legal claims beyond the catalog's own
  ids?: string[];        // catalog ids this entry touched (must exist)
};

// Newest first. Rendered verbatim on /changelog.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-07-13',
    title: 'Nine new steps: the work, self-employment and student routes get real coverage',
    details: [
      'The audit’s sourcing backlog, cleared: the employer-sponsored work visa (your employer files it — form EX-03, Ministry of Inclusion hoja 12), the self-employment authorization (hoja 14), securing university admission before the student visa, and foreign-degree recognition (homologación/equivalencia via Valida-TE, RD 889/2022).',
      'Honesty steps added: Spain has no general job-seeker visa (the roadmap now says so instead of routing job seekers to the wrong visa), and short-stay visitors get the Schengen 90/180 rule spelled out.',
      'EU movers: your licence stays valid, but the DGT’s own rules require renewal after 2 years of residence for indefinite or 15+-year licences — the roadmap now carries that clock.',
      'And the fastest citizenship track in the book: the spouse of a Spanish citizen can apply after just 1 year of legal residence (mjusticia-verified). Mixed households now see it from day one. Catalog: 64 → 73.',
    ],
    ids: ['work-visa-employer-sponsored', 'self-employment-visa-authorization', 'university-admission', 'homologacion-titulos', 'job-seeker-route-reality', 'dgt-eu-licence-check', 'citizenship-married-to-spanish', 'ehic-card', 'schengen-90-180'],
  },
  {
    date: '2026-07-13',
    title: 'Regional coverage completed: all 15 common-regime comunidades verified',
    details: [
      'Transfer-tax (ITP) figures now cover every common-regime comunidad — the ten remaining regions (Asturias, Cantabria, La Rioja, Castilla-La Mancha, Canarias, Extremadura, Illes Balears, Castilla y León, Galicia, Murcia) verified against the Ministry of Hacienda’s official 2026 compilation of regional tax measures, which cites each region’s own statute.',
      'Two more changes most summaries haven’t caught yet: Murcia cut its general rate from 8% to 7.75% (July 2025 — the regional agency’s own FAQ still showed the old rate; we verified against the law as published in the BOE), and the Comunitat Valenciana raised its wealth-tax personal exemption from €500,000 to €1,000,000 effective the end of 2025.',
      'Wealth-tax figures added for Cataluña and the Comunitat Valenciana (exemption + top rate).',
      'Still honestly out of scope: País Vasco and Navarra (foral regimes with per-territory rates — they need their own pass) and Ceuta/Melilla. Those regions simply show no figure rather than a secondhand one.',
    ],
    ids: ['property-transfer-tax', 'wealth-tax'],
  },
  {
    date: '2026-07-12',
    title: 'Engine audit, continued: short stays, EU driving licences, EU citizenship',
    details: [
      'The residence-visa cluster (visa category, consulate, criminal check, apostilles, TIE…) now correctly applies only to LONG-stay moves — a short-stay visitor was being handed the full residence roadmap.',
      'Short-stay property buyers keep exactly what they need: the NIE (you can’t buy without it — now including EU buyers, who were missing it), the notary/registry chain, and the non-resident property tax.',
      'EU driving licences are valid in Spain — pure-EU households no longer see a licence exchange or driving test. A mixed household’s non-EU driver still gets theirs.',
      'EU citizens CAN naturalise by residence (the same ten-year track as everyone) — the interview now asks them too, and the citizenship steps no longer exclude them. The married-to-a-Spaniard one-year track is a known gap, queued for a sourcing pass.',
      'A Spanish bank account is now suggested to every long-stay mover, not only non-EU ones.',
    ],
    ids: ['choose-visa-type', 'nie', 'dgt-exchange', 'dgt-exam', 'citizenship-track-standard', 'spanish-bank-account'],
  },
  {
    date: '2026-07-12',
    title: 'Engine audit: the padrón no longer vanishes for movers still choosing housing',
    details: [
      'Town-hall registration (empadronamiento) and the public health card were only shown once you had a Spanish address — so anyone still deciding where to live got a roadmap missing its most fundamental arrival step, and downstream dates (like the Hacienda registration) sat undated. Applicability was confused with timing: the padrón applies to every long-stay mover; the address is just not known yet. Fixed — both steps now appear for all long-stay movers (the health card keeps its non-lucrative-visa carve-out), dated from your arrival.',
      'Same audit: job seekers were being routed to the non-lucrative visa — the visa whose defining condition is NOT working in Spain, complete with its notarized no-work declaration. There is no general job-seeker visa; the roadmap now says so honestly (the visa-category step stays, the misleading cluster is gone).',
      'And a class of travelers got simpler: EU citizens visiting short-term now correctly see no required steps at all — short stays don’t register on the padrón and don’t trigger tax residency.',
    ],
    ids: ['empadronamiento', 'tarjeta-sanitaria'],
  },
  {
    date: '2026-07-12',
    title: 'Mixed-passport households: the missing family-member card added',
    details: [
      'A household answer like "American and Spanish passports" is ambiguous — one dual citizen, or a mixed couple? The engine treated any EU passport as covering the whole household, leaving the non-EU spouse with no residence step at all.',
      'The interview now asks one clarifying question when a household mixes EU/Spanish and non-EU passports, and the catalog gained the EU family-member residence card (tarjeta de familiar de ciudadano de la Unión, form EX-19) — applied for in person within 3 months of entry, verified against the Ministry of Inclusion’s official guidance. Catalog: 63 → 64.',
    ],
    ids: ['eu-family-member-card'],
  },
  {
    date: '2026-07-12',
    title: 'Spanish passport holders no longer offered the foreign-national registration',
    details: [
      'A tester with dual US/Spanish citizenship was shown "Register in the Central Register of Foreign Nationals" — a step whose own description says it isn’t needed for Spanish nationals. The rule treated every EU passport alike; a Spanish citizen is not a foreign national in Spain. The condition now excludes Spanish passports (other EU/EEA nationals still get it, correctly).',
    ],
    ids: ['eu-registration-certificate'],
  },
  {
    date: '2026-07-12',
    title: 'First regional specifics: ITP and wealth-tax figures, verified per comunidad',
    details: [
      'Transfer-tax (ITP) rates for resale homes now show on the roadmap for Andalucía (7%), Madrid (6%), Cataluña (progressive 10%→13% since its June 2025 reform), and the Comunitat Valenciana — each verified on that region’s own tax portal.',
      'The verification pass caught a change most summaries still miss: the Comunitat Valenciana cut its general rate from 10% to 9% effective 1 June 2026.',
      'Wealth-tax regional reliefs recorded for Madrid and Andalucía (100% regional relief; the state solidarity tax can still apply above €3M).',
      'Deliberately staged: the other comunidades, bracketed wealth-tax scales, and school-enrollment windows (which change every year) wait for their own verification passes rather than shipping secondhand.',
    ],
    ids: ['property-transfer-tax', 'wealth-tax'],
  },
  {
    date: '2026-07-12',
    title: 'Consulate appointment step neutralized',
    details: [
      'The step title quoted a US-specific wait estimate ("8–16 weeks") to every applicant, whichever country they apply from — a UK tester caught it. Wait times vary widely by consulate, and the step now says exactly that, in all five languages.',
      'The consulate’s own cita previa page (the step’s official source) remains the source of truth for current lead times.',
    ],
    ids: ['consulate-appointment'],
  },
  {
    date: '2026-07-10',
    title: 'Interview audit: honest income checks in, a dead question out',
    details: [
      'Two conservative advisory warnings were added: if even the top of your stated income range falls short of a visa route’s published requirement (non-lucrative or digital-nomad), your roadmap now says so at planning time — not at the consulate.',
      'A question about US residency was collected but fed nothing in the catalog; it was removed rather than kept for show.',
    ],
    ids: ['nlv-income-check', 'dnv-income-check'],
  },
  {
    date: '2026-07-04',
    title: 'Every official source link click-tested',
    details: [
      'All 55 official-source links were checked against the page they actually load, not just their status codes. Two were quietly broken — one pointed at a retired portal, one hit a cookie wall — and now point where they should.',
    ],
  },
  {
    date: '2026-07-03',
    title: 'Full re-verification pass; two rule corrections',
    details: [
      'Every uncited official step was re-verified one by one and given a canonical government source.',
      'Corrected: the Spanish-language exam (DELE) exemption logic mis-handled applicants from the Philippines (Spanish-speaking-national and ex-colony are different things).',
      'Corrected: family-reunification eligibility for unmarried partners.',
      'Added: the EU citizen registration certificate step, which the catalog was missing entirely.',
    ],
    ids: ['dele-a2-exam', 'eu-registration-certificate'],
  },
  {
    date: '2026-07-02',
    title: 'Secondary-source cleanup: two obsolete rules removed, five corrected',
    details: [
      'Removed: the Modelo 720 "150% penalty" (struck down in 2022 — we had absorbed it from secondary sources) and Modelo 037 (abolished 2025).',
      'Corrected: family-reunification timing (about a year of residence, not 30 days), the medical-certificate apostille labeling, the school-enrollment window, the non-lucrative-visa renewal window (60 days before to 90 days after expiry), and land-registry inscription (voluntary and recommended, not mandatory).',
      'Added: the 6-month limit for exchanging a foreign driving licence.',
      'Public healthcare card correctly gated off the non-lucrative visa path (NLV holders carry private cover on arrival).',
    ],
    ids: ['family-reunification', 'nlv-renewal', 'tarjeta-sanitaria'],
  },
  {
    date: '2026-06-30',
    title: 'The founding sourcing pass',
    details: [
      'Every obligation in the catalog was tagged with its provenance from day one; anything that could not be verified against an official source was pulled to a backlog rather than shipped. The catalog only carries steps we can stand behind.',
    ],
  },
];

// "Last verified" stamps. The 2026-07-04 pass click-tested every official source against
// its content, so that date is the honest floor for the whole catalog; items touched since
// carry their own later date via `verified_at` on the catalog entry.
export const DEFAULT_VERIFIED = '2026-07-04';

// Structural parameter: plan Objectives (which drop applies_if) qualify too.
export function verifiedOn(o: Pick<Obligation, 'verified_at'>): string {
  return o.verified_at ?? DEFAULT_VERIFIED;
}

// Sanity helpers for tests: every id referenced by an entry must exist in the catalog.
export function changelogIds(): string[] {
  return CHANGELOG.flatMap(e => e.ids ?? []);
}
export function catalogIds(): Set<string> {
  return new Set(CATALOG.map(o => o.id));
}
