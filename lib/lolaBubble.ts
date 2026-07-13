/**
 * Split a Lola interview bubble into its preamble and trailing question.
 *
 * Bubbles are assembled as `${preamble}\n\n${question}` (app/interview.tsx start / handleSend /
 * final-note flows). The UI renders the question emphasized so a skimmer's eye lands on what's
 * actually being asked (user request 2026-07-13). We only treat the last paragraph as a question
 * when it reads like one (ends "?", covering "¿…?" too) — so ack-only bubbles and the "done" line
 * stay plain. Pure + string-only so it's unit-testable without the RN render layer.
 */
export type LolaBubbleParts = { head: string; tail: string; tailIsQuestion: boolean };

export function splitLolaBubble(text: string): LolaBubbleParts {
  const idx = text.lastIndexOf('\n\n');
  const head = idx >= 0 ? text.slice(0, idx) : '';
  const tail = idx >= 0 ? text.slice(idx + 2) : text;
  return { head, tail, tailIsQuestion: tail.trimEnd().endsWith('?') };
}
