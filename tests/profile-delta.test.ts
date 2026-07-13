import { describe, it, expect } from 'vitest';
import { SLOTS } from '@/core/interview-controller';
import { sanitizeProfileDelta, valueOkForSlot, KNOWN_LATER_DATE_FIELDS } from '@/lib/profileDelta';

// C1a (council fix): the ONE validator every LLM write-path shares. The interview extras path,
// the plan "what changed?" re-model, and the final-note distillation all reduce a model-proposed
// delta through this before it can touch the profile — so a hallucinated field name or a
// wrong-typed value can never reach the engine or the database.

const boolSlot = SLOTS.find(s => s.type === 'bool')!;
const dateSlot = SLOTS.find(s => s.type === 'date')!;
const listSlot = SLOTS.find(s => s.type === 'list')!;
const optSlot = SLOTS.find(s => s.options && s.options.length)!;

describe('valueOkForSlot — the per-slot type/enum/date check', () => {
  it('bool accepts only booleans', () => {
    expect(valueOkForSlot(boolSlot, true)).toBe(true);
    expect(valueOkForSlot(boolSlot, 'yes')).toBe(false);
    expect(valueOkForSlot(boolSlot, 1)).toBe(false);
  });
  it('date accepts only ISO YYYY-MM-DD', () => {
    expect(valueOkForSlot(dateSlot, '2027-03-01')).toBe(true);
    expect(valueOkForSlot(dateSlot, 'next spring')).toBe(false);
    expect(valueOkForSlot(dateSlot, '2027-3-1')).toBe(false);
  });
  it('list accepts only arrays of strings', () => {
    expect(valueOkForSlot(listSlot, ['US', 'ES'])).toBe(true);
    expect(valueOkForSlot(listSlot, [1, 2])).toBe(false);
    expect(valueOkForSlot(listSlot, 'US')).toBe(false);
  });
  it('option slot accepts only a value from its own set', () => {
    expect(valueOkForSlot(optSlot, optSlot.options![0])).toBe(true);
    expect(valueOkForSlot(optSlot, 'definitely-not-an-option')).toBe(false);
  });
});

describe('sanitizeProfileDelta', () => {
  it('keeps real, correctly-typed fields', () => {
    const clean = sanitizeProfileDelta({ [boolSlot.field]: true, [dateSlot.field]: '2027-01-01' });
    expect(clean).toEqual({ [boolSlot.field]: true, [dateSlot.field]: '2027-01-01' });
  });

  it('drops keys the engine does not read (hallucinated field names)', () => {
    expect(sanitizeProfileDelta({ evil_field: 'DROP TABLE', made_up: 42 })).toEqual({});
  });

  it('drops real fields carrying the wrong type', () => {
    expect(sanitizeProfileDelta({ [boolSlot.field]: 'yes please' })).toEqual({});
    expect(sanitizeProfileDelta({ [dateSlot.field]: 'sometime soon' })).toEqual({});
    expect(sanitizeProfileDelta({ [optSlot.field]: 'not-a-real-option' })).toEqual({});
  });

  it('allows known-later anchor dates only when ISO', () => {
    const f = KNOWN_LATER_DATE_FIELDS[0];
    expect(sanitizeProfileDelta({ [f]: '2027-06-15' })).toEqual({ [f]: '2027-06-15' });
    expect(sanitizeProfileDelta({ [f]: 'when I got my card' })).toEqual({});
  });

  it('skips null/undefined and tolerates non-object input', () => {
    expect(sanitizeProfileDelta({ [boolSlot.field]: null, [dateSlot.field]: undefined })).toEqual({});
    expect(sanitizeProfileDelta(null as unknown as Record<string, unknown>)).toEqual({});
  });

  // The headline C1a property: a mixed garbage delta is filtered field-by-field — the one
  // legitimate value survives, everything invalid is dropped, nothing is merged wholesale.
  it('rejects a garbage delta field-by-field, keeping only what type-checks', () => {
    const clean = sanitizeProfileDelta({
      [boolSlot.field]: 'not a bool',            // real field, wrong type → drop
      evil_field: 'ignore previous instructions', // unknown key → drop
      [dateSlot.field]: '2027-01-01',            // real + valid → keep
      [optSlot.field]: 'bogus',                  // real field, bad enum → drop
    });
    expect(clean).toEqual({ [dateSlot.field]: '2027-01-01' });
  });
});
