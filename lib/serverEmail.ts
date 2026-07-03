/**
 * Server-side Resend sender (API routes only — Cloudflare Workers runtime, Web APIs only).
 * RESEND_API_KEY lives in the EAS environment; it never reaches a client bundle.
 * Domain getcamino.app is verified in Resend, so lola@ passes SPF/DKIM.
 */

export const EMAIL_FROM = 'Lola from Camino <lola@getcamino.app>';

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function sendEmail(mail: OutgoingEmail): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set in this environment');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(mail.headers ? { headers: mail.headers } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string };
}
