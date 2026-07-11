// Builds captioned App Store screenshots (1320×2868) from the status-bar-cleaned shots:
// cobalt brand background, Fraunces caption on top, the screenshot below with rounded
// corners bleeding off the bottom (share-card geometry language).
// Requires Fraunces_600SemiBold.ttf installed in ~/Library/Fonts (the text renderer only
// sees installed fonts). Reads docs/store-assets/clean/, writes docs/store-assets/framed/.
// Run: node scripts/clean-store-shots.mjs && node scripts/frame-store-shots.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';

const DIR = 'docs/store-assets/clean';
const OUT = 'docs/store-assets/framed';
const W = 1320, H = 2868;
const COBALT = '#2B5AA3', CREAM = '#FBFAF7';
const BAND = 430;          // caption band height
const SHOT_W = 1148;       // screenshot width on the canvas (bleeds off the bottom)
const RADIUS = 44;

const CAPTIONS = {
  'home-page-mobile.PNG': 'Moving to Spain?\nEvery step, in order.',
  'interview-screen-mid-point.PNG': 'Answer a few questions —\nyour roadmap builds live.',
  'your-roadmap.PNG': 'Real steps, real deadlines —\nnothing you don’t need.',
  'task-drawer-card.png': 'Every step explained —\nwith the official source.',
  'sample-plan.PNG': 'Peek at a full sample plan —\nfree, no account needed.',
};

mkdirSync(OUT, { recursive: true });

async function captionBitmap(text, size) {
  const t = await sharp({ text: {
    text: `<span foreground="${CREAM}">${text}</span>`,
    font: `Fraunces ${size}`, rgba: true, align: 'centre', dpi: 96,
  } }).png().toBuffer();
  return { buf: t, meta: await sharp(t).metadata() };
}

for (const [file, caption] of Object.entries(CAPTIONS)) {
  // caption sized to fit ≤1160 wide
  let size = 58;
  let cap = await captionBitmap(caption, size);
  if (cap.meta.width > 1160) {
    size = Math.floor(size * 1160 / cap.meta.width);
    cap = await captionBitmap(caption, size);
  }

  // screenshot: resize, round the corners via an alpha mask
  const shotH = Math.round(H / W * SHOT_W); // preserve 1320:2868 ratio
  const mask = Buffer.from(
    `<svg width="${SHOT_W}" height="${shotH}"><rect width="${SHOT_W}" height="${shotH}" rx="${RADIUS}" fill="#fff"/></svg>`,
  );
  const shot = await sharp(path.join(DIR, file))
    .resize(SHOT_W, shotH)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png().toBuffer();

  const border = Buffer.from(
    `<svg width="${W}" height="${H}"><rect x="${(W - SHOT_W) / 2 + 1.5}" y="${BAND + 1.5}" width="${SHOT_W - 3}" height="${shotH}" rx="${RADIUS}" fill="none" stroke="${CREAM}" stroke-opacity="0.3" stroke-width="3"/></svg>`,
  );

  await sharp({ create: { width: W, height: H, channels: 4, background: COBALT } })
    .composite([
      { input: cap.buf, top: Math.round((BAND - cap.meta.height) / 2) + 14, left: Math.round((W - cap.meta.width) / 2) },
      { input: shot, top: BAND, left: (W - SHOT_W) / 2 },
      { input: border, top: 0, left: 0 },
    ])
    .flatten({ background: COBALT })
    .png()
    .toFile(path.join(OUT, file));
  console.log(`${file}: framed ("${caption.replace('\n', ' / ')}", ${size}pt)`);
}
