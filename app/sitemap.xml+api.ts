/**
 * GET /sitemap.xml — generated from the catalog so it can never drift from the real
 * guide pages. Only public, indexable routes belong here (/plan and /interview are app
 * surfaces, not content). /how-i-was-built went public 3 Jul 2026 (user decision).
 */
import { CATALOG } from '@/core/engine-controller';
import { siteOrigin } from '@/lib/serverEmail';

export function GET(request: Request): Response {
  const base = siteOrigin(request);
  const urls = [
    '/', '/how-it-works', '/sample-plan', '/guide',
    '/how-i-was-built', '/how-i-was-built/log', '/how-i-was-built/roadmap',
    '/privacy', '/terms', '/aviso-legal',
    ...CATALOG.map(o => `/guide/${o.id}`),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
