// Cuts single game sprites out of the AI concept sheets in assets/generated.
// 1) removes the flat sheet background by flood-filling from the image border
// 2) labels connected blobs and picks the one inside the requested region
// 3) trims, pads and resizes into apps/web/public/sprites
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/generated';
const OUT = 'apps/web/public/sprites';

const BG_TOLERANCE = 34; // color distance still treated as background
const EDGE_SOFTNESS = 18; // extra distance band that becomes semi-transparent
const MIN_BLOB_RATIO = 0.004; // blobs smaller than this share of the image are sparkles/noise

/** region = fractions of the sheet [x0, y0, x1, y1]; the blob whose center falls inside wins */
const JOBS = [
  ...['bunbun', 'hamham', 'shibu'].flatMap((sp) =>
    ['pillow-guard', 'carrot-knight', 'seed-sniper', 'bubble-mage', 'mochi-cleric', 'bell-bard'].map((cls) => ({
      src: `characters/${sp}-${cls}.png`,
      out: `heroes/${sp}-${cls}.png`,
      region: [0.3, 0, 0.62, 0.42], // top-row 3/4 view, facing right
      height: 320,
      // white bunny fur is close to the sheet background, so flood fill must be stricter
      tolerance: sp === 'bunbun' ? 10 : BG_TOLERANCE,
    })),
  ),
  { src: 'enemies/flower-monster-sheet.png', out: 'enemies/daisy.png', region: [0, 0, 0.2, 0.2], height: 280, flip: true },
  { src: 'enemies/flower-monster-sheet.png', out: 'enemies/tulip.png', region: [0, 0.2, 0.2, 0.4], height: 280, flip: true },
  { src: 'enemies/flower-monster-sheet.png', out: 'enemies/sunflower.png', region: [0, 0.4, 0.2, 0.6], height: 300, flip: true },
  { src: 'enemies/flower-monster-sheet.png', out: 'enemies/lavender.png', region: [0, 0.6, 0.2, 0.8], height: 280, flip: true },
  { src: 'enemies/flower-monster-sheet.png', out: 'enemies/cactus.png', region: [0, 0.8, 0.2, 1], height: 260, flip: true },
];

/** 4-stage VFX sheets (wind-up, impact, burst, fade) → vfx/<name>-0..3.png, all frames share one box so they line up. */
const VFX_SHEETS = [
  'carrot-crescent',
  'bubble-bye-bye',
  'seed-gatling',
  'ultimate-roll',
  'mochi-rain',
  'bear-hug-festival',
  'sleepy-status',
  'sticky-status',
];
const VFX_FRAMES = 4;
const VFX_HEIGHT = 360;
const DARK_KEY = { floor: 28, ramp: 90 }; // near-black smoke becomes transparent

const COPIES = [
  { src: 'backgrounds/01-meadow-of-naps.png', out: 'bg/01-meadow-of-naps.jpg' },
  { src: 'backgrounds/04-lotus-lagoon.png', out: 'bg/04-lotus-lagoon.jpg' },
];

async function loadRgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function borderColor({ data, width, height }) {
  const samples = [];
  for (let x = 0; x < width; x += 8) samples.push((0 * width + x) * 4, ((height - 1) * width + x) * 4);
  for (let y = 0; y < height; y += 8) samples.push((y * width) * 4, (y * width + width - 1) * 4);
  const opaque = samples.filter((i) => data[i + 3] > 200);
  const pick = (c) => opaque.map((i) => data[i + c]).sort((a, b) => a - b)[opaque.length >> 1];
  return opaque.length ? [pick(0), pick(1), pick(2)] : null;
}

/** Flood fill from the border: background-colored pixels reachable from the edge become transparent. */
function removeBackground(img, tolerance = BG_TOLERANCE) {
  const { data, width, height } = img;
  const bg = borderColor(img);
  const visited = new Uint8Array(width * height);
  const stack = [];
  const dist = (p) => {
    const i = p * 4;
    if (data[i + 3] < 10) return 0;
    if (!bg) return Infinity;
    return Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  };
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length) {
    const p = stack.pop();
    if (visited[p]) continue;
    const d = dist(p);
    if (d > tolerance + EDGE_SOFTNESS) continue;
    visited[p] = 1;
    const a = d <= tolerance ? 0 : Math.round(((d - tolerance) / EDGE_SOFTNESS) * 255);
    data[p * 4 + 3] = Math.min(data[p * 4 + 3], a);
    if (d > tolerance) continue; // soft edge: stop spreading
    const x = p % width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (p >= width) stack.push(p - width);
    if (p < width * (height - 1)) stack.push(p + width);
  }
  return img;
}

