// Normalizes the iOS status bar on App Store screenshots to the marketing convention
// (9:41, full battery) while keeping it iPhone-authentic:
//   - the REAL signal + Wi-Fi glyphs are cropped from each original and re-composited
//   - only the time and battery are redrawn, to the exact geometry measured from the
//     real status bar (time digits 40px tall centered at x=188; battery bbox 1132-1224)
// Reads docs/store-assets/*.png|PNG (1320×2868), writes to docs/store-assets/clean/.
// Run: node scripts/clean-store-shots.mjs
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'fs';
import path from 'path';

const DIR = 'docs/store-assets';
const OUT = path.join(DIR, 'clean');
const W = 1320;
const BAR_H = 165; // status-bar strip; app chrome starts ~y=200 in all five shots

// real glyph geometry, measured from the originals (scripts run on your-roadmap.PNG):
// time "16:37" x116-261 y78-117 (h40, center x≈188) · signal x964-1028 · wifi x1051-1109
// · battery x1132-1224 y74-118
const ICONS = { left: 955, top: 66, width: 160, height: 60 }; // signal + wifi, with margin

mkdirSync(OUT, { recursive: true });

function statusBarSvg(bg) {
  return `<svg width="${W}" height="${BAR_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${BAR_H}" fill="${bg}"/>
  <!-- 9:41 — digit height 40px like the real bar; centered where the real time sits -->
  <text x="188" y="117" text-anchor="middle" font-family="Helvetica Neue, Helvetica"
        font-size="56" font-weight="bold" fill="#000">9:41</text>
  <!-- full battery, drawn to the real battery's measured bbox (1132-1224 × 74-118) -->
  <rect x="1134" y="76" width="78" height="38" rx="12" stroke="#000"
        stroke-opacity="0.35" stroke-width="4" fill="none"/>
  <rect x="1141" y="83" width="64" height="24" rx="7" fill="#000"/>
  <path d="M 1217 87 q 11 8.5 0 17 z" fill="#000" fill-opacity="0.35"/>
</svg>`;
}

async function bgColorAt(file, x, y) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
}

const files = readdirSync(DIR).filter((f) => /\.png$/i.test(f));
for (const f of files) {
  const src = path.join(DIR, f);
  // sample dead-center of the status bar, away from glyphs
  const bg = await bgColorAt(src, 660, 90);
  const realIcons = await sharp(src).extract(ICONS).toBuffer();
  const out = path.join(OUT, f);
  await sharp(src)
    .composite([
      { input: Buffer.from(statusBarSvg(bg)), top: 0, left: 0 },
      { input: realIcons, top: ICONS.top, left: ICONS.left },
    ])
    .toFile(out);
  console.log(`${f}: bar repainted (${bg}), real signal/wifi kept → clean/${f}`);
}
