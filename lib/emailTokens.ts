/**
 * Signed one-click unsubscribe tokens: HMAC-SHA256(user_id) keyed by CRON_SECRET.
 * Lets the unsubscribe link work from any mail client with no session — the signature
 * proves the link came from an email we sent. Web Crypto only (Workers + Node ≥18 + vitest).
 */

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function signUnsubToken(secret: string, userId: string): Promise<string> {
  return hmacHex(secret, `unsub:${userId}`);
}

export async function verifyUnsubToken(secret: string, userId: string, sig: string): Promise<boolean> {
  const expected = await signUnsubToken(secret, userId);
  if (expected.length !== sig.length) return false;
  // Constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
