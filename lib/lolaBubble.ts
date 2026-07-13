/**
 * Locate the actual question inside a Lola interview bubble so the UI can emphasize just that.
 *
 * Bubbles arrive as free prose — usually "context. The question?" in one flow, sometimes with a
 * helper clause AFTER the question ("The question? A rough month is all I need."). A skimmer wants
 * the smallest interrogation, so we bold ONLY the final question sentence: find the last "?" and
 * walk back to the previous sentence boundary (. ! ? : or a newline). Everything before is context
 * (`pre`), everything after the "?" is trailing helper (`post`) — both rendered plain.
 *
 * `question === ''` means there's no question to emphasize (ack-only bubbles, the "done" line) —
 * render the whole thing plain. Pure + string-only so it's unit-testable without the RN layer.
 */
export type LolaBubbleParts = { pre: string; question: string; post: string };

const BOUNDARY = new Set(['.', '!', '?', ':', '\n']);

export function splitLolaBubble(text: string): LolaBubbleParts {
  const qEnd = text.lastIndexOf('?');
  if (qEnd < 0) return { pre: text, question: '', post: '' };

  // Walk back from the "?" to the end of the previous sentence — the question starts just after.
  let start = 0;
  for (let i = qEnd - 1; i >= 0; i--) {
    if (BOUNDARY.has(text[i])) { start = i + 1; break; }
  }
  while (start < qEnd && /\s/.test(text[start])) start++; // skip whitespace after the boundary

  // Spanish opens questions with "¿" — prefer it as the start when it sits inside this sentence.
  const inv = text.lastIndexOf('¿', qEnd - 1);
  if (inv >= start) start = inv;

  return { pre: text.slice(0, start), question: text.slice(start, qEnd + 1), post: text.slice(qEnd + 1) };
}
