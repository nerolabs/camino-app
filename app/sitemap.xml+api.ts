/**
 * GET /sitemap.xml — generated from the catalog so it can never drift from the real
 * guide pages. Only public, indexable routes belong here (never /how-i-was-built —
 * that stays robots-disallowed, and /plan and /interview are app surfaces, not content).
 */
import { CATALOG } from '@/core/engine-controller';
import { siteOrigin } from '@/lib/serverEmail';

export function GET(request: Request): Response {
  const base = siteOrigin(request);
  const urls = [
    '/', '/how-it-works', '/sample-plan', '/guide',
    ...CATALOG.map(o => `/guide/${o.id}`),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
