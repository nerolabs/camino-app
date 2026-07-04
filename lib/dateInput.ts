/**
 * Forgiving, DETERMINISTIC date-entry normalizer for "mark done on a date"
 * (build-25 family finding: "2026-April-25" was rejected by the strict ISO field).
 *
 * Deliberately not an LLM: a parser is instant, works offline, and cannot hallucinate —
 * and honesty matters here because the date re-anchors downstream plan dates. Genuinely
 * ambiguous input (e.g. 04/05/2026 — April or May?) returns null rather than guessing;
 * the UI shows a live "→ 25 Apr 2026" preview so the user always confirms what we parsed.
 */

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11,
  december: 12, dec: 12,
  // Spanish month names — we're a Spain app; family members will type them.
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

function build(y: number, m: number, d: number): { iso: string; label: string } | null {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  const max = m === 2 && isLeap(y) ? 29 : DAYS_IN_MONTH[m - 1];
  if (d > max) return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const label = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  return { iso, label };
}

export function normalizeDateInput(
  raw: string, today: Date = new Date(),
): { iso: string; label: string } | null {
  const s = raw.trim().toLowerCase().replace(/(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/\bde\b/g, ' ').replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;

  if (s === 'today' || s === 'hoy') {
    return build(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }
  if (s === 'yesterday' || s === 'ayer') {
    const y = new Date(today.getTime() - 86_400_000);
    return build(y.getFullYear(), y.getMonth() + 1, y.getDate());
  }

  // Named month, any arrangement: "2026-april-25", "25 april 2026", "april 25 2026", "25 abril".
  const named = s.match(/^(.+?)[\s\-./]+(.+?)(?:[\s\-./]+(.+))?$/);
  if (named) {
    const parts = [named[1], named[2], named[3]].filter((p): p is string => !!p);
    const monthIdx = parts.findIndex(p => MONTHS[p] !== undefined);
    if (monthIdx !== -1) {
      const month = MONTHS[parts[monthIdx]];
      const nums = parts.filter((_, i) => i !== monthIdx).map(p => parseInt(p, 10));
      if (nums.every(n => Number.isFinite(n))) {
        if (nums.length === 2) {
          const year = nums.find(n => n > 31);
          const day = nums.find(n => n <= 31);
          if (year !== undefined && day !== undefined) return build(year, month, day);
        } else if (nums.length === 1 && nums[0] >= 1 && nums[0] <= 31) {
          return build(today.getFullYear(), month, nums[0]); // "25 April" → this year
        }
      }
      return null;
    }
  }

  // All-numeric forms.
  const nums = s.split(/[\s\-./]+/).map(p => parseInt(p, 10));
  if (nums.length === 3 && nums.every(n => Number.isFinite(n))) {
    const [a, b, c] = nums;
    if (a > 31) {
      // Year first: YYYY-MM-DD (the unambiguous house format).
      return build(a, b, c);
    }
    if (c > 31) {
      // Year last: D-M-YYYY vs M-D-YYYY. Unambiguous only when one part can't be a month.
      if (a > 12 && b <= 12) return build(c, b, a); // 25/04/2026
      if (b > 12 && a <= 12) return build(c, a, b); // 04/25/2026
      if (a === b) return build(c, a, b);           // 04/04/2026 — same either way
      return null; // 04/05/2026 — honestly ambiguous; the UI hint asks for the month name
    }
  }
  return null;
}
