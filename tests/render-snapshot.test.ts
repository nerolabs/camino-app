/**
 * LOCALIZATION GATE (2026-07-05): full-HTML render snapshots for every email template and the
 * printable report. When translation touches these surfaces, a diff here proves exactly what
 * changed — a dropped section, broken markup, or a mangled placeholder fails loudly instead of
 * reaching an inbox. Inputs are fully fixed (dates, URLs, digest), and both files format dates
 * with an explicit 'en-GB' locale, so the output is deterministic.
 *
 * At L1, extend with a per-locale snapshot (same fixtures, locale es) — see docs/LOCALIZATION.md.
 */
import { describe, it, expect } from 'vitest';
import { welcomeEmail, roundupEmail, nudgeEmail, unsubFooter, feedbackAckEmail } from '../lib/emailTemplates';
import { reportHtml } from '../lib/reportHtml';
import type { Digest } from '../core/email-digest';
import type { Objective } from '../core/engine-controller';

const PLAN_URL = 'https://getcamino.app/plan';
const INTERVIEW_URL = 'https://getcamino.app/interview';
const UNSUB = unsubFooter('https://getcamino.app/api/email/unsubscribe?uid=fixed&sig=fixed');

const DIGEST: Digest = {
  overdue: [
    {
      id: 'empadronamiento', title: 'Register at your town hall (empadronamiento)',
      overdue: true, whenLabel: 'was due 12 Jun',
      tip: 'Book the cita previa now — appointment slots are the real bottleneck, not the paperwork.',
      source_url: 'https://example.gob.es/empadronamiento',
    },
  ],
  upcoming: [
    {
      id: 'nie', title: 'Get your NIE (foreigner identification number)',
      overdue: false, whenLabel: 'due 28 Jul',
      tip: 'Book the cita previa now — appointment slots are the real bottleneck, not the paperwork.',
      source_url: 'https://example.gob.es/nie',
    },
    {
      id: 'modelo-720', title: 'Declare foreign assets (Modelo 720)',
      overdue: false, whenLabel: 'due 30 Jul',
      tip: 'If in doubt, a gestor can prepare this in a day — cheap insurance against a mis-filing.',
    },
  ],
  moreCount: 2,
  totalOpen: 9,
};

describe('email templates render exactly (localization guard)', () => {
  it('welcome', () => {
    expect(welcomeEmail({ planUrl: PLAN_URL, unsubHtml: UNSUB })).toMatchSnapshot();
  });

  it('weekly roundup', () => {
    expect(roundupEmail({ digest: DIGEST, planUrl: PLAN_URL, unsubHtml: UNSUB })).toMatchSnapshot();
  });

  it('interview nudge', () => {
    expect(nudgeEmail({ interviewUrl: INTERVIEW_URL, unsubHtml: UNSUB })).toMatchSnapshot();
  });

  it('feedback ack (C9a)', () => {
    expect(feedbackAckEmail({ questionsUrl: 'https://getcamino.app/questions', changelogUrl: 'https://getcamino.app/changelog' })).toMatchSnapshot();
  });
});

// es twins (L1): same fixtures, lang 'es' — the digest fixture carries es labels the way
// buildDigest(…, 'es') produces them. A translation edit shows up as a reviewable diff here.
const DIGEST_ES: Digest = {
  ...DIGEST,
  overdue: [{ ...DIGEST.overdue[0], title: 'Empadronamiento (padrón municipal — inscríbete en el censo de tu municipio)', whenLabel: 'vencía el 12 jun', tip: 'Pide la cita previa ya — el cuello de botella real son las citas, no el papeleo.' }],
  upcoming: [
    { ...DIGEST.upcoming[0], title: 'Consigue tu NIE', whenLabel: 'vence el 28 jul', tip: 'Pide la cita previa ya — el cuello de botella real son las citas, no el papeleo.' },
    { ...DIGEST.upcoming[1], title: 'Presenta el Modelo 720', whenLabel: 'vence el 30 jul', tip: 'Ante la duda, un gestor lo prepara en un día — un seguro barato contra errores de presentación.' },
  ],
};

describe('email templates render exactly — es (L1)', () => {
  it('welcome (es)', () => {
    expect(welcomeEmail({ planUrl: PLAN_URL, unsubHtml: UNSUB, lang: 'es' })).toMatchSnapshot();
  });

  it('weekly roundup (es)', () => {
    expect(roundupEmail({ digest: DIGEST_ES, planUrl: PLAN_URL, unsubHtml: UNSUB, lang: 'es' })).toMatchSnapshot();
  });

  it('interview nudge (es)', () => {
    expect(nudgeEmail({ interviewUrl: INTERVIEW_URL, unsubHtml: UNSUB, lang: 'es' })).toMatchSnapshot();
  });

  it('feedback ack (es)', () => {
    expect(feedbackAckEmail({ questionsUrl: 'https://getcamino.app/questions', changelogUrl: 'https://getcamino.app/changelog', lang: 'es' })).toMatchSnapshot();
  });
});

describe('printable report renders exactly (localization guard)', () => {
  const TODAY = new Date('2026-07-03T12:00:00Z');
  const day = (offset: number) => new Date(2026, 6, 3 + offset);

  function obj(id: string, timing: Objective['timing'], extra: Partial<Objective> = {}): Objective {
    return {
      id, title: `Title of ${id}`, category: 'admin', severity: 'required',
      source: 'official', source_url: 'https://example.gob.es/tramite', depends_on: [],
      timing, phase: 'first_weeks', done: false, completedOn: null, ...extra,
    };
  }

  // One of every timing/state the report renders: estimated, overdue, pending-anchor, done.
  const plan: Objective[] = [
    obj('hero-step', { state: 'scheduled', start: day(0), due: day(10), estimated: true }),
    obj('overdue-step', { state: 'scheduled', start: day(-30), due: day(-2), estimated: false }),
    obj('anchored-step', { state: 'pending_anchor', anchor: 'residency_established' }),
    obj('done-step', { state: 'scheduled', start: day(-10), due: day(-1), estimated: false },
        { done: true, completedOn: day(-1) }),
  ];

  it('full report HTML', () => {
    expect(reportHtml(plan, TODAY)).toMatchSnapshot();
  });

  it('full report HTML (es)', () => {
    expect(reportHtml(plan, TODAY, 'es')).toMatchSnapshot();
  });
});
