import { dateLocale } from '@/lib/i18n';

/**
 * Format a UTC-midnight engine date as its calendar day — WITHOUT relying on Intl's `timeZone`
 * option, which is unreliable under Hermes on native (the same reason budgetFormat.ts does money
 * grouping by hand, "no Intl reliance"). Every engine date is a UTC-midnight instant, so we pull the
 * UTC Y/M/D and reconstitute them as a LOCAL date, then format with toLocaleDateString normally
 * (plain day/month/year formatting works on native + web). Result: the same calendar day on every JS
 * engine and in every viewer timezone — no westward one-day drift, no `timeZone:'UTC'` dependency.
 *
 * Server-only surfaces (reportHtml, email-digest) run on the Workers/V8 runtime, never Hermes, and
 * keep using `timeZone:'UTC'` directly — this helper is for the client formatters that reach native.
 */
export function formatUTCDate(d: Date, opts: Intl.DateTimeFormatOptions): string {
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return local.toLocaleDateString(dateLocale(), opts);
}
