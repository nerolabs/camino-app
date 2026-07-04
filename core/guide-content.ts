/**
 * Pure helpers for the public /guide/<id> pages — one page per catalog obligation.
 *
 * Everything here is a deterministic function of catalog DATA (invariant 3: no invented
 * facts). Timing prose describes the catalog's timing RULE in words — the personalized
 * dates only exist in a real roadmap, which is exactly what the pages' CTA points at.
 */
import { CATALOG, type Obligation } from '@/core/engine-controller';
import { GUIDE_PROSE } from '@/core/guide-prose';

export const GUIDES: Obligation[] = CATALOG;

export const guideById = new Map(CATALOG.map(o => [o.id, o]));
export const titleById = new Map(CATALOG.map(o => [o.id, o.title]));

export const CATEGORY_LABEL: Record<Obligation['category'], string> = {
  visa:      'Visas',
  residency: 'Residency',
  tax:       'Tax',
  health:    'Healthcare',
  mobility:  'Driving & mobility',
  banking:   'Banking & money',
  family:    'Family',
  property:  'Property',
  admin:     'Admin & registrations',
};

export const CATEGORY_ORDER: Obligation['category'][] = [
  'visa', 'residency', 'admin', 'tax', 'health', 'banking', 'mobility', 'family', 'property',
];

const ANCHOR_LABEL: Record<string, string> = {
  arrival:               'you arrive in Spain',
  residency_established: 'your residency is established',
  padron_done:           'your padrón registration is done',
  property_purchase:     'you complete your property purchase',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// Words for the timing RULE (mirrors core/engine-controller's resolveTiming semantics —
// keep the two in sync; the engine is the source of truth).
export function describeTiming(o: Obligation): string {
  const t = o.timing;
  switch (t.kind) {
    case 'asap':
      return 'As soon as it applies — this lands near the top of a roadmap, in the first weeks.';
    case 'absolute_recurring': {
      const by = t.rrule.match(/BYMONTH=([\d,]+)/)?.[1];
      if (by) {
        const end = Math.max(...by.split(',').map(Number));
        return `A yearly obligation — each year's window closes at the end of ${MONTHS[end - 1]}.`;
      }
      return 'A recurring obligation that comes back on a fixed calendar schedule.';
    }
    case 'relative_to_event': {
      const evt = ANCHOR_LABEL[t.anchor] ?? 'an earlier milestone';
      if (t.offset_days === 0) return `Due when ${evt}.`;
      if (t.offset_days < 0)   return `Due ${-t.offset_days} days before ${evt}.`;
      return `Due within ${t.offset_days} days after ${evt}.`;
    }
    case 'relative_to_obligation': {
      const after = titleById.get(t.after) ?? 'an earlier step';
      return `Follows “${shortClause(after)}” — due within ${t.offset_days} days once that step is done.`;
    }
  }
}

// Titles lead with a short clause before the em-dash (same convention as lib/plan-format).
// Some titles put the em-dash INSIDE a parenthetical ("Empadronamiento (padrón municipal — …)"),
// which would leave an unbalanced "(" — cut back to before the parenthetical in that case.
export function shortClause(title: string): string {
  let s = title.split(' — ')[0];
  if (s.includes('(') && !s.includes(')')) s = s.slice(0, s.indexOf('(')).trim();
  return s;
}

export function metaDescription(o: Obligation): string {
  // Prefer the curated prose's first sentence — unique, human copy per page beats a template.
  // EXCEPT when that sentence leans on "the title": on the page it points at the heading
  // right above it, but in a search snippet it reads as nonsense — fall back to the template.
  const prose = GUIDE_PROSE[o.id];
  if (prose) {
    const cut = prose.indexOf('. ');
    const first = cut > 40 ? prose.slice(0, cut + 1) : prose;
    if (!first.toLowerCase().includes('title')) {
      return `${first} One step in Get Camino's free, source-cited roadmap for moving to Spain.`;
    }
  }
  const what = shortClause(o.title);
  const kind = o.source === 'official' ? 'an official Spanish requirement' : 'a practical step Get Camino recommends';
  return `${what} — ${kind} when moving to Spain: when it's due, what comes before it, and the source. One step in Get Camino's personalized relocation roadmap.`;
}

export function related(o: Obligation, n = 5): Obligation[] {
  return CATALOG.filter(g => g.category === o.category && g.id !== o.id).slice(0, n);
}

// ── schema.org structured data (pure functions of the catalog, like everything else) ──────

const ORG = {
  '@type': 'Organization',
  name: 'Get Camino',
  url: 'https://getcamino.app',
  logo: { '@type': 'ImageObject', url: 'https://getcamino.app/logo.png' },
};

export function siteJsonLd(): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Get Camino',
      url: 'https://getcamino.app',
      description: 'A personalized, source-cited roadmap for moving to Spain.',
      publisher: ORG,
    },
  ];
}

export function guideJsonLd(o: Obligation): object[] {
  const url = `https://getcamino.app/guide/${o.id}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${shortClause(o.title)} — moving to Spain`,
      description: metaDescription(o),
      url,
      mainEntityOfPage: url,
      image: 'https://getcamino.app/og-card.png',
      author: ORG,
      publisher: ORG,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Get Camino', item: 'https://getcamino.app' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://getcamino.app/guide' },
        { '@type': 'ListItem', position: 3, name: shortClause(o.title), item: url },
      ],
    },
  ];
}

export function guideIndexJsonLd(): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Moving to Spain: every step, explained',
      url: 'https://getcamino.app/guide',
      publisher: ORG,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: CATALOG.length,
        itemListElement: CATALOG.map((o, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: shortClause(o.title),
          url: `https://getcamino.app/guide/${o.id}`,
        })),
      },
    },
  ];
}
