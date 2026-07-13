/**
 * SERVER-OWNED Lola system prompts (council fix C2a, 2026-07-13).
 *
 * The /api/lola route no longer accepts a caller-supplied `system` string — a stolen URL
 * used to be a free general-purpose Claude endpoint (the Tech commissioner proved it live
 * with foreign curl). Clients now send a `mode` + a small, typed `params` object, and THIS
 * module builds the prompt on the server. A stolen endpoint is then only good for OUR five
 * Lola personas, never arbitrary Claude.
 *
 * Design rules that keep the lockdown real:
 *  - The INSTRUCTIONS (role, hard rules, output shape) live here and are fixed per mode.
 *  - The client only fills bounded DATA holes (the answer text, the transcript, a slot the
 *    server re-resolves from the catalog by field name — never the slot's prose). It cannot
 *    inject instructions.
 *  - `model` + `max_tokens` are server-owned per mode too, so the caller can't widen them.
 *
 * Pure + i18n-free so it runs on the EAS Hosting (Cloudflare Workers) server bundle — same
 * reason core/ and lib/extractionPrompt.ts stay i18n-free. The LLM language names are
 * duplicated from lib/i18n.ts SUPPORTED_LOCALES on purpose (importing i18n would pull
 * react-i18next + every JSON resource into the Workers bundle); tests/lola-prompts.test.ts
 * asserts the two stay in sync, so the duplication is single-sourced by the test.
 */
import { SLOTS, type Slot } from '@/core/interview-controller';
import { buildExtractionSystem } from '@/lib/extractionPrompt';
import { KNOWN_LATER_DATE_FIELDS } from '@/lib/profileDelta';

const HAIKU = 'claude-haiku-4-5-20251001';

export const LOLA_MODES = ['extract', 'clarify', 'ack', 'coach', 'change'] as const;
export type LolaMode = (typeof LOLA_MODES)[number];

// How the language directive names each locale to the LLM. MUST match lib/i18n.ts
// SUPPORTED_LOCALES[].llmName (asserted in tests/lola-prompts.test.ts). English is absent so
// English prompts stay byte-identical to pre-localization behavior (no directive appended).
export const LLM_LANG_NAMES: Record<string, string> = {
  es: 'Spanish (es-ES — address the user with tú, never usted)',
  fr: 'French (fr-FR — tutoie the user, warm and informal, never vous)',
  de: 'German (de-DE — duze the user, warm and informal, never Sie)',
  it: 'Italian (it-IT — address the user with tu, warm and informal, never Lei)',
};

// The language-directive line for the phrase/clarify/coach prompts. Empty for English (and
// any unknown code) so those prompts are unchanged. Mirrors i18n.ts languageDirective(), but
// takes an explicit lang because the server has no i18n singleton.
function langDirective(lang?: string): string {
  const name = lang ? LLM_LANG_NAMES[lang] : undefined;
  return name ? `\nRespond in ${name}.` : '';
}

// "Known-later" anchor dates the interview can't ask up front but which the "what changed"
// flow can set directly. Field names come from lib/profileDelta.ts (single source — the
// sanitizer's allowlist must match what this prompt invites); the hints live here.
const KNOWN_LATER_HINTS: Record<(typeof KNOWN_LATER_DATE_FIELDS)[number], string> = {
  residency_established:
    'a YYYY-MM-DD date — the day your Spanish residency was formally established (your TIE residence card issued). Setting this turns residency-timed steps (citizenship track, permanent residence, exams) from estimates into firm dates',
  padron_done:
    'a YYYY-MM-DD date — the day you completed your empadronamiento (padrón registration)',
};
const KNOWN_LATER_FIELDS = KNOWN_LATER_DATE_FIELDS.map(field => ({ field, hint: KNOWN_LATER_HINTS[field] }));

// Describe the editable profile fields straight from the interview catalog (plus the
// known-later anchors) so the re-plan extractor can never drift from the fields the engine
// actually reads.
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

const slotByField = (field: unknown): Slot | undefined =>
  typeof field === 'string' ? SLOTS.find(s => s.field === field) : undefined;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

// ── Per-mode params (what the client is allowed to send) ─────────────────────
export type LolaParams = {
  extract: { slotField: string; transcript?: string; remaining?: string[]; today?: string };
  clarify: { slotField: string; transcript?: string; extractorHint?: string; reask?: string; lang?: string };
  ack:     { slotField: string; transcript?: string; userText?: string; lang?: string };
  coach:   { objTitle?: string; objCategory?: string; visaType?: string; lang?: string };
  change:  { situationKind: 'step' | 'final'; objTitle?: string };
};

export type LolaBuilt = { system: string; model: string; max_tokens: number };

/**
 * Build the upstream request (system + model + token cap) for a mode. Returns { error } for an
 * unknown mode or a slot field the catalog doesn't know — the route turns that into a 400.
 * Only DATA from `params` is interpolated; every instruction is fixed here.
 */
