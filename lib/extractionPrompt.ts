/**
 * The interview's extraction prompt + response parsing, as a PURE module.
 *
 * Lives outside app/interview.tsx so the API contract tests can exercise the EXACT prompt the
 * app sends (tests/api.contract.test.ts — the localization gate proves a Spanish answer extracts
 * to the same English slugs). If you change the prompt here, the test exercises the change too;
 * there is no copy to drift.
 */
import type { Slot } from '@/core/interview-controller';

export type Extraction =
  | { value: unknown; extras?: Record<string, unknown> }
  | { clarify: string };

export function buildExtractionSystem(opts: {
  slot: Slot;
  transcript?: string;
  remaining?: Slot[];
  today?: string; // ISO date; defaults to the real today
}): string {
  const { slot, transcript = '', remaining = [] } = opts;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  const typeInstructions =
    slot.field === 'nationalities'
      ? 'Return an array of ISO 2-letter country codes. Map country names and nationalities to codes (e.g. "American" or "United States" → "US", "Spanish" or "Spain" → "ES", "British" → "GB", "Colombian" → "CO", "Japanese" → "JP"). Include ALL nationalities mentioned.'
      : slot.type === 'bool'
      ? 'Return true if yes/affirmative, false if no/negative. Be generous — "we do drive", "yes we have kids", "currently in the US" etc. are true.'
      : slot.type === 'date'
      ? `Return an ISO date string "YYYY-MM-DD". Today is ${today}; resolve relative phrases against it. BE GENEROUS — any timeframe at all resolves to a concrete date, never a clarification: "September" → the 1st of that September; "next spring" → March 1 of that year; "next year" → January 1 of next year; "in about 3 months" → today + 3 months; "sometime in 2027" → 2027-01-01; "end of the year" → December 1. An approximate anchor beats re-asking. Only if they say they genuinely don't know ("not sure", "no idea yet") return {"value": null}.`
      : slot.options
      ? `Return the single most appropriate option string exactly as written from this list: ${slot.options.join(', ')}. Infer from context — e.g. "I work remotely for a US company" → "employed_remote", "I\'m self-employed" → "self_employed", "we live off investments" → "passive_income".`
      : 'Return the value as a string.';

  const remainingGuide = remaining.map(s => {
    const t = s.type === 'list' ? 'array of ISO 2-letter country codes'
            : s.type === 'bool' ? 'boolean'
            : s.type === 'date' ? 'YYYY-MM-DD string'
            : s.options ? `one of: ${s.options.join(' | ')}`
            : 'string';
    return `- ${s.field} (${t}): ${s.prompt_hint}`;
  }).join('\n');

  return `You are extracting a structured value from a user's natural-language answer.
${transcript ? `Conversation so far — use it to resolve references and avoid clarifying things already established:
${transcript}

` : ''}Field: "${slot.field}" (type: ${slot.type})
${typeInstructions}
Respond ONLY with valid JSON in one of these two shapes — nothing else:
  {"value": <typed value>, "extras": {"<other_field>": <typed value>, ...}}
  {"clarify": "<one short question if genuinely ambiguous>"}
Do not add explanation. Lean on the conversation above: if an earlier answer already implies this value (e.g. they mentioned "my wife", so they are married), infer it and return {"value": ...} rather than clarifying.

"extras" — OPTIONAL, for skipping questions the user has already answered in passing. These other
fields are still unanswered:
${remainingGuide || '(none)'}
Include a field in "extras" ONLY when the user has clearly and explicitly provided it somewhere in
the conversation (e.g. "just me and my wife" → has_spouse_or_partner: true, partner_is_married: true,
has_children: false only if they said it's JUST the two of them; "just me" alone → has_spouse_or_partner: false,
has_children: false). Never guess from vibes — omit anything not actually stated. Omit "extras"
entirely when nothing qualifies.`;
}

/** Parse the model's reply exactly the way the interview does (fence-strip + brace-slice). */
export function parseExtraction(rawText: string): Extraction {
  try {
    const raw = rawText.trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return { clarify: "I didn't quite catch that — could you try again?" };
  }
}
