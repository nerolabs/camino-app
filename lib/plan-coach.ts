/**
 * The roadmap's two LLM surfaces, extracted from app/plan.tsx:
 *  - parseProfileChange: free-text "what changed" → a typed PROFILE-FIELD delta only
 *  - askLola: the advisory per-step task coach
 * The model never authors plan items, dates, costs, or laws — the deterministic engine
 * re-derives everything from the profile (invariant 3).
 */
import { askAnthropic } from '@/lib/lola';
import i18n, { currentLang } from '@/lib/i18n';
import { type Objective } from '@/core/engine-controller';

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
  freeText: string, params: { situationKind: 'step' | 'final'; objTitle?: string },
): Promise<{ changes: Record<string, unknown> } | { error: true }> {
  try {
    const rawText = await askAnthropic({
      mode: 'change',
      params,
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
  return extractChanges(freeText, { situationKind: 'step', objTitle: objectiveTitle });
}

// The interview's closing note ("anything else I should know?") often carries real profile
// facts — "the dog is coming too", "my mother joins us next year". Distill them so the note
// shapes the roadmap immediately; anything that maps to no field stays as prose in `notes`.
export async function distillFinalNote(
  freeText: string,
): Promise<{ changes: Record<string, unknown> } | { error: true }> {
  return extractChanges(freeText, { situationKind: 'final' });
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
    const messages = [
      ...history.map(t => ({ role: (t.role === 'lola' ? 'assistant' : 'user') as 'assistant' | 'user', content: t.text })),
      { role: 'user' as const, content: question },
    ];
    return await askAnthropic({
      mode: 'coach',
      params: {
        objTitle: obj.title, objCategory: obj.category,
        visaType: profile.visa_type ? String(profile.visa_type) : undefined,
        lang: currentLang(),
      },
      messages,
    });
  } catch {
    return i18n.t('plan:coach.error');
  }
}
