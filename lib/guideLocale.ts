/**
 * Locale-aware guide helpers for the SCREENS (L1).
 *
 * core/guide-content.ts must stay i18n-free — it's imported by SERVER code (the sitemap API
 * route, JSON-LD), and lib/i18n pulls native storage modules that don't belong in a Workers
 * bundle. So the screens use these wrappers instead; SEO strings (metaDescription, <Seo> props)
 * stay English until the L2 /es route tree gives each locale its own prerendered pages.
 *
 * describeTimingLocalized mirrors core describeTiming exactly — for English it must produce
 * byte-identical output (pinned by tests/guide-prose-es.test.ts across all 60 guides), so the
 * core function and these strings can't drift apart.
 */
import i18n, { dateLocale } from '@/lib/i18n';
import { titleById, shortClause } from '@/core/guide-content';
import { type Obligation } from '@/core/engine-controller';
import { GUIDE_PROSE } from '@/core/guide-prose';
import { GUIDE_PROSE_BY_LOCALE, titleFor } from '@/core/i18n/registry';

const tg = (key: string, options?: Record<string, unknown>) => i18n.t(`guides:${key}`, options) as string;

export function displayProse(id: string): string | undefined {
  return GUIDE_PROSE_BY_LOCALE[i18n.language]?.[id] ?? GUIDE_PROSE[id];
}

export const categoryLabel = (cat: Obligation['category']): string => tg(`category.${cat}`);

export const categoryTip = (cat: Obligation['category']): string => tg(`tip.${cat}`);

export function describeTimingLocalized(o: Obligation): string {
  const t = o.timing;
  switch (t.kind) {
    case 'asap':
      return tg('timing.asap');
    case 'absolute_recurring': {
      const by = t.rrule.match(/BYMONTH=([\d,]+)/)?.[1];
      if (by) {
        const end = Math.max(...by.split(',').map(Number));
        const month = new Date(2000, end - 1, 1).toLocaleDateString(dateLocale(), { month: 'long' });
        return tg('timing.yearlyWindow', { month });
      }
      return tg('timing.recurring');
    }
    case 'relative_to_event': {
      const anchorKey = `timing.anchor.${t.anchor}`;
      const event = i18n.exists(`guides:${anchorKey}`) ? tg(anchorKey) : tg('timing.anchor.other');
      if (t.offset_days === 0) return tg('timing.dueWhen', { event });
      if (t.offset_days < 0)   return tg('timing.dueBefore', { days: -t.offset_days, event });
      return tg('timing.dueAfter', { days: t.offset_days, event });
    }
    case 'relative_to_obligation': {
      const en = titleById.get(t.after);
      const after = en ? titleFor(i18n.language, t.after, en) : undefined;
      const step = after ? shortClause(after) : tg('timing.fallbackStep');
      return tg('timing.follows', { step, days: t.offset_days });
    }
  }
}
