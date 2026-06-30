/**
 * Deterministic plan engine.
 * Given a Profile, produces an ordered list of Objectives with resolved timing.
 * No LLM runs here.
 */

type Severity = 'info' | 'recommended' | 'required' | 'penalty';
type Category = 'visa' | 'residency' | 'tax' | 'health' | 'mobility' | 'banking' | 'family' | 'property' | 'admin';
type AnchorKind = 'arrival' | 'residency_established' | 'padron_done' | 'property_purchase';
type Urgency = 'immediate' | 'soon' | 'exploratory';

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
  applies_if: Condition; depends_on: string[]; timing: Timing;
};

export type Resolved =
  | { state: 'scheduled'; start: Date; due: Date; estimated: boolean }
  | { state: 'pending_anchor'; anchor: AnchorKind }
  | { state: 'recurring'; nextDue: Date };

export type Phase = 'before_you_go' | 'first_weeks' | 'ongoing' | 'when_settled';

export type Objective = {
  id: string; title: string; category: Category; severity: Severity;
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

function anchorDate(a: AnchorKind, p: Record<string, unknown>, today: Date): Date | null {
  const urgency = (p.urgency as Urgency) ?? 'soon';
  switch (a) {
    case 'arrival':
      return p.arrival_date
        ? new Date(p.arrival_date as string)
        : addDays(today, ARRIVAL_OFFSET[urgency]);
    case 'residency_established':
      return p.residency_established ? new Date(p.residency_established as string) : null;
    case 'padron_done':
      return p.padron_done ? new Date(p.padron_done as string) : null;
    case 'property_purchase':
      return null;
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
      const start = anchorDate('arrival', p, today)!;
      return { state: 'scheduled', start, due: addDays(start, ASAP_WINDOW[urgency]), estimated: false };
    }
    case 'absolute_recurring':
      return { state: 'recurring', nextDue: nextYearlyDeadline(t.rrule, today) };
    case 'relative_to_event': {
      const a = anchorDate(t.anchor, p, today);
      if (!a) return { state: 'pending_anchor', anchor: t.anchor };
      const due = addDays(a, t.offset_days);
      // negative offset = before arrival; start = due (the deadline is the point)
      const start = t.offset_days < 0 ? addDays(due, -14) : a;
      return { state: 'scheduled', start, due, estimated: false };
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
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -180 },
  },
  {
    id: 'consulate-appointment',
    title: 'Book consulate appointment (allow 8–16 weeks lead time in the US)',
    category: 'visa', severity: 'required',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -150 },
  },
  {
    id: 'criminal-background-check',
    title: 'Obtain apostilled criminal background check (FBI check takes 8–12 weeks)',
    category: 'visa', severity: 'required',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -120 },
  },
  {
    id: 'medical-certificate',
    title: 'Obtain apostilled medical certificate',
    category: 'visa', severity: 'required',
    applies_if: NON_EU,
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── NLV-specific ────────────────────────────────────────────────────────────
  {
    id: 'nlv-income-proof',
    title: 'Gather proof of passive income (€28,800/yr + €7,200 per family member)',
    category: 'visa', severity: 'required',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'nlv-health-insurance',
    title: 'Purchase private Spanish health insurance (NLV requirement, full coverage)',
    category: 'health', severity: 'required',
    applies_if: { field: 'visa_type', op: 'eq', value: 'nlv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -45 },
  },

  // ── DNV-specific ────────────────────────────────────────────────────────────
  {
    id: 'dnv-remote-work-proof',
    title: 'Gather employment contract / client agreements showing remote work permission',
    category: 'visa', severity: 'required',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-income-proof',
    title: 'Gather proof of remote income (€34,000/yr + €13,000 spouse + €4,000 per child)',
    category: 'visa', severity: 'required',
    applies_if: { field: 'visa_type', op: 'eq', value: 'dnv' },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },
  {
    id: 'dnv-coverage-certificate',
    title: 'Obtain social security coverage certificate from your employer\'s home country',
    category: 'visa', severity: 'required',
    applies_if: { all: [{ field: 'visa_type', op: 'eq', value: 'dnv' }, { field: 'work_situation', op: 'eq', value: 'employed_remote' }] },
    depends_on: ['choose-visa-type'],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -60 },
  },

  // ── In-Spain admin ──────────────────────────────────────────────────────────
  {
    id: 'empadronamiento',
    title: 'Empadronamiento (padrón municipal — register on local census)',
    category: 'admin', severity: 'required',
    applies_if: HAS_ADDRESS,
    depends_on: [],
    timing: { kind: 'asap' },
  },
  {
    id: 'nie',
    title: 'Obtain NIE (Número de Identidad de Extranjero) — required for all transactions',
    category: 'admin', severity: 'required',
    applies_if: NON_EU,
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: 30 },
  },
  {
    id: 'residencia',
    title: 'Apply for residence permit (TIE) — must be done within 30 days of entry',
    category: 'residency', severity: 'required',
    applies_if: NON_EU,
    depends_on: ['empadronamiento', 'nie'],
    timing: { kind: 'relative_to_obligation', after: 'nie', offset_days: 0 },
  },
  {
    id: 'tarjeta-sanitaria',
    title: 'Apply for health card (tarjeta sanitaria)',
    category: 'health', severity: 'required',
    applies_if: HAS_ADDRESS,
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 14 },
  },

  // ── Tax ─────────────────────────────────────────────────────────────────────
  {
    id: 'exit-tax-return',
    title: 'Notify home country tax authority of change of tax residence',
    category: 'tax', severity: 'recommended',
    applies_if: { field: 'is_tax_resident', op: 'eq', value: true },
    depends_on: [],
    timing: { kind: 'relative_to_event', anchor: 'arrival', offset_days: -30 },
  },
  {
    id: 'modelo-720',
    title: 'File Modelo 720 (foreign assets declaration) — penalty up to 150% of asset value',
    category: 'tax', severity: 'penalty',
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
    title: 'Exchange driving licence (bilateral agreement — no test required)',
    category: 'mobility', severity: 'required',
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
    title: 'Enrol child in school (public enrollment windows open Feb–Apr)',
    category: 'family', severity: 'required',
    applies_if: { field: 'has_children', op: 'eq', value: true },
    depends_on: ['empadronamiento'],
    timing: { kind: 'relative_to_obligation', after: 'empadronamiento', offset_days: 7 },
  },
  {
    id: 'family-reunification',
    title: 'Apply for family reunification permit (spouse/partner — required to live together legally)',
    category: 'residency', severity: 'required',
    applies_if: {
      all: [
        NON_EU,
        { field: 'has_spouse_or_partner', op: 'eq', value: true },
      ],
    },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_obligation', after: 'residencia', offset_days: 30 },
  },

  // ── Citizenship milestones (info only) ──────────────────────────────────────
  {
    id: 'citizenship-track-standard',
    title: 'Citizenship eligibility: 10 years of legal residency required',
    category: 'residency', severity: 'info',
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
    applies_if: { field: 'is_ex_colony_national', op: 'eq', value: true },
    depends_on: ['residencia'],
    timing: { kind: 'relative_to_event', anchor: 'residency_established', offset_days: 730 },
  },
];

export function buildPlan(p: Record<string, unknown>): Objective[] {
  const today = new Date();
  const applicable = CATALOG.filter(o => evaluate(o.applies_if, p));
  const ordered = topoSort(applicable);
  const arrival = anchorDate('arrival', p, today)!;
  const resolved = new Map<string, Resolved>();
  return ordered.map(o => {
    const timing = resolveTiming(o, p, today, resolved);
    resolved.set(o.id, timing);
    return { id: o.id, title: o.title, category: o.category, severity: o.severity, timing, phase: phaseOf(timing, arrival) };
  });
}
