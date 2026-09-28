import assert from 'node:assert/strict';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const out = 'output/imagegen/signature-moves-2026-09-28';
const root = 'apps/web/public/sprites/v2';
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8'));
const prompts = JSON.parse(await readFile(`${out}/prompts.json`, 'utf8'));
const classes = ['carrot-knight', 'leaf-archer', 'bubble-mage', 'pillow-guard', 'mochi-cleric', 'bell-bard', 'root-druid'];
const required = prompts.assets.map(a => ({ name: a.asset.includes('/moves/') ? `move/${a.name}` : `vfx/${a.asset.split('/').at(-1).replace('.png', '')}`, frames: a.frames, additive: a.kind === 'vfx' }));
for (const [name, frames] of Object.entries({ 'druid-ground-burst': 4, 'druid-vine-emerge': 4, 'druid-vine-coil': 3, 'druid-root-erupt': 4 })) required.push({ name: `vfx/${name}`, frames, additive: false });
const report = { sheets: [], warnings: [], totalFrames: 0 };
for (const item of required) {
  const meta = manifest[item.name];
  assert.ok(meta, `${item.name}: manifest entry missing`);
  assert.equal(meta.frames, item.frames, `${item.name}: frame count`);
  assert.equal(meta.additive, item.additive, `${item.name}: blend mode`);
  if (item.name.startsWith('move/')) {
    assert.ok(meta.anchorX > 0 && meta.anchorX < 1, `${item.name}: horizontal anchor`);
    assert.ok(meta.anchorY > 0 && meta.anchorY <= 1, `${item.name}: foot anchor`);
  }
  const visible = [];
  for (let i = 0; i < item.frames; i++) {
    const { data, info } = await sharp(`${root}/${item.name}-${i}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, meta.width, `${item.name}-${i}: frame width`);
    assert.equal(info.height, meta.height, `${item.name}-${i}: frame height`);
    let occupied = 0, transparent = 0;
    for (let p = 3; p < data.length; p += 4) {
      if (data[p] > 24) occupied++;
      if (data[p] < 8) transparent++;
    }
    assert.ok(occupied > 50, `${item.name}-${i}: empty frame`);
    assert.ok(transparent > info.width * info.height * 0.1, `${item.name}-${i}: backdrop not removed`);
    visible.push(Number((occupied / (info.width * info.height)).toFixed(3)));
    report.totalFrames++;
  }
  report.sheets.push({ ...item, ...meta, visible });
}
assert.equal(report.totalFrames, 149);

// Measure non-background artwork at cut lines; a busy seam may slice a weapon or a neighbouring effect.
for (const a of prompts.assets.filter(a => a.asset.includes('/moves/'))) {
  const { data, info } = await sharp(a.asset).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const occupied = (x, y) => {
    const p = (y * info.width + x) * 3;
    return Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]) > 22 || Math.max(data[p], data[p + 1], data[p + 2]) < 180;
  };
  const seams = [];
  for (let c = 1; c < a.cols; c++) {
    const x = Math.floor(info.width * c / a.cols);
    let count = 0;
    for (let y = 0; y < info.height; y++) if (occupied(x, y)) count++;
    if (count > 4) seams.push({ axis: 'x', at: x, pixels: count });
  }
  for (let r = 1; r < a.rows; r++) {
    const y = Math.floor(info.height * r / a.rows);
    let count = 0;
    for (let x = 0; x < info.width; x++) if (occupied(x, y)) count++;
    if (count > 4) seams.push({ axis: 'y', at: y, pixels: count });
  }
  if (seams.length) report.warnings.push({ name: a.name, seams });
}

const label = (text, width = 320) => Buffer.from(`<svg width="${width}" height="28"><text x="${width / 2}" y="20" text-anchor="middle" fill="#e9f2ee" font-family="Arial" font-size="16">${text}</text></svg>`);
async function overview(name, frames, cols, file, cellW = 320, cellH = 300) {
  const rows = Math.ceil(frames / cols), cards = [];
  for (let i = 0; i < frames; i++) {
    const thumb = await sharp(`${root}/${name}-${i}.png`).resize({ width: cellW - 22, height: cellH - 42, fit: 'inside' }).png().toBuffer();
    const m = await sharp(thumb).metadata();
    cards.push({ input: label(`${name.split('/').at(-1)} · ${i + 1}`, cellW), left: (i % cols) * cellW, top: Math.floor(i / cols) * cellH });
    cards.push({ input: thumb, left: (i % cols) * cellW + Math.round((cellW - m.width) / 2), top: Math.floor(i / cols) * cellH + 34 + Math.round((cellH - 40 - m.height) / 2) });
  }
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: '#192a31' } }).composite(cards).png().toFile(`${out}/${file}`);
}
await mkdir(out, { recursive: true });
for (const cls of classes) {
  await overview(`move/${cls}-ult`, 12, 4, `${cls}-ult-overview.png`);
  await overview(`move/${cls}-attack`, 6, 3, `${cls}-attack-overview.png`);
}
const signature = required.filter(a => a.name.startsWith('vfx/') && !a.name.includes('druid-'));
const cards = [];
for (let i = 0; i < signature.length; i++) {
  const name = signature[i].name;
  const thumb = await sharp(`${root}/${name}-0.png`).resize({ width: 270, height: 240, fit: 'inside' }).png().toBuffer();
  const m = await sharp(thumb).metadata();
  cards.push({ input: label(name.slice(4), 300), left: (i % 4) * 300, top: Math.floor(i / 4) * 290 });
  cards.push({ input: thumb, left: (i % 4) * 300 + Math.round((300 - m.width) / 2), top: Math.floor(i / 4) * 290 + 36 + Math.round((240 - m.height) / 2) });
}
await sharp({ create: { width: 1200, height: 580, channels: 3, background: '#192a31' } }).composite(cards).png().toFile(`${out}/signature-overview.png`);
await writeFile(`${out}/verification.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ sheets: report.sheets.length, frames: report.totalFrames, warnings: report.warnings }));
