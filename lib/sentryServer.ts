// Minimal Sentry error reporter for the API routes. They run on EAS Hosting (Cloudflare
// Workers-style runtime, Web APIs only), so the Node/Cloudflare Sentry SDKs don't fit — instead we
// POST a minimal event envelope with fetch. Same single Sentry project as web/native, tagged
// platform=server + environment, so backend issues sit alongside client ones.
//
// The DSN is only set in the deployed EAS envs, so local `expo start` reports nothing.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

function parseDsn(dsn: string) {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, '');
    if (!u.username || !projectId) return null;
    return {
      ingestUrl: `${u.protocol}//${u.host}/api/${projectId}/envelope/`,
      auth: `Sentry sentry_version=7, sentry_key=${u.username}, sentry_client=camino-api/1.0`,
    };
  } catch {
    return null;
  }
}

const target = DSN ? parseDsn(DSN) : null;

type ErrCtx = { route?: string; method?: string; extra?: Record<string, unknown> };

// Fire-and-await: callers should `await` this in their catch so the fetch completes before the
// Worker isolate is frozen. It never throws — monitoring must not break the request.
export async function captureServerError(err: unknown, ctx?: ErrCtx): Promise<void> {
  if (!target) return;
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    const eventId = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, '');
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: 'node',
      level: 'error',
      environment: (process.env.EXPO_PUBLIC_ENV ?? 'staging').toLowerCase(),
      transaction: ctx?.route,
      tags: { platform: 'server', route: ctx?.route ?? 'unknown' },
      exception: { values: [{ type: e.name, value: e.message }] },
      extra: { stack: e.stack, method: ctx?.method, ...(ctx?.extra ?? {}) },
    };
    const body =
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: DSN }) + '\n' +
      JSON.stringify({ type: 'event' }) + '\n' +
      JSON.stringify(event) + '\n';
    await fetch(target.ingestUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-sentry-envelope', 'X-Sentry-Auth': target.auth },
      body,
    });
  } catch {
    /* swallow — never break the request over telemetry */
  }
}
