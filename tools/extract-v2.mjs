// v2 asset pipeline: splits the generated sheets in assets/generated/{v2,vfx2} into frames,
// removes backgrounds, puts every frame of a sheet on one shared bottom-centered canvas,
// and writes apps/web/public/sprites/v2/manifest.json for the game to load.
import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/generated';
const OUT = 'apps/web/public/sprites/v2';

const ALPHA_VISIBLE = 24;
const GRAY_BG = { tolerance: 26, softness: 16 };
const DARK_KEY = { floor: 26, ramp: 85 };
const TARGET = { actor: 220, vfx: 360 }; // output content height (px) of the reference frame

/** kind: 'actor' = flat gray background; 'vfx' = black (additive) or already transparent */
const HEROES = ['bunbun-leaf-archer', 'bunbun-mochi-cleric', 'hamham-bell-bard', 'hamham-pillow-guard', 'shibu-bubble-mage', 'shibu-carrot-knight'];
const JOBS = [
  ...HEROES.map((h) => ({ src: `v2/characters/${h}-poses.png`, name: `hero/${h}`, frames: 6, kind: 'actor' })),
  { src: 'v2/characters/carrot-crescent-signature.png', name: 'sig/carrot-knight', frames: 4, kind: 'actor' },
  { src: 'v2/characters/leaf-archer-signature.png', name: 'sig/leaf-archer', frames: 4, kind: 'actor' },
  { src: 'v2/characters/bubble-mage-signature.png', name: 'sig/bubble-mage', frames: 4, kind: 'actor' },
  { src: 'v2/characters/pillow-guard-signature.png', name: 'sig/pillow-guard', frames: 4, kind: 'actor' },
  { src: 'v2/characters/mochi-cleric-signature.png', name: 'sig/mochi-cleric', frames: 4, kind: 'actor' },
  { src: 'v2/characters/bell-bard-signature.png', name: 'sig/bell-bard', frames: 4, kind: 'actor' },
  { src: 'v2/characters/hamham-cheek-cannon-signature.png', name: 'sig/cheek-cannon', frames: 2, kind: 'actor' },
  ...['daisy-dozer', 'tulip-pip', 'sunflower-spitter', 'lavender-nurse', 'cactus-cuddle', 'honey-bud'].map((e) => ({
    src: `v2/enemies/${e}-poses.png`,
    name: `enemy/${e}`,
    frames: 4,
    kind: 'actor',
  })),
  ...['queen-rafflesia', 'sunflower-colossus', 'lotus-moon-sage'].map((b) => ({ src: `v2/bosses/${b}-poses.png`, name: `boss/${b}`, frames: 6, kind: 'actor' })),
  ...Object.entries({
    'archer-arrow-trail': 1, 'archer-arrow': 1, 'archer-hit': 3, 'archer-rain': 4, 'archer-release': 1, 'archer-sky-arrow': 1,
    'archer-target-zone': 1, 'bard-aura': 1, 'bard-giant-bell': 4, 'bard-soundwave': 3, 'bonk-petals': 4, 'boss-summon': 4,
    'boss-telegraph': 1, 'boss-vine-slam': 4, 'bubble-blow': 1, 'bubble-circle': 1, 'bubble-orb': 1, 'bubble-prison-burst': 4,
    'bubble-prison': 3, 'bubble-splash': 3, 'cheek-spit-puff': 3, 'guard-bash': 3, 'guard-roll-trail': 1, 'guard-slam-ring': 4,
    'guard-taunt': 1, 'heal-pillar': 3, 'hit-blunt': 3, 'hit-crit': 3, 'holy-sky-ring': 1, 'knight-crescent-smear': 4,
    'knight-firewave': 1, 'knight-impact': 4, 'knight-leap-dust': 1, 'knight-scorch': 1, 'knight-slash-small': 3, 'mochi-orb': 1,
    'mochi-splat': 3, 'seed-bullet': 1, 'seed-pop': 3, 'seed-trail': 1, 'status-burn': 3, 'status-sleepy': 3, 'status-sticky': 3,
    'status-stun': 3,
  }).map(([n, frames]) => ({ src: `vfx2/${n}.png`, name: `vfx/${n}`, frames, kind: 'vfx' })),
];
const SKINS = ['pajama-pudding', 'sakura-festival-momo', 'pumpkin-knight-tofu', 'rainbow-ranger-usagi', 'snow-globe-kinako', 'bear-king-mimi'];
JOBS.push(...SKINS.map((k) => ({ src: `v2/items/skins/${k}-poses.png`, name: `skin/${k}`, frames: 6, kind: 'actor' })));

