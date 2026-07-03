/**
 * Deterministic plan engine.
 * Given a Profile, produces an ordered list of Objectives with resolved timing.
 * No LLM runs here.
 */

type Severity = 'info' | 'recommended' | 'required' | 'penalty';
type Category = 'visa' | 'residency' | 'tax' | 'health' | 'mobility' | 'banking' | 'family' | 'property' | 'admin';
type AnchorKind = 'arrival' | 'residency_established' | 'padron_done' | 'property_purchase';
type Urgency = 'immediate' | 'soon' | 'exploratory';

// The nature of each item, so the UI can tell users what they're looking at (and so we can audit
// grounding). Two values, after the sourcing pass:
//   'official'        — a codified government requirement, verified against an official source
//                       (AEAT, extranjería, BOE, …) and carrying a `source_url`.
//   'recommendation'  — Camino's own practical advice (e.g. a scouting trip, hiring a lawyer,
//                       consulting a tax specialist). Not a legal requirement, so no official
//                       `source_url`; `severity` still conveys how strongly we suggest it.
// (Provenance during mining used to distinguish 'webinar' vs 'domain'; that history now lives in
// core/SOURCING.md. A `webinar_url` may still be attached to either kind as a staff reference.)
type Source = 'official' | 'recommendation';

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
  source_url?: string;  // canonical official source, surfaced as a link in the roadmap (all users)
  webinar_url?: string; // original webinar (YouTube) the content was mined from — staff-only, for
                        // cross-checking official vs. webinar; also a future partnership/upsell hook
  applies_if: Condition; depends_on: string[]; timing: Timing;
};

export type Resolved =
  | { state: 'scheduled'; start: Date; due: Date; estimated: boolean }
  | { state: 'pending_anchor'; anchor: AnchorKind }
  | { state: 'recurring'; nextDue: Date };

export type Phase = 'before_you_go' | 'first_weeks' | 'ongoing' | 'when_settled';

// User-reported progress on an obligation, stored on the profile under `progress`.
// The engine stays deterministic: progress is just more input. A `completedOn` date
// re-anchors downstream obligations to what actually happened (the "living" plan).
export type Progress = { state: 'done'; completedOn?: string; note?: string };

