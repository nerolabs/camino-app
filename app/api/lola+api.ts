/**
 * Server-side proxy to the Anthropic Messages API.
 *
 * The Anthropic key lives ONLY on the server (process.env.ANTHROPIC_API_KEY) and
 * never reaches the client — this replaces the old client-side SDK call that shipped
 * the key in the browser bundle. Runs on EAS Hosting (Cloudflare Workers), so it uses
 * only Web APIs (fetch), no Node modules.
 *
 * Contract: POST { system?, messages, model?, max_tokens? } -> { text }.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS_CAP = 1024;

type Message = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      system?: string; messages?: Message[]; model?: string; max_tokens?: number;
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // Misconfiguration, not a client error — the secret isn't set on the server.
      console.error('ANTHROPIC_API_KEY is not set');
      return Response.json({ error: 'server not configured' }, { status: 500 });
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model ?? DEFAULT_MODEL,
        max_tokens: Math.min(Number(body.max_tokens) || 512, MAX_TOKENS_CAP),
        ...(body.system ? { system: body.system } : {}),
        messages: body.messages,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Anthropic upstream error', res.status, detail);
      return Response.json({ error: 'upstream error' }, { status: 502 });
    }

    const data = (await res.json()) as { content?: { text?: string }[] };
    return Response.json({ text: data.content?.[0]?.text ?? '' });
  } catch (e) {
    console.error('lola route error', e);
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
