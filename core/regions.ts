/**
 * Spain's comunidades autónomas (plus the two ciudades autónomas) — the region layer.
 * Slugs are stable profile values; labels are display names. "not_sure" is a first-class
 * answer: undecided movers get the scouting step and generic "varies by region" notes.
 *
 * v1 of region-awareness is honest and narrow: the plan KNOWS your region and flags which
 * steps vary there. Per-region fact matrices (ITP rates, school calendars…) are a later,
 * sourced content pass — invariant 3 forbids shipping 17 regions of unverified numbers.
 */

export const REGIONS: Record<string, string> = {
  'andalucia': 'Andalucía',
  'aragon': 'Aragón',
  'asturias': 'Asturias',
  'baleares': 'Illes Balears',
  'canarias': 'Canarias',
  'cantabria': 'Cantabria',
  'castilla-la-mancha': 'Castilla-La Mancha',
  'castilla-y-leon': 'Castilla y León',
  'cataluna': 'Cataluña',
  'comunidad-valenciana': 'Comunitat Valenciana',
  'extremadura': 'Extremadura',
  'galicia': 'Galicia',
  'la-rioja': 'La Rioja',
  'madrid': 'Comunidad de Madrid',
  'murcia': 'Región de Murcia',
  'navarra': 'Navarra',
  'pais-vasco': 'País Vasco',
  'ceuta': 'Ceuta',
  'melilla': 'Melilla',
};

export const REGION_OPTIONS = [...Object.keys(REGIONS), 'not_sure'];

export function regionLabel(slug: unknown): string | null {
  return typeof slug === 'string' ? REGIONS[slug] ?? null : null;
}