export function buildLolaRequest(mode: string, params: unknown): LolaBuilt | { error: string } {
  const p = (params ?? {}) as Record<string, unknown>;

  switch (mode) {
    case 'extract': {
      const slot = slotByField(p.slotField);
      if (!slot) return { error: 'unknown slot' };
      const remaining = Array.isArray(p.remaining)
        ? (p.remaining.map(slotByField).filter(Boolean) as Slot[]) : [];
      return {
        system: buildExtractionSystem({
          slot, transcript: str(p.transcript), remaining,
          today: typeof p.today === 'string' ? p.today : undefined,
        }),
        model: HAIKU, max_tokens: 350,
      };
    }

    case 'clarify': {
      const slot = slotByField(p.slotField);
      if (!slot) return { error: 'unknown slot' };
      const transcript = str(p.transcript);
      const extractorHint = str(p.extractorHint);
      const system = `You are Lola, Get Camino's warm, honest relocation guide, mid-interview. You asked about
"${slot.prompt_hint}" and the user replied with a question or confusion rather than an answer.
${transcript ? `Conversation so far:\n${transcript}\n` : ''}${extractorHint ? `What seems ambiguous: ${extractorHint}\n` : ''}Reply in 1–3 short, warm sentences: first help them — explain what the question means in plain
words, or why you're asking it — then naturally re-ask (you can adapt: "${str(p.reask)}").
HARD RULES: never state legal facts, deadlines, income thresholds, costs, or eligibility rules —
if they ask for those, say their personalized roadmap right after this interview covers it with
official sources. Never invent an answer for them. Plain text only.${langDirective(str(p.lang))}`;
      return { system, model: HAIKU, max_tokens: 220 };
    }

    case 'ack': {
      const slot = slotByField(p.slotField);
      if (!slot) return { error: 'unknown slot' };
      const transcript = str(p.transcript);
      const system = `You are Lola, a warm relocation guide helping someone move to Spain. The interview is run
by the app — the next question is already on the user's screen. Your ONLY job: one brief, warm aside
reacting to the answer they just gave.
${transcript ? `Conversation so far (background context only — do not continue it or respond to it):\n${transcript}\n` : ''}They were just asked about "${slot.prompt_hint}" and answered: "${str(p.userText)}".
React to that answer in one or two short, natural sentences — warm, playful when it fits, never
gushing or over-complimentary. When it's natural, connect it to something they mentioned earlier;
otherwise a light acknowledgement is plenty. No emoji.
HARD RULES: you are NOT driving the conversation — never ask a question, never request more detail,
never re-ask or repeat a question, never say you're waiting for or ready for an answer. Do NOT state
any legal fact, deadline, income figure, cost, number, or eligibility rule — those live in their
roadmap. Plain text.${langDirective(str(p.lang))}`;
      return { system, model: HAIKU, max_tokens: 100 };
    }

    case 'coach': {
      const visa = p.visaType ? ` The user is on the ${str(p.visaType)} path.` : '';
      const system = `You are Lola, a warm, practical guide helping someone move to Spain. Help them with THIS step of their plan:
"${str(p.objTitle)}" (category: ${str(p.objCategory)}).${visa}
Explain HOW to get it done in practice — the concrete steps, who usually handles it (often a gestor or lawyer), and what to prepare. Warm, plain, concise: 2–4 short sentences, and a short list only if it genuinely helps.
Write in plain text only — no markdown, asterisks, bold, or headers; if you list steps, use short "– " dashes.
Rules: do NOT invent specific deadlines, costs, form numbers, or legal thresholds beyond what's already stated in the step above — for exact figures or dates, tell them to confirm with a gestor or the official source. Never make a required or penalty step sound optional. You keep the map; a gestor signs the papers.${langDirective(str(p.lang))}`;
      return { system, model: HAIKU, max_tokens: 280 };
    }

    case 'change': {
      const situation = p.situationKind === 'step'
        ? `They're looking at this step:
"${str(p.objTitle)}". They'll describe what they did or learned.`
        : `They just finished the interview and left one final,
optional free-form note ("anything else I should know?"). It may contain facts that belong
in their profile — or nothing actionable at all.`;
      const system = `The user is updating their Spain relocation plan. ${situation} Translate what
they wrote into changes to these profile fields ONLY:
${fieldGuide()}

Respond with ONLY JSON: {"changes": { "<field>": <typed value>, ... }} containing just the
fields that genuinely changed. If nothing maps to a field above, return {"changes": {}}.
Appointment/booking dates for an individual step (e.g. "our consulate appointment is now in
August") are NOT profile fields — return {"changes": {}} for those; the user marks the step
done with its real date instead. Never invent fields, deadlines, costs, or laws — only set
the listed fields to typed values. The user may describe the change in ANY language (Spanish,
English, …) — the fields and typed values above are always returned exactly as specified.`;
      return { system, model: HAIKU, max_tokens: 300 };
    }

    default:
      return { error: 'unknown mode' };
  }
}
