/**
 * Deterministic plan engine.
 * Given a Profile, produces an ordered list of Objectives with resolved timing.
 * No LLM runs here.
 */

type Severity = 'info' | 'recommended' | 'required' | 'penalty';
type Category = 'visa' | 'residency' | 'tax' | 'health' | 'mobility' | 'banking' | 'family' | 'property' | 'admin';
type AnchorKind = 'arrival' | 'residency_established' | 'padron_done' | 'property_purchase';
type Urgency = 'immediate' | 'soon' | 'exploratory';

// Provenance of each obligation, so we can audit what's grounded vs. needs sourcing:
//   'webinar'  — the obligation (and the specifics in its title) are grounded in a mined
//                webinar transcript.
//   'domain'   — model/domain knowledge (e.g. Modelo form numbers, statutory deadlines)
//                not found verbatim in any transcript; correct, but needs an official cite.
//   'official' — verified against an official government source (AEAT, extranjería, BOE).
type Source = 'webinar' | 'domain' | 'official';

type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { field: string; op: 'eq' | 'gt' | 'in' | 'exists'; value?: unknown };

type Timing =
  | { kind: 'asap' }
  | { kind: 'absolute_recurring'; rrule: string }
  | { kind: 'relative_to_event'; anchor: AnchorKind; offset_days: number }
  | { kind: 'relative_to_obligation'; after: string; offset_days: number };

type Obligation = {
  id: string; title: string; category: Category; severity: Severity;
  source: Source;
  applies_if: Condition; depends_on: string[]; timing: Timing;
};

export type Resolved =
  | { state: 'scheduled'; start: Date; due: Date; estimated: boolean }
  | { state: 'pending_anchor'; anchor: AnchorKind }
  | { state: 'recurring'; nextDue: Date };

export type Phase = 'before_you_go' | 'first_weeks' | 'ongoing' | 'when_settled';

export type Objective = {
  id: string; title: string; category: Category; severity: Severity;
  source: Source; depends_on: string[];
  timing: Resolved; phase: Phase;
};

const SEV_RANK: Record<Severity, number> = { penalty: 4, required: 3, recommended: 2, info: 1 };
const ARRIVAL_OFFSET: Record<Urgency, number> = { immediate: 0, soon: 45, exploratory: 365 };
const ASAP_WINDOW: Record<Urgency, number> = { immediate: 14, soon: 30, exploratory: 60 };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

function evaluate(c: Condition, p: Record<string, unknown>): boolean {
  if ('all' in c) return c.all.every(x => evaluate(x, p));
  if ('any' in c) return c.any.some(x => evaluate(x, p));
  if ('not' in c) return !evaluate(c.not, p);
  const a = p[c.field];
  switch (c.op) {
    case 'exists': return a != null;
    case 'eq':    return a === c.value;
    case 'gt':    return typeof a === 'number' && a > (c.value as number);
    case 'in':    return Array.isArray(c.value) && (c.value as unknown[]).includes(a);
  }
}

function topoSort(obs: Obligation[]): Obligation[] {
  const present = new Set(obs.map(o => o.id));
  const byId = new Map(obs.map(o => [o.id, o]));
  const indeg = new Map<string, number>(obs.map(o => [o.id, 0]));
  const adj = new Map<string, string[]>(obs.map(o => [o.id, []]));
  for (const o of obs)
    for (const dep of o.depends_on)
      if (present.has(dep)) { adj.get(dep)!.push(o.id); indeg.set(o.id, indeg.get(o.id)! + 1); }
  const priority = (a: Obligation, b: Obligation) =>
    SEV_RANK[b.severity] - SEV_RANK[a.severity] || a.id.localeCompare(b.id);
  const ready = obs.filter(o => indeg.get(o.id) === 0).sort(priority);
  const out: Obligation[] = [];
  while (ready.length) {
    const o = ready.shift()!;
    out.push(o);
    for (const n of adj.get(o.id)!)
      if (indeg.set(n, indeg.get(n)! - 1).get(n) === 0)
        ready.push(byId.get(n)!), ready.sort(priority);
  }
  return out;
}

