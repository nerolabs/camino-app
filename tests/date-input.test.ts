import { describe, it, expect } from 'vitest';
import { normalizeDateInput } from '../lib/dateInput';

const TODAY = new Date(2026, 6, 4); // 4 Jul 2026 (local)
const iso = (s: string) => normalizeDateInput(s, TODAY)?.iso ?? null;

describe('normalizeDateInput', () => {
  it('accepts the strict house format', () => {
    expect(iso('2026-04-25')).toBe('2026-04-25');
  });

  it("normalizes Cristina's format and friends (named months, any order)", () => {
    expect(iso('2026-April-25')).toBe('2026-04-25');
    expect(iso('25 April 2026')).toBe('2026-04-25');
    expect(iso('April 25, 2026')).toBe('2026-04-25');
    expect(iso('25th april 2026')).toBe('2026-04-25');
    expect(iso('April 25')).toBe('2026-04-25'); // year defaults to current
  });

  it('speaks Spanish months', () => {
    expect(iso('25 de abril de 2026')).toBe('2026-04-25');
    expect(iso('25 abril')).toBe('2026-04-25');
  });

  it('handles numeric forms only when unambiguous', () => {
    expect(iso('2026/04/25')).toBe('2026-04-25');
    expect(iso('25/04/2026')).toBe('2026-04-25'); // 25 can't be a month
    expect(iso('04/25/2026')).toBe('2026-04-25'); // 25 can't be a month
    expect(iso('04/04/2026')).toBe('2026-04-04'); // same either way
    expect(iso('04/05/2026')).toBeNull();          // April or May — refuse to guess
  });

  it('understands today/yesterday (and Spanish)', () => {
    expect(iso('today')).toBe('2026-07-04');
    expect(iso('hoy')).toBe('2026-07-04');
    expect(iso('yesterday')).toBe('2026-07-03');
  });

  it('rejects impossible dates and junk', () => {
    expect(iso('2026-02-30')).toBeNull();
    expect(iso('2026-13-01')).toBeNull();
    expect(iso('soon')).toBeNull();
    expect(iso('')).toBeNull();
  });

  it('returns a human label for the confirmation preview', () => {
    expect(normalizeDateInput('2026-April-25', TODAY)?.label).toContain('25 Apr 2026');
  });
});
