import { describe, it, expect } from 'vitest';
import { REGIONS, REGION_OPTIONS, regionLabel } from '../core/regions';

// Region layer — pure lookups. Localization will translate the LABELS (display), but the SLUGS
// are stable profile values that must never change. This pins both.
describe('regionLabel', () => {
  it('maps a known slug to its display label', () => {
    expect(regionLabel('madrid')).toBe('Comunidad de Madrid');
    expect(regionLabel('cataluna')).toBe('Cataluña');
    expect(regionLabel('pais-vasco')).toBe('País Vasco');
  });

  it('returns null for "not_sure", unknown slugs, and non-strings', () => {
    expect(regionLabel('not_sure')).toBeNull(); // first-class answer, but no label
    expect(regionLabel('narnia')).toBeNull();
    expect(regionLabel(undefined)).toBeNull();
    expect(regionLabel(123)).toBeNull();
    expect(regionLabel(null)).toBeNull();
  });
});

describe('REGION_OPTIONS', () => {
  it('is every comunidad slug plus "not_sure", all lowercase-kebab', () => {
    expect(REGION_OPTIONS).toContain('not_sure');
    expect(REGION_OPTIONS.length).toBe(Object.keys(REGIONS).length + 1);
    for (const slug of Object.keys(REGIONS)) {
      expect(slug).toMatch(/^[a-z-]+$/); // stable profile values, never translated
    }
  });

  it('covers the 17 comunidades + 2 ciudades autónomas', () => {
    expect(Object.keys(REGIONS).length).toBe(19);
  });
});