/** 8-connected blobs over pixels with alpha > 40. */
function labelBlobs({ data, width, height }) {
  const labels = new Int32Array(width * height).fill(-1);
  const blobs = [];
  const stack = [];
  for (let start = 0; start < width * height; start++) {
    if (labels[start] !== -1 || data[start * 4 + 3] <= 40) continue;
    const blob = { id: blobs.length, area: 0, x0: width, y0: height, x1: 0, y1: 0, sx: 0, sy: 0 };
    stack.push(start);
    labels[start] = blob.id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % width;
      const y = (p - x) / width;
      blob.area++;
      blob.sx += x;
      blob.sy += y;
      if (x < blob.x0) blob.x0 = x;
      if (x > blob.x1) blob.x1 = x;
      if (y < blob.y0) blob.y0 = y;
      if (y > blob.y1) blob.y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const q = ny * width + nx;
          if (labels[q] === -1 && data[q * 4 + 3] > 40) {
            labels[q] = blob.id;
            stack.push(q);
          }
        }
      }
    }
    blobs.push(blob);
  }
  return { labels, blobs };
}

function pickBlob(blobs, img, region) {
  const [rx0, ry0, rx1, ry1] = region;
  const minArea = img.width * img.height * MIN_BLOB_RATIO;
  const inside = blobs.filter((b) => {
    if (b.area < minArea) return false;
    const cx = b.sx / b.area / img.width;
    const cy = b.sy / b.area / img.height;
    return cx >= rx0 && cx <= rx1 && cy >= ry0 && cy <= ry1;
  });
  return inside.sort((a, b) => b.area - a.area)[0];
}

/** Keeps the chosen blob plus small nearby blobs (sparkles, loose petals) inside its box. */
function isolate(img, labels, blobs, chosen) {
  const { data, width, height } = img;
  const pad = Math.round(Math.max(chosen.x1 - chosen.x0, chosen.y1 - chosen.y0) * 0.04);
  const box = {
    x0: Math.max(0, chosen.x0 - pad),
    y0: Math.max(0, chosen.y0 - pad),
    x1: Math.min(width - 1, chosen.x1 + pad),
    y1: Math.min(height - 1, chosen.y1 + pad),
  };
  const keep = new Set(
    blobs
      .filter((b) => b.id === chosen.id || (b.area < chosen.area * 0.02 && b.x0 >= box.x0 && b.x1 <= box.x1 && b.y0 >= box.y0 && b.y1 <= box.y1))
      .map((b) => b.id),
  );
  const out = Buffer.alloc((box.x1 - box.x0 + 1) * (box.y1 - box.y0 + 1) * 4);
  let o = 0;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const p = y * width + x;
      const visible = labels[p] === -1 ? data[p * 4 + 3] > 0 && data[p * 4 + 3] <= 40 : keep.has(labels[p]);
      data.copy(out, o, p * 4, p * 4 + 4);
      if (!visible) out[o + 3] = 0;
      o += 4;
    }
  }
  return { buffer: out, width: box.x1 - box.x0 + 1, height: box.y1 - box.y0 + 1 };
}

/** VFX sheets are already transparent and their stages touch, so cut a fixed column instead. */
async function cropRegion(job) {
  const meta = await sharp(path.join(SRC, job.src)).metadata();
  const [x0, y0, x1, y1] = job.region;
  const left = Math.round(x0 * meta.width);
  const top = Math.round(y0 * meta.height);
  // extract and trim must run as separate passes in sharp
  const column = await sharp(path.join(SRC, job.src))
    .extract({ left, top, width: Math.round(x1 * meta.width) - left, height: Math.round(y1 * meta.height) - top })
    .png()
    .toBuffer();
  const trimmed = await sharp(column).trim().png().toBuffer();
  return sharp(trimmed).resize({ height: job.height });
}

