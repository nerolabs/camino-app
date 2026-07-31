// Builds captioned Google Play phone screenshots from raw Redmi captures.
// Brand cobalt background, Fraunces caption on top, the full phone shot below with
// rounded corners centred on the canvas (cobalt padding on the sides).
//
// Why this is separate from frame-store-shots.mjs (the iOS pipeline):
//   1. Play caps phone screenshots at 2:1 (longest side <= 2x shortest). A raw Redmi
//      shot is 1080x2400 = 2.22:1 and would be REJECTED — so we pad it onto a canvas
//      whose height is <= 2x its width.
//   2. Play requires 24-bit PNG with NO alpha channel — we flatten + removeAlpha.
//   3. No iOS "9:41" status-bar redraw (that clean step is iOS-only and wrong here);
//      the Android status bar is left as captured.
//
// Requires Fraunces_600SemiBold.ttf in ~/Library/Fonts.
// Reads docs/store-assets/android/raw/, writes docs/store-assets/android/framed/.
// Rename raw captures to the canonical keys below first (home.png, interview.png, …).
// Run: node scripts/frame-android-shots.mjs
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const DIR = 'docs/store-assets/android/raw';
const OUT = 'docs/store-assets/android/framed';
const COBALT = '#2B5AA3', CREAM = '#FBFAF7';
const BAND = 300;          // caption band height
const GAP = 40;            // gap between caption band and the shot
const BOTTOM = 64;         // bottom margin below the shot
const SIDE_MIN = 150;      // minimum cobalt padding on each side of the shot
const DISPLAY_MAX_W = 1080;// cap shot display width — NEVER upscale past native
const RADIUS = 40;
// Play Console's phone-screenshot spec reads "16:9 or 9:16 aspect ratio" (stricter
// than the 2:1 the general docs mention), so we target <= 16:9 (portrait 9:16 = 1.778
// tall). Padding the native 720x1600 shot to this ratio also pushes the canvas width
// past 1080px on every side — which is the "eligible for promotion" bar. Both wins.
const MAX_RATIO = 1.777;
const MIN_SIDE = 1080;     // promotion eligibility: >= 1080 px on the short side

// Canonical shot name -> caption. Same copy family as the iOS set
// (scripts/frame-store-shots.mjs). Price words stay out of captions (Apple 2.3.7
// lesson — harmless on Play but we keep one caption set honest across both stores).
const CAPTIONS = {
  'home.png': 'Moving to Spain?\nEvery step, in order.',
  'interview.png': 'Answer a few questions —\nyour roadmap builds live.',
  'roadmap.png': 'Real steps, real deadlines —\nnothing you don’t need.',
  'step-sheet.png': 'Every step explained —\nwith the official source.',
  'sample-plan.png': 'Peek at a full sample plan —\nno account needed.',
};

mkdirSync(OUT, { recursive: true });

async function captionBitmap(text, size, maxW) {
  const t = await sharp({ text: {
    text: `<span foreground="${CREAM}">${text}</span>`,
    font: `Fraunces ${size}`, rgba: true, align: 'centre', dpi: 96,
  } }).png().toBuffer();
  const meta = await sharp(t).metadata();
  return { buf: t, meta };
}

let made = 0;
for (const [file, caption] of Object.entries(CAPTIONS)) {
  const src = path.join(DIR, file);
  if (!existsSync(src)) { console.log(`skip ${file} (not in raw/)`); continue; }

  const shotMeta = await sharp(src).metadata();
  const ratio = shotMeta.height / shotMeta.width;

  // Display the shot at its native width (never upscale — source is only 720px);
  // downscale only if it's wider than DISPLAY_MAX_W. Then size the canvas so the
  // WHOLE frame stays <= MAX_RATIO by widening the cobalt side padding as needed.
  const shotW = Math.min(shotMeta.width, DISPLAY_MAX_W);
  const shotH = Math.round(shotW * ratio);
  const H = BAND + GAP + shotH + BOTTOM;
  const W = Math.max(shotW + 2 * SIDE_MIN, Math.ceil(H / MAX_RATIO), MIN_SIDE);
  const shotLeft = Math.round((W - shotW) / 2);

  // caption sized to fit
  let size = 58;
  let cap = await captionBitmap(caption, size);
  if (cap.meta.width > W - 130) {
    size = Math.floor(size * (W - 130) / cap.meta.width);
    cap = await captionBitmap(caption, size);
  }

  // rounded-corner mask for the shot
  const mask = Buffer.from(
    `<svg width="${shotW}" height="${shotH}"><rect width="${shotW}" height="${shotH}" rx="${RADIUS}" fill="#fff"/></svg>`,
  );
  const shot = await sharp(src)
    .resize(shotW, shotH)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png().toBuffer();

  const border = Buffer.from(
    `<svg width="${W}" height="${H}"><rect x="${shotLeft + 1.5}" y="${BAND + GAP + 1.5}" width="${shotW - 3}" height="${shotH - 3}" rx="${RADIUS}" fill="none" stroke="${CREAM}" stroke-opacity="0.3" stroke-width="3"/></svg>`,
  );

  await sharp({ create: { width: W, height: H, channels: 4, background: COBALT } })
    .composite([
      { input: cap.buf, top: Math.round((BAND - cap.meta.height) / 2) + 20, left: Math.round((W - cap.meta.width) / 2) },
      { input: shot, top: BAND + GAP, left: shotLeft },
      { input: border, top: 0, left: 0 },
    ])
    .flatten({ background: COBALT })   // drop alpha -> 24-bit
    .removeAlpha()
    .png()
    .toFile(path.join(OUT, file));
  made++;
  console.log(`${file}: ${W}x${H} (ratio ${(H / W).toFixed(3)}:1), shot ${shotW}x${shotH}, caption ${size}pt`);
}
console.log(made ? `\n${made} framed → ${OUT}/` : `\nNo raw shots found. Drop PNGs in ${DIR}/ named: ${Object.keys(CAPTIONS).join(', ')}`);