/** Item icons: grids of separate objects → one square 128px icon per cell (row-major order). */
const ICON_SIZE = 128;
const WEAPON_CLASSES = ['pillow-guard', 'carrot-knight', 'leaf-archer', 'bubble-mage', 'mochi-cleric', 'bell-bard'];
const ICONS = [
  ...WEAPON_CLASSES.map((c) => ({ src: `v2/items/${c}-seven-tiers.png`, name: `item/weapon-${c}`, cols: 7, rows: 1 })),
  { src: 'v2/items/headgear-eight-icons.png', name: 'item/hat', cols: 4, rows: 2 },
  { src: 'v2/items/outfits-eight-icons.png', name: 'item/outfit', cols: 4, rows: 2 },
  { src: 'v2/items/charms-eight-icons.png', name: 'item/charm', cols: 4, rows: 2 },
  { src: 'v2/items/trinkets-eight-icons.png', name: 'item/trinket', cols: 4, rows: 2 },
  { src: 'v2/items/boosters-six-icons.png', name: 'item/booster', cols: 3, rows: 2 },
  { src: 'items/rarity-frames.png', name: 'item/frame', cols: 7, rows: 1 },
  ...['carrot-excalibur', 'bottomless-cheek-pouch', 'grandmas-knitted-scarf', 'moonlit-lullaby-bell', 'sunflower-crown', 'lucky-clover-pin'].map((r) => ({
    src: `v2/items/relic-${r}.png`,
    name: `relic/${r}`,
    cols: 1,
    rows: 1,
  })),
];

const BACKGROUNDS = [
  { src: 'backgrounds/01-meadow-of-naps.png', name: 'bg/01-meadow-of-naps' },
  { src: 'v2/backgrounds/01-meadow-of-naps-boss-arena.png', name: 'bg/01-meadow-of-naps-boss' },
];

// ---------- pixel helpers ----------

function borderColor(data, w, h) {
  const px = [];
  for (let x = 0; x < w; x += 7) px.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 7) px.push(y * w, y * w + w - 1);
  const pick = (c) => px.map((p) => data[p * 4 + c]).sort((a, b) => a - b)[px.length >> 1];
  return [pick(0), pick(1), pick(2)];
}

/** Flood-fills the flat sheet background from the border and makes it transparent. */
function removeFlatBackground(data, w, h) {
  const bg = borderColor(data, w, h);
  const { tolerance, softness } = GRAY_BG;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    const i = p * 4;
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (d > tolerance + softness) continue;
    seen[p] = 1;
    data[i + 3] = d <= tolerance ? 0 : Math.round(((d - tolerance) / softness) * data[i + 3]);
    if (d > tolerance) continue;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
}

/** Near-black smoke becomes transparent (for effects painted on black). */
function keyOutDark(data) {
  for (let i = 0; i < data.length; i += 4) {
    const peak = Math.max(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.round(data[i + 3] * Math.min(1, Math.max(0, (peak - DARK_KEY.floor) / DARK_KEY.ramp)));
  }
}

function columnDensity(data, w, h) {
  const counts = new Uint32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= ALPHA_VISIBLE) counts[x]++;
  return counts;
}

/**
 * Picks frame boundaries: the widest empty column runs between content (falling back to
 * the emptiest column near each nominal cut when frames touch).
 */
function findCuts(counts, w, frames) {
  if (frames === 1) return [0, w];
  const empty = (x) => counts[x] <= 1;
  const runs = [];
  let start = -1;
  for (let x = 0; x <= w; x++) {
    if (x < w && empty(x)) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      if (start > 0 && x < w) runs.push({ start, end: x, width: x - start });
      start = -1;
    }
  }
  const chosen = runs
    .filter((r) => r.width >= 4)
    .sort((a, b) => b.width - a.width)
    .slice(0, frames - 1)
    .map((r) => Math.round((r.start + r.end) / 2))
    .sort((a, b) => a - b);
  if (chosen.length === frames - 1) return [0, ...chosen, w];
  const cuts = [0];
  const win = Math.round((w / frames) * 0.3);
  for (let i = 1; i < frames; i++) {
    const nominal = Math.round((w * i) / frames);
    let best = nominal;
    for (let x = Math.max(1, nominal - win); x <= Math.min(w - 2, nominal + win); x++) if (counts[x] < counts[best]) best = x;
    cuts.push(best);
  }
  return [...cuts, w];
}