// Estimated gap from arrival to residency (TIE) being granted: NIE (~30d) + padrón +
// residence-card application + card issued. Used only when the user hasn't given a real date.
const RESIDENCY_EST_DAYS_FROM_ARRIVAL = 75;

// Returns the anchor's date plus whether it's an explicit user-provided date (true) or an
// engine estimate (false). estimate-derived dates flow through as estimated: true.
function anchorDate(a: AnchorKind, p: Record<string, unknown>, today: Date): { date: Date; explicit: boolean } | null {
  const urgency = (p.urgency as Urgency) ?? 'soon';
  switch (a) {
    case 'arrival':
      return p.arrival_date
        ? { date: new Date(p.arrival_date as string), explicit: true }
        : { date: addDays(today, ARRIVAL_OFFSET[urgency]), explicit: false };
    case 'residency_established':
      if (p.residency_established) return { date: new Date(p.residency_established as string), explicit: true };
      if (p.arrival_date) return { date: addDays(new Date(p.arrival_date as string), RESIDENCY_EST_DAYS_FROM_ARRIVAL), explicit: false };
      return null;
    case 'padron_done':
      return p.padron_done ? { date: new Date(p.padron_done as string), explicit: true } : null;
    case 'property_purchase':
      return p.property_purchase ? { date: new Date(p.property_purchase as string), explicit: true } : null;
  }
}

function nextYearlyDeadline(rrule: string, today: Date): Date {
  const months = (rrule.match(/BYMONTH=([\d,]+)/)?.[1] ?? '12').split(',').map(Number);
  const endMonth = Math.max(...months);
  const end = (y: number) => new Date(y, endMonth, 0);
  const thisYear = end(today.getFullYear());
  return today <= thisYear ? thisYear : end(today.getFullYear() + 1);
}

function resolveTiming(o: Obligation, p: Record<string, unknown>, today: Date, prior: Map<string, Resolved>): Resolved {
  const urgency = (p.urgency as Urgency) ?? 'soon';
  const t = o.timing;
  switch (t.kind) {
    case 'asap': {
      const a = anchorDate('arrival', p, today)!;
      return { state: 'scheduled', start: a.date, due: addDays(a.date, ASAP_WINDOW[urgency]), estimated: !a.explicit };
    }
    case 'absolute_recurring':
      return { state: 'recurring', nextDue: nextYearlyDeadline(t.rrule, today) };
    case 'relative_to_event': {
      const a = anchorDate(t.anchor, p, today);
      if (!a) return { state: 'pending_anchor', anchor: t.anchor };
      const due = addDays(a.date, t.offset_days);
      // negative offset = before arrival; start = due (the deadline is the point)
      const start = t.offset_days < 0 ? addDays(due, -14) : a.date;
      return { state: 'scheduled', start, due, estimated: !a.explicit };
    }
    case 'relative_to_obligation': {
      const base = prior.get(t.after);
      if (!base || base.state !== 'scheduled') return { state: 'pending_anchor', anchor: 'arrival' };
      return { state: 'scheduled', start: base.due, due: addDays(base.due, t.offset_days), estimated: true };
    }
  }
}

function phaseOf(r: Resolved, arrival: Date): Phase {
  if (r.state === 'recurring') return 'ongoing';
  if (r.state === 'pending_anchor') return 'when_settled';
  if (r.due < arrival) return 'before_you_go';
  return r.due <= addDays(arrival, 90) ? 'first_weeks' : 'when_settled';
}

// ── Shared conditions ──────────────────────────────────────────────────────────
const NON_EU: Condition = { field: 'is_eu', op: 'eq', value: false };
const HAS_ADDRESS: Condition = { field: 'has_spanish_address', op: 'eq', value: true };