async function extract(job) {
  if (job.crop) {
    const target = path.join(OUT, job.out);
    await mkdir(path.dirname(target), { recursive: true });
    await (await cropRegion(job)).png({ compressionLevel: 9 }).toFile(target);
    return `${job.out} ← ${job.src} (column crop)`;
  }
  const img = removeBackground(await loadRgba(path.join(SRC, job.src)), job.tolerance);
  const { labels, blobs } = labelBlobs(img);
  const chosen = pickBlob(blobs, img, job.region);
  if (!chosen) throw new Error(`no sprite found in ${job.src} region ${job.region}`);
  const cut = isolate(img, labels, blobs, chosen);
  const target = path.join(OUT, job.out);
  await mkdir(path.dirname(target), { recursive: true });
  let pipeline = sharp(cut.buffer, { raw: { width: cut.width, height: cut.height, channels: 4 } }).resize({ height: job.height });
  if (job.flip) pipeline = pipeline.flop();
  await pipeline.png({ compressionLevel: 9 }).toFile(target);
  return `${job.out} ← ${job.src} (${cut.width}x${cut.height})`;
}

/** Fades out the dark smoky halo the image model painted around effects. */
function keyOutDark(data) {
  for (let i = 0; i < data.length; i += 4) {
    const peak = Math.max(data[i], data[i + 1], data[i + 2]);
    const keep = Math.min(1, Math.max(0, (peak - DARK_KEY.floor) / DARK_KEY.ramp));
    data[i + 3] = Math.round(data[i + 3] * keep);
  }
  return data;
}

/** Visible-pixel count per image column. */
function columnDensity(data, width, height) {
  const counts = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] >= 24) counts[x]++;
  }
  return counts;
}

/** Stages are not evenly spaced: cut at the emptiest column near each nominal quarter line. */
function findCuts(counts, width, frames) {
  const cuts = [0];
  const window = Math.round((width / frames) * 0.3);
  for (let i = 1; i < frames; i++) {
    const nominal = Math.round((width * i) / frames);
    let best = nominal;
    for (let x = Math.max(1, nominal - window); x <= Math.min(width - 2, nominal + window); x++) {
      const better = counts[x] < counts[best] || (counts[x] === counts[best] && Math.abs(x - nominal) < Math.abs(best - nominal));
      if (better) best = x;
    }
    cuts.push(best);
  }
  cuts.push(width);
  return cuts;
}

function boundsIn(data, width, x0, x1, height) {
  let left = x1, top = height, right = x0, bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      if (data[(y * width + x) * 4 + 3] < 24) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function extractSheet(name) {
  const file = path.join(SRC, 'vfx', `${name}.png`);
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyOutDark(data);
  const cuts = findCuts(columnDensity(data, info.width, info.height), info.width, VFX_FRAMES);
  const boxes = [];
  for (let i = 0; i < VFX_FRAMES; i++) {
    const box = boundsIn(data, info.width, cuts[i], cuts[i + 1], info.height);
    if (!box) throw new Error(`${name}: frame ${i} is empty`);
    boxes.push(box);
  }
  // every frame goes onto the same canvas, bottom-centered, so the effect's base stays put while it animates
  const canvasW = Math.max(...boxes.map((b) => b.width));
  const canvasH = Math.max(...boxes.map((b) => b.height));
  const master = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  for (const [i, box] of boxes.entries()) {
    const target = path.join(OUT, 'vfx', `${name}-${i}.png`);
    await mkdir(path.dirname(target), { recursive: true });
    const piece = await sharp(master).extract(box).png().toBuffer();
    const framed = await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: piece, left: Math.round((canvasW - box.width) / 2), top: canvasH - box.height }])
      .png()
      .toBuffer();
    await sharp(framed).resize({ height: VFX_HEIGHT }).png({ compressionLevel: 9 }).toFile(target);
  }
  return `vfx/${name}-0..${VFX_FRAMES - 1} ← vfx/${name}.png (cuts ${cuts.join(',')}, frame ${canvasW}x${canvasH})`;
}

async function copyBackground(job) {
  const target = path.join(OUT, job.out);
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(path.join(SRC, job.src)).jpeg({ quality: 86 }).toFile(target);
  return `${job.out} ← ${job.src}`;
}

const results = await Promise.allSettled([...JOBS.map(extract), ...VFX_SHEETS.map(extractSheet), ...COPIES.map(copyBackground)]);
let failed = 0;
for (const r of results) {
  if (r.status === 'fulfilled') console.log('ok  ', r.value);
  else {
    failed++;
    console.error('FAIL', r.reason.message);
  }
}
process.exitCode = failed ? 1 : 0;
