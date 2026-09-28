import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Reuse the game's exact gray-key functions for art-only previews.
// UI extraction was removed by the concurrent cut-in removal commit.
const pipeline = await readFile('tools/extract-v2.mjs', 'utf8');
const start = pipeline.indexOf('function borderColor(');
const end = pipeline.indexOf('/** Near-black smoke', start);
if (start < 0 || end < 0) throw new Error('Background-key functions not found');
const key = new Function('GRAY_BG', pipeline.slice(start, end) + '\nreturn { borderColor, removeFlatBackground, removeEnclosedBackground };')({ tolerance: 26, softness: 16 });
const out = 'output/imagegen/cinematic-review';
await mkdir(out, { recursive: true });
const classes = ['pillow-guard', 'carrot-knight', 'leaf-archer', 'bubble-mage', 'mochi-cleric', 'bell-bard', 'root-druid'];
const names = ['Pudding', 'Tofu', 'Usagi', 'Kinako', 'Momo', 'Mimi', 'Taro'];
const report = { uiRuntimeEnabled: false, reason: 'Current HEAD removes the cut-in banner and emblem swipe.', sourceAssets: [], moveFrames: [] };

async function grayKey(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = key.borderColor(data, info.width, info.height);
  key.removeFlatBackground(data, info.width, info.height);
  key.removeEnclosedBackground(data, info.width, info.height, bg);
  report.sourceAssets.push({ file, width: info.width, height: info.height });
  return { data, info };
}
const emblems = await grayKey('assets/generated/v2/ui/class-emblems.png');
await sharp(emblems.data, { raw: { width: emblems.info.width, height: emblems.info.height, channels: 4 } }).png().toFile(path.join(out, 'emblems.png'));
const portraits = [];
for (const c of classes) {
  const p = await grayKey(`assets/generated/v2/ui/cutin-${c}.png`);
  const target = path.join(out, `cutin-${c}.png`);
  await sharp(p.data, { raw: { width: p.info.width, height: p.info.height, channels: 4 } }).resize(512, 512).png().toFile(target);
  portraits.push(target);
}
const manifest = JSON.parse(await readFile('apps/web/public/sprites/v2/manifest.json', 'utf8'));
report.moveMetadata = manifest['move/carrot-knight-ult'];
if (report.moveMetadata?.frames !== 12) throw new Error('Expected 12 ultimate frames');
const source = await sharp('assets/generated/v2/moves/carrot-knight-ult.png').metadata();
if (source.width / 4 !== source.height / 3) throw new Error('Move cells must be square');
report.sourceAssets.push({ file: 'assets/generated/v2/moves/carrot-knight-ult.png', width: source.width, height: source.height, cellSize: source.width / 4 });
const frames = [];
for (let i = 0; i < 12; i++) {
  const file = `apps/web/public/sprites/v2/move/carrot-knight-ult-${i}.png`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0, transparent = 0;
  for (let p = 3; p < data.length; p += 4) { if (data[p] >= 24) visible++; if (data[p] === 0) transparent++; }
  if (!visible || !transparent) throw new Error(`Bad frame ${i}`);
  if (info.width !== report.moveMetadata.width || info.height !== report.moveMetadata.height) throw new Error(`Frame size mismatch ${i}`);
  report.moveFrames.push({ frame: i + 1, width: info.width, height: info.height, visiblePixels: visible, transparentPixels: transparent });
  frames.push(file);
}
async function contact(files, cols, cell, target) {
  const tiles = await Promise.all(files.map(async (file, i) => ({ input: await sharp(file).resize(cell - 16, cell - 16, { fit: 'inside' }).png().toBuffer(), left: (i % cols) * cell + 8, top: Math.floor(i / cols) * cell + 8 })));
  await sharp({ create: { width: cols * cell, height: Math.ceil(files.length / cols) * cell, channels: 4, background: '#172331' } }).composite(tiles).png().toFile(path.join(out, target));
}
await contact(portraits, 4, 256, 'cutins-overview.png');
await contact(frames, 4, 320, 'tofu-frames-overview.png');
const embed = async f => 'data:image/png;base64,' + (await readFile(f)).toString('base64');
const frameImages = await Promise.all(frames.map(embed));
const cutinImages = await Promise.all(portraits.map(embed));
const emblemImage = await embed(path.join(out, 'emblems.png'));
const html = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Puff Slayers — ตรวจภาพอัลติ</title>
<style>*{box-sizing:border-box}body{font:16px system-ui;background:#0f1924;color:#edf4ff;max-width:1250px;margin:auto;padding:24px}h1{font-size:28px}h2{margin-top:32px}p{color:#b8c9da;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tile{background:#203142;border-radius:12px;padding:8px;text-align:center}.tile img{width:100%;display:block}.emblems{width:100%;background:#203142;border-radius:12px}.stage{position:relative;width:440px;max-width:100%;height:360px;background:radial-gradient(ellipse,#314630,#172331 75%);border-radius:16px;overflow:hidden}.stage img{position:absolute;left:50%;top:70%;transform-origin:0 0}.controls{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:16px 0}button,select{font:inherit;background:#dcebcf;color:#172331;padding:8px 14px;border:0;border-radius:8px}input{width:250px}small{color:#b8c9da}@media(max-width:650px){.grid{grid-template-columns:repeat(2,1fr)}}</style>
<h1>Puff Slayers — ภาพอัลติชุดแรก</h1><p>Emblem 7 อาชีพ · Cut-in 7 ตัว · Tofu อัลติ 12 เฟรม ตัวอย่างด้านล่างใช้เฟรมที่เกมตัดจริง พื้นหลังมืดช่วยให้เห็นขอบและพื้นเทาที่อาจติดมา<br>โค้ดปัจจุบันถอด cut-in และ emblem ออกจากเกมแล้ว ภาพ UI เก็บไว้ใน assets/generated/v2/ui</p>
<h2>Tofu — Carrot Crescent</h2><div class="stage"><img id="animation" alt="อัลติ Tofu"></div><div class="controls"><button id="play">หยุด</button><select id="size"><option value="72">ขนาดตัวอ้างอิง 72px</option><option value="180" selected>ขยายตรวจ 180px</option><option value="220">ขนาดไฟล์ 220px</option></select><input id="scrub" type="range" min="0" max="11" value="0"><span id="count">1 / 12</span></div><small>เวลา 1.65 วินาที · เฟรม 9 ค้าง ×3 · เฟรม 12 ค้าง ×2 ตามโค้ดเกม</small>
<div class="grid">${frameImages.map((src,i)=>`<div class="tile"><img src="${src}" alt="เฟรม ${i+1}"><span>${i+1}${i===8?' · กระแทก':''}</span></div>`).join('')}</div>
<h2>Class emblems</h2><img class="emblems" src="${emblemImage}" alt="สัญลักษณ์ทั้ง 7 อาชีพเรียงตามตาราง">
<h2>Cut-ins</h2><div class="grid">${cutinImages.map((src,i)=>`<div class="tile"><img src="${src}" alt="${names[i]}"><span>${names[i]} · ${classes[i]}</span></div>`).join('')}</div>
<script>const images=${JSON.stringify(frameImages)},meta=${JSON.stringify(report.moveMetadata)};let index=0,playing=true,elapsed=0,last=performance.now();const view=document.querySelector('#animation'),slider=document.querySelector('#scrub'),count=document.querySelector('#count'),size=document.querySelector('#size'),play=document.querySelector('#play');function draw(){view.src=images[index];view.style.width=meta.width+'px';view.style.height=meta.height+'px';view.style.transform='scale('+(Number(size.value)/meta.refHeight)+') translate('+(-meta.anchorX*100)+'%,'+(-meta.anchorY*100)+'%)';slider.value=index;count.textContent=(index+1)+' / 12'}function tick(now){const delta=Math.min(100,now-last);last=now;if(playing){elapsed+=delta;const duration=1650/15*(index===8?3:index===11?2:1);if(elapsed>=duration){elapsed-=duration;index=(index+1)%12;draw()}}requestAnimationFrame(tick)}play.onclick=()=>{playing=!playing;play.textContent=playing?'หยุด':'เล่น'};slider.oninput=()=>{playing=false;play.textContent='เล่น';index=Number(slider.value);elapsed=0;draw()};size.onchange=draw;draw();requestAnimationFrame(tick);</script></html>`;
await writeFile(path.join(out, 'review.html'), html);
await writeFile(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ sources: report.sourceAssets.length, frames: report.moveFrames.length, cellSize: source.width / 4, metadata: report.moveMetadata, review: path.resolve(out, 'review.html') }, null, 2));