function bounds(data, w, x0, x1, h) {
  let left = x1, top = h, right = x0 - 1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      if (data[(y * w + x) * 4 + 3] < ALPHA_VISIBLE) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  return right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

// ---------- jobs ----------

async function extract(job) {
  const { data, info } = await sharp(path.join(SRC, job.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let additive = false;
  // some sheets arrive already cut out (transparent corners): leave those alone
  if (job.kind === 'actor' && data[3] > 200) removeFlatBackground(data, w, h);
  else {
    // painted on black → glow effect (additive); pre-cut transparent sheets still carry dark smoke, so key both
    additive = data[3] > 200;
    keyOutDark(data);
  }
  const cuts = findCuts(columnDensity(data, w, h), w, job.frames);
  const boxes = [];
  for (let i = 0; i < job.frames; i++) {
    const b = bounds(data, w, cuts[i], cuts[i + 1], h);
    if (!b) throw new Error(`${job.name}: frame ${i} is empty (cuts ${cuts.join(',')})`);
    boxes.push(b);
  }
  // shared canvas, bottom-centered on each frame's own box
  const canvasW = Math.max(...boxes.map((b) => b.width));
  const canvasH = Math.max(...boxes.map((b) => b.height));
  const heights = boxes.map((b) => b.height).sort((a, b) => a - b);
  const refH = heights[heights.length >> 1]; // median content height = "body size" reference
  const scale = Math.min(1, TARGET[job.kind] / refH);
  const master = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  if (job.name.startsWith('hero/') || job.name.startsWith('skin/')) await writePortrait(master, boxes[0], job.name.replace('/', '-').replace(/^hero-/, ''));
  const dir = path.join(OUT, path.dirname(job.name));
  await mkdir(dir, { recursive: true });
  for (const [i, box] of boxes.entries()) {
    const piece = await sharp(master).extract(box).png().toBuffer();
    const framed = await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: piece, left: Math.round((canvasW - box.width) / 2), top: canvasH - box.height }])
      .png()
      .toBuffer();
    await sharp(framed)
      .resize({ width: Math.max(1, Math.round(canvasW * scale)) })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, `${job.name}-${i}.png`));
  }
  return [job.name, { frames: job.frames, width: Math.round(canvasW * scale), height: Math.round(canvasH * scale), refHeight: Math.round(refH * scale), additive }];
}

/** Square head-and-shoulders crop of the idle pose, for HUD portraits. */
async function writePortrait(master, box, hero) {
  const side = Math.min(box.width, box.height);
  const crop = { left: box.left + Math.round((box.width - side) / 2), top: box.top, width: side, height: side };
  await mkdir(path.join(OUT, 'portrait'), { recursive: true });
  await sharp(master).extract(crop).resize(160, 160).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'portrait', `${hero}.png`));
}

function rowDensity(data, w, h) {
  const counts = new Uint32Array(h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= ALPHA_VISIBLE) counts[y]++;
  return counts;
}

async function extractIcons(job) {
  const { data, info } = await sharp(path.join(SRC, job.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  if (data[3] > 200) removeFlatBackground(data, w, h);
  const rowCuts = findCuts(rowDensity(data, w, h), h, job.rows);
  const master = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  await mkdir(path.join(OUT, path.dirname(job.name)), { recursive: true });
  let index = 0;
  for (let r = 0; r < job.rows; r++) {
    const y0 = rowCuts[r];
    const y1 = rowCuts[r + 1];
    // column density within this row band only
    const counts = new Uint32Array(w);
    for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= ALPHA_VISIBLE) counts[x]++;
    const colCuts = findCuts(counts, w, job.cols);
    for (let c = 0; c < job.cols; c++) {
      let box = null;
      for (let y = y0; y < y1; y++) {
        for (let x = colCuts[c]; x < colCuts[c + 1]; x++) {
          if (data[(y * w + x) * 4 + 3] < ALPHA_VISIBLE) continue;
          box = box ? { l: Math.min(box.l, x), t: Math.min(box.t, y), r: Math.max(box.r, x), b: Math.max(box.b, y) } : { l: x, t: y, r: x, b: y };
        }
      }
      if (!box) throw new Error(`${job.name}: cell ${r},${c} is empty`);
      const piece = await sharp(master).extract({ left: box.l, top: box.t, width: box.r - box.l + 1, height: box.b - box.t + 1 }).png().toBuffer();
      const side = Math.round(Math.max(box.r - box.l, box.b - box.t) * 1.06) + 2;
      const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: piece, left: Math.round((side - (box.r - box.l + 1)) / 2), top: Math.round((side - (box.b - box.t + 1)) / 2) }])
        .png()
        .toBuffer();
      await sharp(square).resize(ICON_SIZE, ICON_SIZE).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${job.name}-${index++}.png`));
    }
  }
  return [job.name, { frames: index, width: ICON_SIZE, height: ICON_SIZE, refHeight: ICON_SIZE, additive: false }];
}

async function background(job) {
  await mkdir(path.join(OUT, 'bg'), { recursive: true });
  await sharp(path.join(SRC, job.src)).jpeg({ quality: 86 }).toFile(path.join(OUT, `${job.name}.jpg`));
}

await rm(OUT, { recursive: true, force: true });
const results = await Promise.allSettled([...JOBS.map(extract), ...ICONS.map(extractIcons)]);
const manifest = {};
let failed = 0;
for (const [i, r] of results.entries()) {
  if (r.status === 'fulfilled') {
    const [name, meta] = r.value;
    manifest[name] = meta;
  } else {
    failed++;
    console.error('FAIL', [...JOBS, ...ICONS][i].name, r.reason.message);
  }
}
await Promise.all(BACKGROUNDS.map(background));
await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`extracted ${Object.keys(manifest).length}/${JOBS.length + ICONS.length} sheets, ${BACKGROUNDS.length} backgrounds`);
process.exitCode = failed ? 1 : 0;
