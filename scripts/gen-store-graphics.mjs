// Generates the Google Play store graphics from the brand system (docs/design/brand.md):
//   • play-icon-512.png     — the 512×512 app icon (full-bleed cobalt tile + azulejo star)
//   • play-feature-graphic.png — the 1024×500 feature graphic Play requires (Apple has no equivalent)
// True brand type: Fraunces (the voice) + Hanken Grotesk (the interface) are wired into fontconfig
// from node_modules so librsvg (inside sharp) renders the real faces, not a fallback serif.
// Run: node scripts/gen-store-graphics.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ── Make the brand fonts visible to librsvg via a throwaway fontconfig ──────────────
const ROOT = process.cwd();
const fcDir = join(tmpdir(), 'camino-fontconfig');
mkdirSync(join(fcDir, 'cache'), { recursive: true });
writeFileSync(join(fcDir, 'fonts.conf'),
  `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n` +
  `  <dir>${ROOT}/node_modules/@expo-google-fonts/fraunces</dir>\n` +
  `  <dir>${ROOT}/node_modules/@expo-google-fonts/hanken-grotesk</dir>\n` +
  `  <cachedir>${join(fcDir, 'cache')}</cachedir>\n</fontconfig>\n`);
process.env.FONTCONFIG_FILE = join(fcDir, 'fonts.conf');
// Import sharp AFTER the env is set so fontconfig initializes with our config.
const sharp = (await import('sharp')).default;

// ── Palette (docs/design/brand.md) ─────────────────────────────────────────────────
const COBALT = '#2B5AA3';   // Camino · primary
const INDIGO = '#15243B';   // ink — used as the gradient's deep end
const WHITE = '#FBFAF7';    // cal — whitewash / the star
const AMBER = '#BD8318';    // sherry amber — Lola / the waypoint

// 8-pointed azulejo compass-star (same construction as gen-icon.mjs).
function starPath(outer, inner, cx, cy) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const ao = (-90 + i * 45) * Math.PI / 180;
    const ai = (-90 + 22.5 + i * 45) * Math.PI / 180;
    pts.push([cx + outer * Math.cos(ao), cy + outer * Math.sin(ao)]);
    pts.push([cx + inner * Math.cos(ai), cy + inner * Math.sin(ai)]);
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L') + ' Z';
}

mkdirSync('docs/store-assets', { recursive: true });

// ── 512 app icon: full-bleed cobalt tile, star, amber waypoint (opaque — Play masks it). ──
const S = 512, c = S / 2;
const iconSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
  `<rect width="${S}" height="${S}" fill="${COBALT}"/>` +
  `<path d="${starPath(190, 79, c, c)}" fill="${WHITE}"/>` +
  `<circle cx="${c}" cy="${c}" r="35" fill="${AMBER}"/></svg>`;
await sharp(Buffer.from(iconSvg)).flatten({ background: COBALT }).png().toFile('docs/store-assets/play-icon-512.png');

// ── 1024×500 feature graphic: gradient cobalt ground, star tile left, wordmark right. ──
const W = 1024, H = 500;
const sx = 250, sy = 250; // star centre
const feature =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${COBALT}"/><stop offset="1" stop-color="${INDIGO}"/>` +
    `</linearGradient>` +
  `</defs>` +
  `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
  // faint waypoint path — three amber dots leading in toward the star (Lola's presence, subtle)
  `<g fill="${AMBER}" opacity="0.32">` +
    `<circle cx="470" cy="430" r="6"/><circle cx="520" cy="430" r="6"/><circle cx="570" cy="430" r="6"/>` +
  `</g>` +
  // the mark
  `<path d="${starPath(150, 62, sx, sy)}" fill="${WHITE}"/>` +
  `<circle cx="${sx}" cy="${sy}" r="27" fill="${AMBER}"/>` +
  // wordmark + tagline
  `<text x="468" y="240" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="84" fill="${WHITE}">Get Camino</text>` +
  `<text x="470" y="298" font-family="'Hanken Grotesk', Arial, sans-serif" font-weight="500" font-size="38" fill="${AMBER}">Your road to Spain</text>` +
  `</svg>`;
await sharp(Buffer.from(feature)).flatten({ background: COBALT }).png().toFile('docs/store-assets/play-feature-graphic.png');

console.log('Generated: docs/store-assets/play-icon-512.png (512×512), docs/store-assets/play-feature-graphic.png (1024×500)');