// ── Catalog ────────────────────────────────────────────────────────────────────
export const CATALOG: Obligation[] = [

  // ── Pre-departure: visa path ────────────────────────────────────────────────
  {
    id: 'choose-visa-type',
    title: 'Identify your visa category',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -180 },
  },
  {
    id: 'consulate-appointment',
    title: 'Book consulate appointment (allow 8–16 weeks lead time in the US)',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -150 },
  },
  {
    id: 'criminal-background-check',
    title: 'Obtain a national criminal-record check, apostilled and translated into Spanish — must be issued within 90 days of applying, so allow several weeks (US: an FBI-approved channeler speeds it up)',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -120 },
  },
  {
    id: 'medical-certificate',
    title: 'Obtain a medical certificate (issued within 90 days, on official letterhead, translated into Spanish) confirming no diseases per the International Health Regulations',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── NLV-specific ────────────────────────────────────────────────────────────
  {
    id: 'nlv-income-proof',
    title: 'Gather proof of passive income — €28,800/yr for the main applicant plus €7,200/yr per dependent (400% of IPREM; figures track IPREM each year)',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'nlv-health-insurance',
    title: 'Purchase private health insurance from a Spanish-authorized insurer — full coverage with no co-pays and no waiting periods (NLV requirement)',
    category: 'health', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── DNV-specific ────────────────────────────────────────────────────────────
  {
    id: 'dnv-remote-work-proof',
    title: 'Gather employment contract / client agreements showing remote work permission',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-income-proof',
    title: 'Gather proof of remote income — about €34,000/yr (200% of Spain\'s minimum wage) plus ~€13,000 for a spouse and ~€4,000 per child; thresholds rise when the minimum wage does',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-coverage-certificate',
    title: 'Obtain a social-security certificate of coverage (e.g. US/Spain totalization, UK A1) from your home country — or otherwise register with Spanish Social Security',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: { all: [{ field: 'visa_type', op: 'eq', value: 'dnv' }, { field: 'work_situation', op: 'eq', value: 'employed_remote' }] },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },

  // ── In-Spain admin ──────────────────────────────────────────────────────────
  {
    id: 'empadronamiento',
    title: 'Empadronamiento (padrón municipal — register on local census)',
    category: 'admin', severity: 'required',
    source: 'webinar',
    applies_if: HAS_ADDRESS,
    depends_on: [],
    timing: { kind: 'asap' },
  },
  {
    id: 'nie',
    title: 'Obtain NIE (Número de Identidad de Extranjero) — required for all transactions',
    category: 'admin', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: 30 },
  },
  {
    id: 'residencia',
    title: 'Apply for your residence card (TIE) — start the process (fingerprinting/huella) within 30 days of entry; appointment waits can run several weeks in big cities',
    category: 'residency', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['empadronamiento', 'nie'],
    timing: { kind: 'relative_to_obligation', after: 'nie', offset_days: 0 },
  },
  {
    id: 'tarjeta-sanitaria',
    title: 'Apply for the public health card (tarjeta sanitaria) once you contribute to Social Security or qualify for public cover — NLV holders keep their private insurance instead',
    category: 'health', severity: 'required',
    source: 'webinar',
    applies_if: { all: [HAS_ADDRESS, { not: { field: 'visa_type', op: 'eq', value: 'nlv' } }] },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 14 },
  },

  // ── Tax ─────────────────────────────────────────────────────────────────────
  {
    id: 'exit-tax-return',
    title: 'Notify home country tax authority of change of tax residence',
    category: 'tax', severity: 'recommended',
    source: 'webinar',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -30 },
  },
  {
    id: 'modelo-720',
    title: 'File Modelo 720 (foreign-assets declaration) if any category of overseas assets exceeds €50,000 — filed 1 Jan–31 Mar; reformed flat-rate penalties apply since the 2022 EU court ruling struck down the old proportional regime',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: {
      all: [
        { field: 'is_tax_resident', op: 'eq', value: true },
        { field: 'foreign_assets_eur', op: 'gt', value: 50_000 },
      ],
    },
    depends_on: [],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1,2,3' },
  },

  // ── Driving ─────────────────────────────────────────────────────────────────
  {
    id: 'dgt-exchange',
    title: 'Exchange your driving licence under your country\'s bilateral agreement — a medical check, no driving test; your foreign licence is valid only ~6 months after you gain residency',
    category: 'mobility', severity: 'required',
    source: 'official',
    applies_if: {
      all: [
        { field: 'owns_or_drives', op: 'eq', value: true },
        { field: 'nationality_has_dgt_agreement', op: 'eq', value: true },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 183 },
  },
  {
    id: 'dgt-exam',
    title: 'Pass Spanish driving test (theory + practical)',
    category: 'mobility', severity: 'required',
    source: 'official',
    applies_if: {
      all: [
        { field: 'owns_or_drives', op: 'eq', value: true },
        { not: { field: 'nationality_has_dgt_agreement', op: 'eq', value: true } },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 183 },
  },

  // ── Family ──────────────────────────────────────────────────────────────────
  {
    id: 'escolarizacion',
    title: 'Enrol your child in school — the ordinary admission window runs in spring (≈March–May) for the September start; arriving off-cycle uses the "fuera de plazo" process',
    category: 'family', severity: 'required',
    source: 'official',
    applies_if: { field: 'has_children', op: 'eq', value: true },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 7 },
  },
  {
    id: 'family-reunification',
    title: 'Apply for family reunification (reagrupación familiar) — available after ~1 year of legal residence with a renewed permit; needs an adequate-housing report and means (≈150% IPREM + 50% per extra member). Not needed if family applied together initially.',
    category: 'residency', severity: 'required',
    source: 'official',
    applies_if: {
      all: [
        NON_EU,
        { field: 'has_spouse_or_partner', op: 'eq', value: true },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 365 },
  },

  // ── Citizenship milestones (info only) ──────────────────────────────────────
  {
    id: 'citizenship-track-standard',
    title: 'Citizenship eligibility: 10 years of legal residency required',
    category: 'residency', severity: 'info',
    source: 'official',
    applies_if: {
      all: [
        NON_EU,
        { field: 'is_ex_colony_national', op: 'eq', value: false },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 3650 },
  },
  {
    id: 'citizenship-track-latam',
    title: 'Citizenship eligibility: 2 years (ex-Spanish-colony nationals)',
    category: 'residency', severity: 'info',
    source: 'official',
    applies_if: { field: 'is_ex_colony_national', op: 'eq', value: true },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 730 },
  },

  // ── Pre-departure: admin documents ────────────────────────────────────────
  {
    id: 'tax-planning-consultation',
    title: 'Consult a cross-border tax specialist before moving — time asset disposals to minimise Spanish tax exposure',
    category: 'tax', severity: 'recommended',
    source: 'webinar',
    applies_if: { field: 'intends_long_stay', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -180 },
  },
  {
    id: 'apostille-documents',
    title: 'Apostille civil documents for consulate (birth certificate, marriage certificate, and other foreign official documents)',
    category: 'admin', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },

  // ── Visa-path extra documents ─────────────────────────────────────────────
  {
    id: 'nlv-letter-of-intent',
    title: 'Prepare letter of intent for NLV consulate application (reasons for move, intended region, source of income)',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'nlv-non-work-declaration',
    title: 'Provide notarized declaration of intent not to work in Spain (NLV applicants of working age)',
    category: 'visa', severity: 'recommended',
    source: 'webinar',
    applies_if: { all: [
      { field: 'visa_type', op: 'eq', value: 'nlv' },
      { not: { field: 'work_situation', op: 'in', value: ['retired', 'passive_income'] } },
    ] },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'dnv-qualification-proof',
    title: 'Obtain apostilled university degree or official proof of 3+ years professional experience (DNV requirement)',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'dnv-company-activity-proof',
    title: 'Obtain employer/client certificate of incorporation showing 1+ years of business activity (DNV)',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-employer-permission-letter',
    title: 'Obtain employer letter authorizing you to work remotely from Spain, describing your role (DNV employed workers)',
    category: 'visa', severity: 'required',
    source: 'webinar',
    applies_if: { all: [
      { field: 'visa_type', op: 'eq', value: 'dnv' },
      { field: 'work_situation', op: 'eq', value: 'employed_remote' },
    ] },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },

  // ── Banking ───────────────────────────────────────────────────────────────
  {
    id: 'spanish-bank-account',
    title: 'Open a Spanish bank account (can be done remotely as a non-resident before arrival)',
    category: 'banking', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: ['nie'],
    timing: { kind: 'asap' },
  },

  // ── Digital identity ──────────────────────────────────────────────────────
  {
    id: 'digital-certificate',
    title: 'Obtain a digital certificate to file taxes online and receive official government notifications',
    category: 'admin', severity: 'recommended',
    source: 'webinar',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['nie'],
    timing: { kind: 'relative_to_obligation', after: 'nie', offset_days: 30 },
  },

  // ── Tax registration ──────────────────────────────────────────────────────
  {
    id: 'modelo-030',
    title: 'File Modelo 030 to register with Hacienda as a new Spanish tax resident (census of tax obligations)',
    category: 'tax', severity: 'recommended',
    source: 'official',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 14 },
  },
  {
    id: 'beckham-law',
    title: 'Apply for the Beckham Law special tax regime — a flat 24% income-tax rate available to qualifying employed workers (not freelancers); confirm the filing deadline and form with a tax adviser',
    category: 'tax', severity: 'recommended',
    source: 'webinar',
    applies_if: { all: [
      { field: 'visa_type', op: 'eq', value: 'dnv' },
      { field: 'work_situation', op: 'eq', value: 'employed_remote' },
    ] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 180 },
  },

  // ── Annual income tax (tax residents) ─────────────────────────────────────
  {
    id: 'modelo-100',
    title: 'File annual Spanish income tax return (Modelo 100 / IRPF) — window 2 April to 30 June, penalty for late filing',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['residencia'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=4,5,6' },
  },
  {
    id: 'wealth-tax',
    title: 'File annual wealth-tax return (Modelo 714) during the renta period — applies when net assets exceed the €700,000 state allowance (regions vary; e.g. €500k in Catalonia), with a further ~€300k exemption for your main home',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { all: [
      { field: 'is_tax_resident', op: 'eq', value: true },
      { field: 'foreign_assets_eur', op: 'gt', value: 700_000 },
    ] },
    depends_on: ['residencia'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=4,5,6' },
  },

  // ── Autónomo / self-employed ──────────────────────────────────────────────
  {
    id: 'register-autonomo',
    title: 'Register as self-employed: file Modelo 036 with Hacienda, then register with Social Security (RETA) the same day or within 60 days (Modelo 037 was abolished in 2025)',
    category: 'admin', severity: 'required',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['nie', 'residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 30 },
  },
  {
    id: 'autonomo-social-security',
    title: 'Pay monthly autónomo Social Security (RETA) contributions — €87/month reduced rate first year, then income-based',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=12' },
  },
  {
    id: 'modelo-130',
    title: 'File quarterly IRPF provisional income tax payments (Modelo 130) — due Jan/Apr/Jul/Oct',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1,4,7,10' },
  },
  {
    id: 'modelo-303',
    title: 'File quarterly VAT returns (Modelo 303) — due Jan/Apr/Jul/Oct (required even if zero VAT charged)',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1,4,7,10' },
  },
  {
    id: 'modelo-200',
    title: 'File annual corporation tax return (Modelo 200) for a Spanish-registered company — due 25 July',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'work_situation', op: 'eq', value: 'business_owner' },
    depends_on: ['residencia'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=7' },
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  {
    id: 'student-visa-health-insurance',
    title: 'Purchase visa-compliant private health insurance (no copays, no waiting periods, repatriation included) — student visa requirement',
    category: 'health', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'student' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── Residency renewals ────────────────────────────────────────────────────
  {
    id: 'nlv-renewal',
    title: 'Renew non-lucrative residence permit — apply 60 days before expiry, show continued passive income and health insurance',
    category: 'residency', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 305 },
  },
  {
    id: 'dnv-renewal',
    title: 'Renew your digital nomad residence permit before it expires — show continued remote income and means',
    category: 'residency', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1035 },
  },
  {
    id: 'permanent-residence',
    title: 'Apply for long-term (permanent) residence after 5 years of continuous legal residence',
    category: 'residency', severity: 'recommended',
    source: 'webinar',
    applies_if: { all: [NON_EU, { field: 'intends_long_stay', op: 'eq', value: true }] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },

  // ── Property purchase ─────────────────────────────────────────────────────
  {
    id: 'property-legal-due-diligence',
    title: 'Engage a Spanish property lawyer for due diligence (title search, debts, planning, habitation licence)',
    category: 'property', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['nie'],
    timing: { kind: 'asap' },
  },
  {
    id: 'completion-deed-notary',
    title: 'Sign completion deed (escritura de compraventa) before a notary and pay the balance',
    category: 'property', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['property-legal-due-diligence'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 0 },
  },
  {
    id: 'land-registry-registration',
    title: 'Register the escritura at the Land Registry (Registro de la Propiedad)',
    category: 'property', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 30 },
  },
  {
    id: 'property-transfer-tax',
    title: 'Pay property transfer tax (ITP) on a resale property — roughly 7–10% of the price depending on the region',
    category: 'tax', severity: 'penalty',
    source: 'webinar',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 30 },
  },
  {
    id: 'ibi-property-tax',
    title: 'Pay the annual municipal property tax on your home to the town hall (IBI) — billing month varies by municipality',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=9,10' },
  },
  {
    id: 'community-fees',
    title: 'Pay community of owners (comunidad de propietarios) fees for shared building maintenance',
    category: 'property', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=12' },
  },
  {
    id: 'nonresident-property-tax',
    title: 'File non-resident imputed income tax (Modelo 210) on a Spanish property you don\'t rent out — based on cadastral value, due by 31 Dec of the following year, while not yet tax resident',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { all: [
      { field: 'owns_property_in_spain', op: 'eq', value: true },
      { not: { field: 'is_tax_resident', op: 'eq', value: true } },
    ] },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=12' },
  },

  // ── Pet import ────────────────────────────────────────────────────────────
  {
    id: 'pet-import',
    title: 'Import pets: microchip, up-to-date rabies vaccination, EU health certificate from vet (10 days before travel)',
    category: 'admin', severity: 'required',
    source: 'webinar',
    applies_if: { field: 'has_pets', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -10 },
  },

  // ── Citizenship application steps ─────────────────────────────────────────
  {
    id: 'dele-a2-exam',
    title: 'Pass DELE A2 Spanish language exam (Instituto Cervantes) — required for naturalization',
    category: 'admin', severity: 'required',
    source: 'official',
    applies_if: { all: [
      NON_EU,
      { field: 'is_ex_colony_national', op: 'eq', value: false },
    ] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },
  {
    id: 'ccse-exam',
    title: 'Pass CCSE constitutional and sociocultural knowledge exam (Instituto Cervantes) — required for naturalization',
    category: 'admin', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },
  {
    id: 'citizenship-application',
    title: 'Submit naturalization application to the Subdirección General de Nacionalidad y Estado Civil',
    category: 'residency', severity: 'required',
    source: 'webinar',
    applies_if: NON_EU,
    depends_on: ['citizenship-track-standard', 'citizenship-track-latam', 'ccse-exam'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 3650 },
  },
];

export function buildPlan(p: Record<string, unknown>): Objective[] {
  const today = new Date();
  const applicable = CATALOG.filter(o => evaluate(o.applies_if, p));
  const ordered = topoSort(applicable);
  const arrival = anchorDate('arrival', p, today)!.date;
  const resolved = new Map<string, Resolved>();
  return ordered.map(o => {
    const timing = resolveTiming(o, p, today, resolved);
    resolved.set(o.id, timing);
    return { id: o.id, title: o.title, category: o.category, severity: o.severity, source: o.source, depends_on: o.depends_on, timing, phase: phaseOf(timing, arrival) };
  });
}
