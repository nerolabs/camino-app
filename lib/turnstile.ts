/**
 * Client side of the C2b challenge: solve Cloudflare Turnstile once, exchange it for a
 * short-lived session token (via /api/session), cache it, and reuse it for the interview's
 * /api/lola + /api/feedback calls until it nears expiry.
 *
 * Web only. On native this is a no-op (returns null) — native rides its app-side counters as
 * before, and its session-token path is wired when the next native build ships. If Turnstile
 * isn't configured (no site key — e.g. local dev), it also returns null, and the server gate is
 * likewise off there, so nothing breaks.
 */
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (el: HTMLElement, opts: {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: () => void;
  }) => string;
  remove: (id: string) => void;
};
const getTurnstile = (): TurnstileApi | undefined =>
  (globalThis as unknown as { turnstile?: TurnstileApi }).turnstile;

let cached: { session: string; exp: number } | null = null;
let inFlight: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (getTurnstile()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('turnstile script failed to load')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Render an offscreen Managed widget and resolve with its token (usually invisible/instant).
function solveChallenge(siteKey: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const turnstile = getTurnstile();
    if (!turnstile) return reject(new Error('turnstile not available'));
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    let id: string | undefined;
    const cleanup = () => { try { if (id) turnstile.remove(id); } catch { /* ignore */ } container.remove(); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('turnstile timed out')); }, 20_000);
    id = turnstile.render(container, {
      sitekey: siteKey,
      callback: (token: string) => { clearTimeout(timeout); cleanup(); resolve(token); },
      'error-callback': () => { clearTimeout(timeout); cleanup(); reject(new Error('turnstile challenge error')); },
    });
  });
}

async function acquire(): Promise<string | null> {
  try {
    await loadScript();
    const tsToken = await solveChallenge(SITE_KEY as string);
    const res = await fetch(`${API_BASE}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: tsToken }),
    });
    if (!res.ok) return null;
    const { session } = (await res.json()) as { session?: string };
    if (!session) return null;
    const exp = Number(session.split('.')[0]) || (Date.now() + 25 * 60_000);
    cached = { session, exp };
    return session;
  } catch {
    return null; // fail soft — the server decides whether to require a session
  }
}

/**
 * A valid session token, solving the challenge on first use and caching until it nears expiry.
 * Returns null on web when Turnstile isn't configured, and always null on native.
 */
export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS !== 'web' || !SITE_KEY) return null;
  const now = Date.now();
  if (cached && cached.exp - 60_000 > now) return cached.session;
  if (inFlight) return inFlight;
  inFlight = acquire().finally(() => { inFlight = null; });
  return inFlight;
}
