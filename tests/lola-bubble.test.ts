import { describe, it, expect } from 'vitest';
import { splitLolaBubble } from '@/lib/lolaBubble';

// The interview bolds ONLY the final question sentence so skimmers cut to the chase (2026-07-13).
// These pin that against the real bubble shapes: context+question in one flow, a helper clause
// AFTER the question, a colon-led opener, Spanish "¿…?", and the no-question (ack) case.

describe('splitLolaBubble', () => {
  it('bolds only the question, not the context that precedes it', () => {
    const r = splitLolaBubble(
      "You can get by in English at first, but real life in Spain runs on Spanish — so it helps to know your starting point. Where's your Spanish right now?",
    );
    expect(r.question).toBe("Where's your Spanish right now?");
    expect(r.pre).toBe('You can get by in English at first, but real life in Spain runs on Spanish — so it helps to know your starting point. ');
    expect(r.post).toBe('');
  });

  it('bolds only the question when context leads (passports example)', () => {
    const r = splitLolaBubble(
      'Your passports set the route — visas, registrations, even citizenship timelines hang on them. What passports does everyone in your household hold?',
    );
    expect(r.question).toBe('What passports does everyone in your household hold?');
  });

  it('handles a colon-led opener AND a helper clause after the question (real Q1 copy)', () => {
    const r = splitLolaBubble(
      "Let's start with the most important question: when are you planning to arrive? A rough month is all I need — it anchors every deadline on your roadmap.",
    );
    expect(r.question).toBe('when are you planning to arrive?');
    expect(r.pre).toBe("Let's start with the most important question: ");
    expect(r.post).toBe(' A rough month is all I need — it anchors every deadline on your roadmap.');
  });

  it('keeps the greeting + AI disclosure out of the bold (opening bubble)', () => {
    const greeting = "Hola, I'm Lola, an AI assistant. This is helpful guidance, not legal advice.";
    const r = splitLolaBubble(`${greeting}\n\nLet's start: when are you planning to arrive? A rough month is fine.`);
    expect(r.question).toBe('when are you planning to arrive?');
    expect(r.pre.startsWith("Hola, I'm Lola")).toBe(true);
  });

  it('emphasizes a Spanish ¿…? question and starts at the inverted opener', () => {
    const r = splitLolaBubble('Perfecto, ya casi está. ¿Dónde está tu español ahora?');
    expect(r.question).toBe('¿Dónde está tu español ahora?');
  });

  it('bolds the whole thing when the bubble is only a question', () => {
    const r = splitLolaBubble('When are you planning to arrive?');
    expect(r.pre).toBe('');
    expect(r.question).toBe('When are you planning to arrive?');
    expect(r.post).toBe('');
  });

  it('emphasizes nothing when there is no question (ack-only / statement)', () => {
    expect(splitLolaBubble('Thanks — noted.').question).toBe('');
    expect(splitLolaBubble('Got it.\n\nYour roadmap is ready.').question).toBe('');
  });

  it('picks the LAST question when several sentences end in "?"', () => {
    const r = splitLolaBubble('Moving with kids? Wonderful. How many are coming with you?');
    expect(r.question).toBe('How many are coming with you?');
  });
});