export type Objective = {
  id: string; title: string; category: Category; severity: Severity;
  source: Source; source_url?: string; webinar_url?: string; depends_on: string[];
  timing: Resolved; phase: Phase;
  done: boolean; completedOn: Date | null;
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

// Completing certain obligations establishes a real anchor date for everything timed relative to
// it: finishing empadronamiento sets `padron_done`; getting your residence card sets
// `residency_established`. So marking these done doesn't just tick a box — it re-flows every
// downstream residency-/padrón-anchored item from an actual date (estimated → firm). An explicit
// profile date always wins; a completion only fills an anchor the user hasn't given directly.
const ANCHOR_FROM_COMPLETION: Record<string, AnchorKind> = {
  empadronamiento: 'padron_done',
  residencia: 'residency_established',
};

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

function resolveTiming(o: Obligation, p: Record<string, unknown>, today: Date, prior: Map<string, Resolved>, actuals: Map<string, Date>): Resolved {
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
      // If the prerequisite is actually done, anchor to its real completion date —
      // a late/early completion ripples a firm date through to this step.
      const actual = actuals.get(t.after);
      if (actual) return { state: 'scheduled', start: actual, due: addDays(actual, t.offset_days), estimated: false };
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
// The citizenship track (language/culture exams, application, jura, eligibility clock) only applies
// if the user actually wants to naturalise — many people just renew their residence indefinitely.
// Gated on the `wants_citizenship` interview slot (non-EU long-stay movers).
const WANTS_CITIZENSHIP: Condition = { field: 'wants_citizenship', op: 'eq', value: true };

// ── Catalog ────────────────────────────────────────────────────────────────────
export const CATALOG: Obligation[] = [

  // ── Deciding where to live ───────────────────────────────────────────────────
  // Advisory: many movers haven't chosen a region yet. Shown to anyone who doesn't already
  // own property in Spain (the clearest "location decided" signal). Asserts no deadlines,
  // costs, or laws — only evaluation dimensions — so it stays within invariant 3. Lola's
  // in-drawer coaching elaborates on how to weigh each area.
  {
    id: 'scout-where-to-live',
    webinar_url: 'https://www.youtube.com/watch?v=gEY3Xkqs6so&t=414s',
    title: 'Decide where in Spain to live before you commit — if you’re unsure, plan a scouting trip and spend real time in 2–3 candidate areas, weighing cost of living, healthcare access, climate, transport links, expat/English-speaking support, and (if relevant) schools before you sign a lease or buy',
    category: 'admin', severity: 'recommended',
    source: 'recommendation',
    applies_if: { all: [
      { not: { field: 'owns_property_in_spain', op: 'eq', value: true } },
      { field: 'knows_where_to_live', op: 'eq', value: false },
    ] },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -270 },
  },

  // ── Pre-departure: visa path ────────────────────────────────────────────────
  {
    id: 'choose-visa-type',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=124s',
    title: 'Identify your visa category — match your situation to a Spanish residence/visa type (non-lucrative, digital nomad, work, study, family)',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/autorizaciones',
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -180 },
  },
  {
    id: 'consulate-appointment',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=43s',
    title: 'Book consulate appointment to lodge your visa application (allow 8–16 weeks lead time in the US) — appointments are booked through the consulate’s cita previa system',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://sede.maec.gob.es/pagina/index/directorio/citaprevia',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -150 },
  },
  {
    id: 'criminal-background-check',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=580s',
    title: 'Obtain a national criminal-record check, apostilled and translated into Spanish — must be issued within 90 days of applying, so allow several weeks (US: an FBI-approved channeler speeds it up)',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -120 },
  },
  {
    id: 'medical-certificate',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=1015s',
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
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    webinar_url: 'https://www.youtube.com/watch?v=tZJk56EH1ms&t=161s',
    title: 'Gather proof of passive income — €28,800/yr for the main applicant plus €7,200/yr per dependent (400% of IPREM; figures track IPREM each year)',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'nlv-health-insurance',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    webinar_url: 'https://www.youtube.com/watch?v=tZJk56EH1ms&t=277s',
    title: 'Purchase private health insurance from a Spanish-authorized insurer — full coverage with no co-pays and no waiting periods (NLV requirement)',
    category: 'health', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },
  {
    id: 'convenio-especial',
    title: 'Enroll in the Convenio Especial to buy into public healthcare — available after 1 year of continuous residence + empadronamiento; monthly premium €60 (under 65) or €157 (65+)',
    category: 'health', severity: 'recommended',
    source: 'official',
    source_url: 'https://www.sanidad.gob.es/servCiudadanos/internacional/convenioEspecial.htm',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['nlv-health-insurance'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 365 },
  },

  // ── DNV-specific ────────────────────────────────────────────────────────────
  {
    id: 'dnv-remote-work-proof',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=135s',
    title: 'Gather employment contract / client agreements showing remote work permission',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-income-proof',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=144s',
    title: 'Gather proof of remote income — about €34,000/yr (200% of Spain\'s minimum wage) plus ~€13,000 for a spouse and ~€4,000 per child; thresholds rise when the minimum wage does',
    category: 'visa', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-coverage-certificate',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=556s',
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
    title: 'Empadronamiento (padrón municipal — register on your town’s census)',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://administracion.gob.es/pagFront/buscadortramites/detalleTramite.htm?idT=32988',
    webinar_url: 'https://www.youtube.com/watch?v=gtruvbQhphE&t=3576s',
    applies_if: HAS_ADDRESS,
    depends_on: [],
    timing: { kind: 'asap' },
  },
  {
    id: 'nie',
    title: 'Obtain your NIE (Número de Identidad de Extranjero, form EX-15) — required for nearly all official and financial transactions',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://www.policia.es/_es/extranjeria_extranjeros.php',
    webinar_url: 'https://www.youtube.com/watch?v=C_UxMIqTd0Q&t=716s',
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: 30 },
  },
  {
    // The EU-citizen counterpart of the TIE: EU/EEA nationals staying >3 months must register in
    // the Registro Central de Extranjeros. Found missing in the 2026-07-03 audit (an EU long-stay
    // profile previously had no registration step at all). Gated on the household being EU +
    // long-stay; Spanish nationals themselves don't need it — the title says so.
    id: 'eu-registration-certificate',
    title: 'Register in the Central Register of Foreign Nationals and get your EU citizen registration certificate (certificado de registro, form EX-18) — required for EU/EEA nationals staying more than 3 months; apply in person within 3 months of entry (not needed for Spanish nationals)',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/65.-certificado-de-registro-de-ciudadano-de-la-union-europea',
    applies_if: { all: [
      { field: 'is_eu', op: 'eq', value: true },
      { field: 'intends_long_stay', op: 'eq', value: true },
    ] },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: 90 },
  },
  {
    id: 'residencia',
    source_url: 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/tarjeta-de-identidad-de-extranjero/',
    title: 'Apply for your residence card (TIE) — start the process (fingerprinting/huella) within 30 days of entry; appointment waits can run several weeks in big cities',
    category: 'residency', severity: 'required',
    source: 'official',
    applies_if: NON_EU,
    depends_on: ['empadronamiento', 'nie'],
    timing: { kind: 'relative_to_obligation', after: 'nie', offset_days: 0 },
  },
  {
    id: 'tarjeta-sanitaria',
    webinar_url: 'https://www.youtube.com/watch?v=OnLKyPbpALY&t=152s',
    title: 'Apply for the public health card (tarjeta sanitaria) once you contribute to Social Security or qualify for public cover — NLV holders keep their private insurance instead',
    category: 'health', severity: 'required',
    source: 'official',
    source_url: 'https://www.sanidad.gob.es/areas/saludDigital/tarjetaSanitariaSNS/home.htm',
    applies_if: { all: [HAS_ADDRESS, { not: { field: 'visa_type', op: 'eq', value: 'nlv' } }] },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 14 },
  },

  // ── Tax ─────────────────────────────────────────────────────────────────────
  {
    id: 'exit-tax-return',
    title: 'Notify home country tax authority of change of tax residence',
    category: 'tax', severity: 'recommended',
    source: 'recommendation',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=401s',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -30 },
  },
  {
    id: 'modelo-720',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI34.shtml',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=1246s',
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
    source_url: 'https://sede.dgt.gob.es/es/permisos-de-conducir/canjes-de-permisos/canjes-de-permisos-extranjeros/',
    webinar_url: 'https://www.youtube.com/watch?v=2A19YnqiO4g&t=3743s',
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
    source_url: 'https://www.dgt.es/nuestros-servicios/permisos-de-conducir/obtener-un-nuevo-permiso-de-conducir/requisitos-preparacion-y-presentacion-a-examen/',
    webinar_url: 'https://www.youtube.com/watch?v=2A19YnqiO4g&t=3743s',
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
    source_url: 'https://educagob.educacionfpydeportes.gob.es/ensenanzas/primaria/informacion-general/acceso.html',
    title: 'Enroll your child in school — the ordinary admission window runs in spring (≈March–May) for the September start; arriving off-cycle uses the "fuera de plazo" process',
    category: 'family', severity: 'required',
    source: 'official',
    applies_if: { field: 'has_children', op: 'eq', value: true },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 7 },
  },
  {
    id: 'family-reunification',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-de-residencia-temporal-por-reagrupacion-familiar',
    title: 'Apply for family reunification (reagrupación familiar) — available after ~1 year of legal residence with a renewed permit; needs an adequate-housing report and means (≈150% IPREM + 50% per extra member). Not needed if family applied together initially.',
    category: 'residency', severity: 'required',
    source: 'official',
    applies_if: {
      all: [
        NON_EU,
        { field: 'has_spouse_or_partner', op: 'eq', value: true },
        // Reagrupación familiar requires marriage or a registered partnership — an unmarried
        // partner can't be reunified this way, so don't show it to them.
        { field: 'partner_is_married', op: 'eq', value: true },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 365 },
  },

  // ── Citizenship milestones (info only) ──────────────────────────────────────
  {
    id: 'citizenship-track-standard',
    source_url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia',
    webinar_url: 'https://www.youtube.com/watch?v=vAeqa_xdrTY&t=194s',
    title: 'Citizenship eligibility: 10 years of legal residency required',
    category: 'residency', severity: 'info',
    source: 'official',
    applies_if: {
      all: [
        NON_EU,
        WANTS_CITIZENSHIP,
        { field: 'is_ex_colony_national', op: 'eq', value: false },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 3650 },
  },
  {
    id: 'citizenship-track-latam',
    source_url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia',
    webinar_url: 'https://www.youtube.com/watch?v=vAeqa_xdrTY&t=1067s',
    title: 'Citizenship eligibility: 2 years (ex-Spanish-colony nationals)',
    category: 'residency', severity: 'info',
    source: 'official',
    // Intentionally no NON_EU gate: a dual EU + Latin-American national could still naturalise via
    // the 2-year track. In practice `wants_citizenship` is only asked of non-EU movers, so this is
    // effectively non-EU today — but if that slot ever widens, this stays correct.
    applies_if: { all: [
      WANTS_CITIZENSHIP,
      { field: 'is_ex_colony_national', op: 'eq', value: true },
    ] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 730 },
  },

  // ── Pre-departure: admin documents ────────────────────────────────────────
  {
    id: 'tax-planning-consultation',
    title: 'Consult a cross-border tax specialist before moving — time asset disposals to minimise Spanish tax exposure',
    category: 'tax', severity: 'recommended',
    source: 'recommendation',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=1086s',
    applies_if: { field: 'intends_long_stay', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -180 },
  },
  {
    id: 'apostille-documents',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=1538s',
    title: 'Apostille civil documents for the consulate (birth/marriage certificates and other foreign public documents) — under the 1961 Hague Convention; each document must be apostilled in the country that issued it',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/legalizacion-unica-apostilla',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'sworn-translation',
    title: 'Obtain certified sworn translations (traductor jurado) of all apostilled foreign documents into Spanish — only a MAEC-appointed sworn translator gives them official validity',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Traductores-Interpretes-Jurados.aspx',
    applies_if: NON_EU,
    depends_on: ['apostille-documents'],
    timing: { kind: 'relative_to_obligation', after: 'apostille-documents', offset_days: 7 },
  },

  // ── Visa-path extra documents ─────────────────────────────────────────────
  {
    id: 'nlv-letter-of-intent',
    webinar_url: 'https://www.youtube.com/watch?v=tZJk56EH1ms&t=231s',
    title: 'Prepare letter of intent for NLV consulate application (reasons for move, intended region, source of income)',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'nlv-non-work-declaration',
    webinar_url: 'https://www.youtube.com/watch?v=tZJk56EH1ms&t=161s',
    title: 'Provide notarized declaration of intent not to work in Spain (NLV applicants of working age)',
    category: 'visa', severity: 'recommended',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa',
    applies_if: { all: [
      { field: 'visa_type', op: 'eq', value: 'nlv' },
      { not: { field: 'work_situation', op: 'in', value: ['retired', 'passive_income'] } },
    ] },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'dnv-qualification-proof',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=230s',
    title: 'Obtain apostilled university degree or official proof of 3+ years professional experience (DNV requirement)',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -90 },
  },
  {
    id: 'dnv-company-activity-proof',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=215s',
    title: 'Obtain employer/client certificate of incorporation showing 1+ years of business activity (DNV)',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-employer-permission-letter',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=215s',
    title: 'Obtain employer letter authorizing you to work remotely from Spain, describing your role (DNV employed workers)',
    category: 'visa', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
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
    category: 'banking', severity: 'recommended',
    source: 'recommendation',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=191', // "Buying a Home in Spain" — bank account
    applies_if: NON_EU,
    depends_on: ['nie'],
    timing: { kind: 'asap' },
  },

  // ── Digital identity ──────────────────────────────────────────────────────
  {
    id: 'digital-certificate',
    title: 'Obtain a digital certificate (FNMT) to file taxes online and receive official government notifications',
    category: 'admin', severity: 'recommended',
    source: 'official',
    source_url: 'https://www.sede.fnmt.gob.es/certificados/persona-fisica',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['nie'],
    timing: { kind: 'relative_to_obligation', after: 'nie', offset_days: 30 },
  },

  // ── Tax registration ──────────────────────────────────────────────────────
  {
    id: 'modelo-030',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G321.shtml',
    title: 'File Modelo 030 to register with Hacienda as a new Spanish tax resident (census of tax obligations)',
    category: 'tax', severity: 'recommended',
    source: 'official',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 14 },
  },
  {
    id: 'beckham-law',
    title: 'Apply for the Beckham Law special regime (Modelo 149) — a flat 24% tax on Spanish-source income up to €600,000 for up to six years, for qualifying inbound workers (employees and, since 2023, many remote workers and entrepreneurs; usually not standard autónomos). The election has a strict filing window (~6 months from starting your activity) — confirm eligibility and timing with a tax adviser',
    category: 'tax', severity: 'recommended',
    source: 'official',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/tengo-que-presentar-declaracion/regimen-fiscal-aplicable-trabajadores-desplazados/regimen-especial.html',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=1643s',
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
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G229.shtml',
    title: 'File annual Spanish income tax return (Modelo 100 / IRPF) — window 2 April to 30 June, penalty for late filing',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: ['residencia'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=4,5,6' },
  },
  {
    id: 'wealth-tax',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G611.shtml',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=794s',
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
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=479s',
    title: 'Register as self-employed: file Modelo 036 with Hacienda, then register with Social Security (RETA) the same day or within 60 days (Modelo 037 was abolished in 2025)',
    category: 'admin', severity: 'required',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['nie', 'residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 30 },
  },
  {
    id: 'autonomo-social-security',
    source_url: 'https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Altas,+bajas+y+modificaciones/Altas+y+afiliacion+de+trabajadores/Alta_trabajo_autonomo',
    title: 'Pay monthly autónomo Social Security (RETA) contributions — €87/month reduced rate first year, then income-based',
    category: 'tax', severity: 'penalty',
    source: 'official',
    webinar_url: 'https://www.youtube.com/watch?v=HP55mfxt52U&t=479s',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=12' },
  },
  {
    id: 'modelo-130',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml',
    title: 'File quarterly IRPF provisional income tax payments (Modelo 130) — due Jan/Apr/Jul/Oct',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1,4,7,10' },
  },
  {
    id: 'modelo-303',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml',
    title: 'File quarterly VAT returns (Modelo 303) — due Jan/Apr/Jul/Oct (required even if zero VAT charged)',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['register-autonomo'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1,4,7,10' },
  },
  {
    id: 'modelo-390',
    title: 'File the annual VAT summary declaration (Modelo 390) — informative recap of the year’s Modelo 303 filings, due in the first 30 days of January, electronic only',
    category: 'tax', severity: 'penalty',
    source: 'official',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-390-iva-declaracion-resumen-anual.html',
    applies_if: { field: 'is_self_employed_in_spain', op: 'eq', value: true },
    depends_on: ['modelo-303'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=1' },
  },
  {
    id: 'modelo-200',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GE04.shtml',
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
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/estancia-por-estudios',
    webinar_url: 'https://www.youtube.com/watch?v=uH927kx3igU&t=1015s',
    title: 'Purchase visa-compliant private health insurance (from an insurer authorised in Spain, SNS-equivalent cover, no copays, no waiting periods, repatriation included) — a national student-visa requirement',
    category: 'health', severity: 'required',
    source: 'official',
    applies_if: { field: 'visa_type', op: 'eq', value: 'student' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── Residency renewals ────────────────────────────────────────────────────
  {
    id: 'nlv-renewal',
    webinar_url: 'https://www.youtube.com/watch?v=tZJk56EH1ms&t=677s',
    title: 'Renew non-lucrative residence permit — file within the 60 days before expiry (you may also file up to 90 days after, but late filing is a minor infraction, fine up to €500); show continued passive income and health insurance',
    category: 'residency', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/migraciones/w/renovacion-de-la-autorizacion-de-residencia-temporal-no-lucrativa',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 305 },
  },
  {
    id: 'dnv-renewal',
    webinar_url: 'https://www.youtube.com/watch?v=SqmxlLuJ_bY&t=1996s',
    title: 'Renew your digital nomad residence permit before it expires — renewable for 2-year periods as long as the qualifying conditions (continued remote income and means) hold; managed by the UGE-CE under the Startups Law (Ley 28/2022)',
    category: 'residency', severity: 'required',
    source: 'official',
    source_url: 'https://www.inclusion.gob.es/en/web/unidadgrandesempresas/teletrabajadores',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1035 },
  },
  {
    id: 'permanent-residence',
    title: 'Apply for long-term residence after 5 years of continuous legal residence',
    category: 'residency', severity: 'recommended',
    source: 'official',
    source_url: 'https://administracion.gob.es/pag_Home/en/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/residencia/obtencion-residencia/residencia-permanente.html',
    applies_if: { all: [NON_EU, { field: 'intends_long_stay', op: 'eq', value: true }] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },

  // ── Property purchase ─────────────────────────────────────────────────────
  {
    id: 'property-legal-due-diligence',
    title: 'Engage a Spanish property lawyer for due diligence (title search, debts, planning, habitation licence)',
    category: 'property', severity: 'recommended',
    source: 'recommendation',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=119s', // "Buying a Home in Spain"
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['nie'],
    timing: { kind: 'asap' },
  },
  {
    id: 'completion-deed-notary',
    title: 'Sign completion deed (escritura de compraventa) before a notary and pay the balance — the notarial public deed is the standard legal formalisation of the sale (and required if you take a mortgage)',
    category: 'property', severity: 'required',
    source: 'official',
    source_url: 'https://administracion.gob.es/pag_Home/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/residencia/compraventa-bienes-inmuebles/notarias-registros-propiedad.html',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=283', // "Buying a Home in Spain" — signing before a notary
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['property-legal-due-diligence'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 0 },
  },
  {
    id: 'land-registry-registration',
    title: 'Register the escritura at the Land Registry (Registro de la Propiedad) — technically voluntary in Spain (mandatory only if you take a mortgage), but strongly recommended: it puts your title under court protection',
    category: 'property', severity: 'recommended',
    source: 'official',
    source_url: 'https://administracion.gob.es/pag_Home/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/residencia/compraventa-bienes-inmuebles/notarias-registros-propiedad.html',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=570s', // "Buying a Home in Spain"
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 30 },
  },
  {
    id: 'property-transfer-tax',
    source_url: 'https://administracion.gob.es/pag_Home/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/residencia/compraventa-bienes-inmuebles/impuestos.html',
    title: 'Pay property transfer tax (ITP) on a resale property — roughly 6–11% of the price, set by each autonomous community',
    category: 'tax', severity: 'penalty',
    source: 'official',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=720s', // supplementary: "Buying a Home in Spain"
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'relative_to_event', anchor: 'property_purchase', offset_days: 30 },
  },
  {
    id: 'ibi-property-tax',
    source_url: 'https://boe.es/buscar/act.php?id=BOE-A-2004-4214',
    title: 'Pay the annual municipal property tax on your home to the town hall (IBI) — billing month varies by municipality',
    category: 'tax', severity: 'penalty',
    source: 'official',
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=9,10' },
  },
  {
    id: 'community-fees',
    title: 'Pay community of owners (comunidad de propietarios) fees for shared building maintenance — a statutory obligation under the Ley de Propiedad Horizontal (Ley 49/1960, art. 9)',
    category: 'property', severity: 'required',
    source: 'official',
    source_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1960-10906',
    webinar_url: 'https://www.youtube.com/watch?v=8zyT1TG9S5E&t=217', // "Buying a Home in Spain" — community fees
    applies_if: { field: 'owns_property_in_spain', op: 'eq', value: true },
    depends_on: ['completion-deed-notary'],
    timing: { kind: 'absolute_recurring', rrule: 'FREQ=YEARLY;BYMONTH=12' },
  },
  {
    id: 'nonresident-property-tax',
    source_url: 'https://sede.agenciatributaria.gob.es/Sede/no-residentes/irnr-sin-establecimiento-permanente/modelo-210-irnr-sin-establecimiento-permanente.html',
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
    webinar_url: 'https://www.youtube.com/watch?v=U6_AOU1JdAE&t=3464s',
    title: 'Import your pet: microchip, valid rabies vaccination (given at least 21 days before travel), and — arriving from a non-EU country like the US — an EU animal health certificate issued by an authorised vet within 10 days of entry',
    category: 'admin', severity: 'required',
    source: 'official',
    source_url: 'https://www.mapa.gob.es/es/ganaderia/temas/comercio-exterior-ganadero/desplazamiento-animales-compania/viajar-perros-gatos-hurones',
    applies_if: { field: 'has_pets', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -10 },
  },

  // ── Citizenship application steps ─────────────────────────────────────────
  {
    id: 'dele-a2-exam',
    source_url: 'https://examenes.cervantes.es/es/dele/examenes/a2',
    webinar_url: 'https://www.youtube.com/watch?v=vAeqa_xdrTY&t=1511s',
    title: 'Pass DELE A2 Spanish language exam (Instituto Cervantes) — required for naturalization',
    category: 'admin', severity: 'required',
    source: 'official',
    // Exemption is for nationals of SPANISH-SPEAKING countries — not the ex-colony set. A Filipino
    // applicant gets the 2-year citizenship track (ex-colony) but still must pass DELE.
    applies_if: { all: [
      NON_EU,
      WANTS_CITIZENSHIP,
      { field: 'is_spanish_speaking_national', op: 'eq', value: false },
    ] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },
  {
    id: 'ccse-exam',
    source_url: 'https://examenes.cervantes.es/es/presentacion/nacionalidad',
    webinar_url: 'https://www.youtube.com/watch?v=vAeqa_xdrTY&t=1601s',
    title: 'Pass CCSE constitutional and sociocultural knowledge exam (Instituto Cervantes) — required for naturalization',
    category: 'admin', severity: 'required',
    source: 'official',
    applies_if: { all: [NON_EU, WANTS_CITIZENSHIP] },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 1825 },
  },
  {
    id: 'citizenship-application',
    webinar_url: 'https://www.youtube.com/watch?v=vAeqa_xdrTY&t=194s',
    title: 'Submit your naturalisation (nationality by residence) application to the Ministry of Justice',
    category: 'residency', severity: 'required',
    source: 'official',
    source_url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia',
    applies_if: { all: [NON_EU, WANTS_CITIZENSHIP] },
    depends_on: ['citizenship-track-standard', 'citizenship-track-latam', 'ccse-exam'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 3650 },
  },
  {
    id: 'citizenship-jura',
    title: 'Complete the jura/promesa (oath of fidelity to the King and obedience to the Constitution, art. 23 Código Civil) at the Registro Civil — must be done within 180 days of the grant notification or the concession lapses',
    category: 'residency', severity: 'required',
    source: 'official',
    source_url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia',
    applies_if: { all: [NON_EU, WANTS_CITIZENSHIP] },
    depends_on: ['citizenship-application'],
    timing: { kind: 'relative_to_obligation', after: 'citizenship-application', offset_days: 365 },
  },
];

export function buildPlan(p: Record<string, unknown>): Objective[] {
  const today = new Date();
  const progress = (p.progress as Record<string, Progress> | undefined) ?? {};
  const actuals = new Map<string, Date>();
  for (const [id, pr] of Object.entries(progress))
    if (pr?.completedOn) actuals.set(id, new Date(pr.completedOn));
  // A completed obligation can establish a timing anchor for downstream items (see
  // ANCHOR_FROM_COMPLETION). Fill only anchors the user hasn't given an explicit date for.
  const pa: Record<string, unknown> = { ...p };
  for (const [obligationId, anchorField] of Object.entries(ANCHOR_FROM_COMPLETION)) {
    const done = actuals.get(obligationId);
    if (done && !pa[anchorField]) pa[anchorField] = done.toISOString();
  }
  const applicable = CATALOG.filter(o => evaluate(o.applies_if, pa));
  const ordered = topoSort(applicable);
  const arrival = anchorDate('arrival', pa, today)!.date;
  const resolved = new Map<string, Resolved>();
  return ordered.map(o => {
    const timing = resolveTiming(o, pa, today, resolved, actuals);
    resolved.set(o.id, timing);
    const pr = progress[o.id];
    return {
      id: o.id, title: o.title, category: o.category, severity: o.severity,
      source: o.source, source_url: o.source_url, webinar_url: o.webinar_url, depends_on: o.depends_on, timing, phase: phaseOf(timing, arrival),
      done: pr?.state === 'done',
      completedOn: pr?.completedOn ? new Date(pr.completedOn) : null,
    };
  });
}
