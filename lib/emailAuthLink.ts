/**
 * Per-recipient magic links for outbound emails (user finding 2026-07-10: email links assumed a
 * signed-in browser — a recipient on a fresh device landed on an empty, signed-out page).
 *
 * Pattern: Supabase token_hash, exchanged on OUR /auth/confirm page behind a human click — the
 * raw action_link never goes in the email, because corporate mail scanners prefetch links and
 * consume one-time tokens. The page validates `next` (same-origin path) and falls back to the
 * email-code sign-in when a token has expired or was already used.
 *
 * Best-effort by design: if link generation fails for any reason, the email ships with the plain
 * URL (today's behavior) rather than not shipping at all.
 */
type AdminClient = {
  auth: { admin: { generateLink: (args: {
    type: 'magiclink'; email: string;
  }) => Promise<{ data?: { properties?: { hashed_token?: string } | null } | null; error: unknown }> } };
};

export async function emailAuthLink(
  admin: AdminClient, email: string, origin: string, next: string,
): Promise<string> {
  const fallback = `${origin}${next}`;
  try {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) return fallback;
    return `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(next)}`;
  } catch {
    return fallback;
  }
}
