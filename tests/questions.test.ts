import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '../core/questions';
import { CATALOG } from '../core/engine-controller';

// The question pages are curated prose — invariant 3's digit rule applies mechanically:
// any number in an answer must already exist in the title of a `related` obligation.
// (Same discipline as the guide explainers' digit-lint.)

const BY_ID = new Map(CATALOG.map(o => [o.id, o]));
const digitGroups = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map(g => g.replace(/[.,]$/, ''));

describe('question pages', () => {
  it('slugs are unique and URL-safe; every question reads as a question', () => {
    const slugs = QUESTIONS.map(q => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const q of QUESTIONS) {
      expect(q.slug).toMatch(/^[a-z0-9-]+$/);
      expect(q.question.trim().endsWith('?')).toBe(true);
      expect(q.answer.length).toBeGreaterThan(0);
      expect(q.answer.every(p => p.trim().length > 40)).toBe(true);
    }
  });

  it('every related id exists in the catalog', () => {
    for (const q of QUESTIONS) {
      expect(q.related.length).toBeGreaterThan(0);
      for (const id of q.related) expect(BY_ID.has(id), `${q.slug}: unknown related ${id}`).toBe(true);
    }
  });

  it('digit guard: every number in an answer already exists in a related title', () => {
    for (const q of QUESTIONS) {
      const pool = new Set(q.related.flatMap(id => digitGroups(BY_ID.get(id)!.title)));
      for (const group of q.answer.flatMap(digitGroups)) {
        expect(pool.has(group), `${q.slug}: "${group}" not in related titles (${[...pool].join(' ')})`).toBe(true);
      }
    }
  });
});
