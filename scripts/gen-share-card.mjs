// Generates the social share card (Open Graph / Twitter, 1200×630) from the same brand
// mark as the app icons: azulejo compass-star tile + wordmark + promise, on cal.
// Output: public/og-card.png (served at getcamino.app/og-card.png).
// Run: node scripts/gen-share-card.mjs   (fonts render from this machine's system fonts)
import sharp from 'sharp';

const COBALT = '#2B5AA3', WHITE = '#FBFAF7', AMBER = '#BD8318', INDIGO = '#15243B', MUTED = '#5B6B80';
const W = 1200, H = 630;

// 8-pointed star (same geometry as gen-icon.mjs), centered at (cx, cy).
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

const tile = { x: 92, y: 155, size: 320 };
const tc = { x: tile.x + tile.size / 2, y: tile.y + tile.size / 2 };

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${WHITE}"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${COBALT}"/>
  <rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}" rx="68" fill="${COBALT}"/>
  <path d="${starPath(118, 49, tc.x, tc.y)}" fill="${WHITE}"/>
  <circle cx="${tc.x}" cy="${tc.y}" r="22" fill="${AMBER}"/>
  <text x="490" y="255" font-family="Georgia, 'Times New Roman', serif" font-weight="600" font-size="104" fill="${INDIGO}">Camino</text>
  <text x="494" y="330" font-family="Helvetica, Arial, sans-serif" font-size="40" fill="${INDIGO}">Your personalized roadmap</text>
  <text x="494" y="384" font-family="Helvetica, Arial, sans-serif" font-size="40" fill="${INDIGO}">for moving to Spain.</text>
  <text x="494" y="452" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="${MUTED}">Every step in the right order — each one backed</text>
  <text x="494" y="490" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="${MUTED}">by its official source.</text>
  <text x="494" y="560" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="28" fill="${COBALT}">getcamino.app · free</text>
</svg>`;

await sharp(Buffer.from(svg)).flatten({ background: WHITE }).png().toFile('public/og-card.png');

// Square logo for schema.org Organization (512×512): the icon tile, publicly served.
const L = 512, lc = L / 2;
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}" viewBox="0 0 ${L} ${L}">
  <rect width="${L}" height="${L}" rx="108" fill="${COBALT}"/>
  <path d="${starPath(190, 79, lc, lc)}" fill="${WHITE}"/>
  <circle cx="${lc}" cy="${lc}" r="35" fill="${AMBER}"/>
</svg>`;
await sharp(Buffer.from(logoSvg)).png().toFile('public/logo.png');
console.log('Generated public/og-card.png (1200×630) + public/logo.png (512×512)');
