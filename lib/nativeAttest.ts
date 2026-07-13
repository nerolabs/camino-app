/**
 * Web stub for the native App Attest session (C2b). Metro resolves lib/nativeAttest.native.ts on
 * iOS/Android; on web there's no App Attest, so this returns null and the Turnstile path is used.
 */
export async function getNativeSession(): Promise<string | null> {
  return null;
}
