import { describe, it, expect } from 'vitest';
import { splitLolaBubble } from '@/lib/lolaBubble';

// The interview emphasizes the trailing question in Lola's bubbles (skim aid, 2026-07-13).
// These pin the split + the "only bold a real question" rule across the shapes real bubbles take.

describe('splitLolaBubble', () => {
  it('separates the preamble from the trailing question', () => {
    const r = splitLolaBubble("Perfect, that gives us a solid window.\n\nWhere's your Spanish right now?");
    expect(r.head).toBe('Perfect, that gives us a solid window.');
    expect(r.tail).toBe("Where's your Spanish right now?");
    expect(r.tailIsQuestion).toBe(true);
  });

  it('treats a single-paragraph question as the question (no preamble)', () => {
    const r = splitLolaBubble('When are you planning to arrive?');
    expect(r.head).toBe('');
    expect(r.tail).toBe('When are you planning to arrive?');
    expect(r.tailIsQuestion).toBe(true);
  });

  it('does not emphasize an ack-only bubble', () => {
    const r = splitLolaBubble('Thanks — noted.');
    expect(r.head).toBe('');
    expect(r.tailIsQuestion).toBe(false);
  });

  it('does not emphasize a preamble whose last paragraph is a statement', () => {
    const r = splitLolaBubble('Got it.\n\nYour roadmap is ready.');
    expect(r.tail).toBe('Your roadmap is ready.');
    expect(r.tailIsQuestion).toBe(false);
  });

  it('handles a Spanish ¿…? question (ends with ?)', () => {
    const r = splitLolaBubble('Perfecto.\n\n¿Dónde está tu español ahora?');
    expect(r.tail).toBe('¿Dónde está tu español ahora?');
    expect(r.tailIsQuestion).toBe(true);
  });

  it('splits on the LAST blank line when the preamble has its own paragraphs', () => {
    const r = splitLolaBubble("Hi, I'm Lola — an AI assistant.\n\nThis is guidance, not legal advice.\n\nWhen do you arrive?");
    expect(r.head).toBe("Hi, I'm Lola — an AI assistant.\n\nThis is guidance, not legal advice.");
    expect(r.tail).toBe('When do you arrive?');
    expect(r.tailIsQuestion).toBe(true);
  });
});
