import { describe, it, expect } from 'vitest';
import { isQuestion, stakesGuideId } from '@/lib/stakesQuestion';

// C1c: a personal-case question left in the interview's free text gets an honest can't-assess
// handoff, never a bare acknowledgement. These pin the deterministic detection against the exact
// probes legal counsel ran live (overstay / disclosure / DUI / health), across the five locales.

describe('isQuestion', () => {
  it('detects the legal-counsel probes (EN)', () => {
    expect(isQuestion('Will my visa overstay from 2019 be a problem?')).toBe(true);
    expect(isQuestion('Do I have to disclose my prior deportation')).toBe(true); // no ? — opener
    expect(isQuestion('does my DUI disqualify me')).toBe(true);
    expect(isQuestion('Should I mention my heart condition?')).toBe(true);
  });

  it('detects questions in ES/FR/DE/IT', () => {
    expect(isQuestion('¿Mi condena antigua es un problema?')).toBe(true);
    expect(isQuestion('Est-ce que mon casier judiciaire pose problème ?')).toBe(true);
    expect(isQuestion('Ist meine Vorstrafe ein Problem')).toBe(true);        // opener "ist"
    expect(isQuestion('Devo dichiarare la mia condanna?')).toBe(true);
  });

  it('leaves ordinary notes (statements) alone', () => {
    expect(isQuestion('Our dog Luna is coming with us')).toBe(false);
    expect(isQuestion('We plan to move in the spring')).toBe(false);
    expect(isQuestion('')).toBe(false);
  });
});

describe('stakesGuideId', () => {
  it('maps criminal-record / DUI language to the background-check guide (multilingual)', () => {
    expect(stakesGuideId('does my DUI disqualify me?')).toBe('criminal-background-check');
    expect(stakesGuideId('I have a criminal record from years ago')).toBe('criminal-background-check');
    expect(stakesGuideId('¿mis antecedentes penales importan?')).toBe('criminal-background-check');
    expect(stakesGuideId('mon casier judiciaire pose-t-il problème ?')).toBe('criminal-background-check');
    expect(stakesGuideId('ist meine Vorstrafe ein Problem?')).toBe('criminal-background-check');
  });

  it('returns null for stakes topics we have no specific guide for (overstay/health)', () => {
    expect(stakesGuideId('will my overstay be a problem?')).toBeNull();
    expect(stakesGuideId('should I mention my heart condition?')).toBeNull();
    expect(stakesGuideId('our dog is coming too')).toBeNull();
  });
});
