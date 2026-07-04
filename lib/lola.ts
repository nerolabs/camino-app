/**
 * Client helper for the server-side Lola/Anthropic proxy (`app/api/lola+api.ts`).
 *
 * Replaces the old client-side `@anthropic-ai/sdk` calls so no API key ships to the
 * browser. On web the request is same-origin (relative URL). For native builds later,
 * set EXPO_PUBLIC_API_URL to the deployed origin so the relative path resolves.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

// A stuck request must never become a stuck spinner (build-28 family finding: 30+s of
// spinner mid-interview). Normal turns answer in 1–4s; anything past this is dead.
const TIMEOUT_MS = 35_000;

export type LolaMessage = { role: 'user' | 'assistant'; content: string };

export async function askAnthropic(opts: {
  system?: string;
  messages: LolaMessage[];
  model?: string;
  max_tokens?: number;
}): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/lola`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(opts),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`lola proxy ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return data.text ?? '';
  } finally {
    clearTimeout(t);
  }
}
