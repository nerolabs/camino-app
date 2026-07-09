/**
 * Anonymous interview draft (interview redesign, Phase 0 — see docs/INTERVIEW-REDESIGN.md).
 * Locks the save/load/clear contract that lets anonymous users resume without a DB.
 */
import { describe, it, expect } from 'vitest';
import { saveDraft, loadDraft, clearDraft, type SyncStorage } from '../lib/interviewDraft';

function fakeStorage(): SyncStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: k => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: k => { map.delete(k); },
  };
}

describe('interview draft', () => {
  it('round-trips answers and records completeness + lastSlotField', () => {
    const s = fakeStorage();
    saveDraft({ nationalities: ['US'], work_situation: 'retired' }, 'work_situation', s);

    const d = loadDraft(s);
    expect(d).not.toBeNull();
    expect(d!.answers).toEqual({ nationalities: ['US'], work_situation: 'retired' });
    expect(d!.lastSlotField).toBe('work_situation');
    expect(d!.completeness).toBeGreaterThan(0);
    expect(d!.completeness).toBeLessThanOrEqual(1);
    expect(typeof d!.updatedAt).toBe('number');
  });

  it('persists only real slot answers (drops derived + stray fields)', () => {
    const s = fakeStorage();
    // is_eu / visa_type are derived; `garbage` is not a slot — none should be stored.
    saveDraft({ nationalities: ['ES'], is_eu: true, visa_type: 'eu_citizen', garbage: 1 }, null, s);

    const d = loadDraft(s)!;
    expect(d.answers).toEqual({ nationalities: ['ES'] });
    expect('is_eu' in d.answers).toBe(false);
    expect('garbage' in d.answers).toBe(false);
  });

  it('returns null for no draft, empty answers, or corrupt JSON', () => {
    const s = fakeStorage();
    expect(loadDraft(s)).toBeNull();               // nothing saved

    saveDraft({}, null, s);                          // nothing worth resuming
    expect(loadDraft(s)).toBeNull();

    s.map.set('camino.interview.draft.v1', '{not json');
    expect(loadDraft(s)).toBeNull();               // corrupt
  });

  it('clearDraft removes the draft (e.g. after completion or sign-in)', () => {
    const s = fakeStorage();
    saveDraft({ nationalities: ['US'] }, null, s);
    expect(loadDraft(s)).not.toBeNull();
    clearDraft(s);
    expect(loadDraft(s)).toBeNull();
  });

  it('no-ops safely when storage is unavailable (null)', () => {
    expect(() => saveDraft({ nationalities: ['US'] }, null, null)).not.toThrow();
    expect(loadDraft(null)).toBeNull();
    expect(() => clearDraft(null)).not.toThrow();
  });
});
