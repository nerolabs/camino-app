/**
 * Deterministic handling for a QUESTION left in the interview's free text (council fix C1c).
 *
 * The final "anything else I should know?" note is not a Q&A channel with Lola, but people use it
 * to ask exactly the highest-stakes things — "will my overstay be a problem?", "does my DUI
 * disqualify me?", "do I need to declare a health condition?". The live finding was that these
 * were silently absorbed. Now a question there gets an honest can't-assess handoff instead of a
 * bare acknowledgement, plus a pointer to the guide that actually covers the topic when one maps.
 *
 * Pure + i18n-free — the interview layer maps the result to localized copy.
 */

// Interrogative openers across the five locales, as a backstop to the ?/¿ check (people don't
// always punctuate). Matched only at the very start of the (trimmed, lowercased) text.
const INTERROGATIVE_OPENERS = [
  // en
  'what', 'why', 'how', 'can', 'could', 'will', 'would', 'should', 'do', 'does', 'did',
  'is', 'are', 'am', 'if', 'when', 'whether',
  // es
  'qué', 'que', 'por qué', 'cómo', 'como', 'puedo', 'puedes', 'debo', 'debería', 'sería',
  'es', 'son', 'si', 'cuándo', 'cuando',
  // fr
  'pourquoi', 'comment', 'puis-je', 'dois-je', 'est-ce', 'faut-il', 'quand', 'quel', 'quelle',
  // de
  'was', 'warum', 'wieso', 'wie', 'kann', 'könnte', 'soll', 'sollte', 'muss', 'ist', 'sind',
  'ob', 'wann', 'wenn',
  // it
  'perché', 'perche', 'come', 'posso', 'devo', 'dovrei', 'è', 'sono', 'se', 'quando', 'quale',
];

/** Deterministic: does this free text read as a question? (`?`/`¿`, or an interrogative opener.) */
export function isQuestion(text: string): boolean {
  if (!text) return false;
  if (/[?¿]/.test(text)) return true;
  const t = text.trim().toLowerCase();
  return INTERROGATIVE_OPENERS.some(w => t === w || t.startsWith(w + ' '));
}

// Stakes topics → the guide that actually covers them. Only mappings we have a real guide for;
// topics without one (overstay, health) still get the honest handoff, just no guide pointer.
const STAKES_GUIDES: { id: string; re: RegExp }[] = [
  {
    id: 'criminal-background-check',
    re: /\b(dui|dwi|criminal|convict\w*|felon\w*|misdemean\w*|arrest\w*|criminal[- ]?record|background[- ]?check|antecedentes\s+penales|casier\s+judiciaire|vorstraf\w*|vorbestraft|precedenti\s+penali|cond(?:e|a|amn|ann)\w*)\b/i,
  },
];

/** The guide id whose topic this text touches, or null. */
export function stakesGuideId(text: string): string | null {
  if (!text) return null;
  for (const g of STAKES_GUIDES) if (g.re.test(text)) return g.id;
  return null;
}
