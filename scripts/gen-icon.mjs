// Generates the full Camino app-icon set from the brand mark ("one star, two hosts",
// docs/design/brand.md): a white 8-pointed azulejo compass-star on a cobalt rounded-square tile
// with an amber waypoint dot. Renders every PNG Expo needs. Run: node scripts/gen-icon.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const COBALT = '#2B5AA3';   // tile / primary
const WHITE = '#FBFAF7';    // cal — the star (whitewash)
const AMBER = '#BD8318';    // sherry amber — Lola / the waypoint
const S = 1024, c = S / 2;

// 8-pointed star: outer points (cardinals + diagonals, N up) alternating with inner valleys.
function starPath(outer, inner, cx = c, cy = c) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const ao = (-90 + i * 45) * Math.PI / 180;
    const ai = (-90 + 22.5 + i * 45) * Math.PI / 180;
    pts.push([cx + outer * Math.cos(ao), cy + outer * Math.sin(ao)]);
    pts.push([cx + inner * Math.cos(ai), cy + inner * Math.sin(ai)]);
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L') + ' Z';
}
const mark = (o, i, dot) =>
  `<path d="${starPath(o, i)}" fill="${WHITE}"/><circle cx="${c}" cy="${c}" r="${dot}" fill="${AMBER}"/>`;
const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${inner}</svg>`;

const svgs = {
  // iOS + store icon: full-bleed cobalt tile (the OS rounds corners), star, waypoint dot.
  icon: wrap(`<rect width="${S}" height="${S}" fill="${COBALT}"/>${mark(380, 158, 70)}`),
  // Android adaptive foreground: star only, on transparent, sized inside the 66% safe zone.
  'android-icon-foreground': wrap(mark(280, 116, 52)),
  // Android adaptive background: solid cobalt (matches iOS).
  'android-icon-background': wrap(`<rect width="${S}" height="${S}" fill="${COBALT}"/>`),
  // Android themed (monochrome): solid star silhouette; the system tints it.
  'android-icon-monochrome': wrap(`<path d="${starPath(280, 116)}" fill="#ffffff"/>`),
  // Splash: a padded cobalt tile centred on transparent (shows on the cream splash ground).
  'splash-icon': wrap(
    `<rect x="162" y="162" width="700" height="700" rx="150" fill="${COBALT}"/>` +
    `<path d="${starPath(260, 108)}" fill="${WHITE}"/><circle cx="${c}" cy="${c}" r="48" fill="${AMBER}"/>`
  ),
};

mkdirSync('assets/images', { recursive: true });
mkdirSync('docs/design', { recursive: true });

for (const [name, svg] of Object.entries(svgs)) {
  let img = sharp(Buffer.from(svg));
  // The iOS/store icon must have NO alpha channel (Apple rejects transparent icons). Full-bleed
  // ones are flattened opaque; the adaptive foreground/monochrome/splash keep transparency.
  if (name === 'icon') img = img.flatten({ background: COBALT });
  await img.png().toFile(`assets/images/${name}.png`);
}
// Web favicon (small, opaque) + committed source SVG + review preview.
await sharp(Buffer.from(svgs.icon)).resize(48, 48).flatten({ background: COBALT }).png()
  .toFile('assets/images/favicon.png');
writeFileSync('assets/images/icon-source.svg', svgs.icon);
await sharp(Buffer.from(svgs.icon)).png().toFile('docs/design/icon-preview.png');

console.log('Generated:', Object.keys(svgs).map((n) => n + '.png').join(', '), '+ favicon.png');
