/**
 * The roadmap's two LLM surfaces, extracted from app/plan.tsx:
 *  - parseProfileChange: free-text "what changed" → a typed PROFILE-FIELD delta only
 *  - askLola: the advisory per-step task coach
 * The model never authors plan items, dates, costs, or laws — the deterministic engine
 * re-derives everything from the profile (invariant 3).
 */
import { askAnthropic } from '@/lib/lola';
import i18n, { languageDirective } from '@/lib/i18n';
import { SLOTS } from '@/core/interview-controller';
import { type Objective } from '@/core/engine-controller';

// "Known-later" anchor dates the interview can't ask up front (you don't know them until you're
// in Spain), but which the engine reads to turn estimated timings into firm ones. Surfacing them
// here lets the post-move "what changed" flow set them directly (e.g. "my TIE was issued on …"),
// in addition to being auto-filled when the matching obligation is marked done (see the engine's
// ANCHOR_FROM_COMPLETION). Explicit dates always win.
const KNOWN_LATER_FIELDS: { field: string; hint: string }[] = [
  { field: 'residency_established',
    hint: 'a YYYY-MM-DD date — the day your Spanish residency was formally established (your TIE residence card issued). Setting this turns residency-timed steps (citizenship track, permanent residence, exams) from estimates into firm dates' },
  { field: 'padron_done',
    hint: 'a YYYY-MM-DD date — the day you completed your empadronamiento (padrón registration)' },
];

// Describe the editable profile fields straight from the interview catalog (plus the known-later
// anchor dates), so the re-plan extractor can never drift from the fields the engine actually reads.
function fieldGuide(): string {
  const slots = SLOTS.map(s => {
    const t = s.type === 'list' ? 'array of ISO 2-letter country codes'
            : s.type === 'bool' ? 'true or false'
            : s.type === 'date' ? 'a YYYY-MM-DD date'
            : s.options ? `one of: ${s.options.join(' | ')}`
            : 'a string';
    return `- ${s.field}: ${t} — ${s.prompt_hint}`;
  });
  const known = KNOWN_LATER_FIELDS.map(k => `- ${k.field}: ${k.hint}`);
  return [...slots, ...known].join('\n');
}

// Sample text for the "Something changed?" box, keyed by the OPEN STEP's category so the example
// is relevant to what the user is looking at (a rent-vs-buy example on a visa step was jarring).
// Every sample is phrased to map cleanly onto a real profile field the extractor knows — these
// aren't just flavor, they teach the kind of sentence that actually re-plans. The strings live
// in locales/<lang>/plan.json ("coach.hints.*") so they follow the app language.
export function changeHint(obj: Objective): string {
  const key = `plan:coach.hints.${obj.category}`;
  return i18n.exists(key) ? i18n.t(key) : i18n.t('plan:coach.hints.generic');
}

// Layer 2 of the living plan: translate free text into a typed delta over PROFILE FIELDS
// ONLY. Shared by the per-step "what changed" flow and the interview's final-note
// distillation — only the situational framing differs.
async function extractChanges(
  freeText: string, situation: string,
): Promise<{ changes: Record<string, unknown> } | { error: true }> {
  try {
    const rawText = await askAnthropic({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `The user is updating their Spain relocation plan. ${situation} Translate what
they wrote into changes to these profile fields ONLY:
${fieldGuide()}

Respond with ONLY JSON: {"changes": { "<field>": <typed value>, ... }} containing just the
fields that genuinely changed. If nothing maps to a field above, return {"changes": {}}.
Appointment/booking dates for an individual step (e.g. "our consulate appointment is now in
August") are NOT profile fields — return {"changes": {}} for those; the user marks the step
done with its real date instead. Never invent fields, deadlines, costs, or laws — only set
the listed fields to typed values. The user may describe the change in ANY language (Spanish,
English, …) — the fields and typed values above are always returned exactly as specified.`,
      messages: [{ role: 'user', content: freeText }],
    });
    const raw = rawText.trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(stripped.slice(stripped.indexOf('{'), stripped.lastIndexOf('}') + 1));
    return { changes: (parsed.changes ?? {}) as Record<string, unknown> };
  } catch {
    return { error: true };
  }
}

// The per-step "Something changed?" flow: the user is looking at a specific roadmap step.
export async function parseProfileChange(
  freeText: string, objectiveTitle: string,
): Promise<{ changes: Record<string, unknown> } | { error: true }> {
  return extractChanges(freeText, `They're looking at this step:
"${objectiveTitle}". They'll describe what they did or learned.`);
}

// The interview's closing note ("anything else I should know?") often carries real profile
// facts — "the dog is coming too", "my mother joins us next year". Distill them so the note
// shapes the roadmap immediately; anything that maps to no field stays as prose in `notes`.
export async function distillFinalNote(
  freeText: string,
): Promise<{ changes: Record<string, unknown> } | { error: true }> {
  return extractChanges(freeText, `They just finished the interview and left one final,
optional free-form note ("anything else I should know?"). It may contain facts that belong
in their profile — or nothing actionable at all.`);
}

// Context-aware task coach. Lola explains HOW to accomplish a specific step and answers
// follow-ups. Advisory only — she must not invent deadlines/costs/laws beyond the step text
// (invariant 3); the engine still owns every date. This is the sheet's "living" element.
export const TASK_INTRO = 'In 2–3 short sentences, how should I approach this step? Give me a practical starting point.';

export async function askLola(
  obj: Objective, profile: Record<string, unknown>,
  history: { role: 'lola' | 'user'; text: string }[], question: string,
): Promise<string> {
  try {
    const visa = profile.visa_type ? ` The user is on the ${String(profile.visa_type)} path.` : '';
    const system = `You are Lola, a warm, practical guide helping someone move to Spain. Help them with THIS step of their plan:
"${obj.title}" (category: ${obj.category}).${visa}
Explain HOW to get it done in practice — the concrete steps, who usually handles it (often a gestor or lawyer), and what to prepare. Warm, plain, concise: 2–4 short sentences, and a short list only if it genuinely helps.
Write in plain text only — no markdown, asterisks, bold, or headers; if you list steps, use short "– " dashes.
Rules: do NOT invent specific deadlines, costs, form numbers, or legal thresholds beyond what's already stated in the step above — for exact figures or dates, tell them to confirm with a gestor or the official source. Never make a required or penalty step sound optional. You keep the map; a gestor signs the papers.${languageDirective()}`;
    const messages = [
      ...history.map(t => ({ role: (t.role === 'lola' ? 'assistant' : 'user') as 'assistant' | 'user', content: t.text })),
      { role: 'user' as const, content: question },
    ];
    return await askAnthropic({ model: 'claude-haiku-4-5-20251001', max_tokens: 280, system, messages });
  } catch {
    return i18n.t('plan:coach.error');
  }
}
