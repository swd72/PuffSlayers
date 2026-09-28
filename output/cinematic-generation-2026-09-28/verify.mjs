import sharp from 'sharp';
import { readFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'output/cinematic-generation-2026-09-28';
await mkdir(output, { recursive: true });
const files = [{"name":"druid-ground-burst","path":"C:\\project\\PuffSlayers\\assets\\generated\\vfx2\\druid-ground-burst.png"},{"name":"druid-vine-emerge","path":"C:\\project\\PuffSlayers\\assets\\generated\\vfx2\\druid-vine-emerge.png"},{"name":"druid-vine-coil","path":"C:\\project\\PuffSlayers\\assets\\generated\\vfx2\\druid-vine-coil.png"},{"name":"druid-root-erupt","path":"C:\\project\\PuffSlayers\\assets\\generated\\vfx2\\druid-root-erupt.png"},{"name":"01-meadow-of-naps","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\01-meadow-of-naps.png"},{"name":"02-carrot-forest","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\02-carrot-forest.png"},{"name":"03-lotus-lagoon","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\03-lotus-lagoon.png"},{"name":"04-sunflower-valley","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\04-sunflower-valley.png"},{"name":"05-milk-sea-shore","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\05-milk-sea-shore.png"},{"name":"06-star-pond","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\06-star-pond.png"},{"name":"01-meadow-of-naps-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\01-meadow-of-naps-boss.png"},{"name":"02-carrot-forest-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\02-carrot-forest-boss.png"},{"name":"03-lotus-lagoon-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\03-lotus-lagoon-boss.png"},{"name":"04-sunflower-valley-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\04-sunflower-valley-boss.png"},{"name":"05-milk-sea-shore-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\05-milk-sea-shore-boss.png"},{"name":"06-star-pond-boss","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\06-star-pond-boss.png"},{"name":"village-hub","path":"C:\\project\\PuffSlayers\\assets\\generated\\v2\\backgrounds\\village-hub.png"}];
assert.equal(files.length, 17);
const sourceMeta = [];
for (const f of files) {
  const m = await sharp(f.path).metadata();
  assert.equal(m.format, 'png', f.name);
  if (!f.name.startsWith('druid-')) assert.ok(Math.abs(m.width / m.height - 9 / 16) < 0.012, f.name + ' portrait ratio');
  sourceMeta.push({ name: f.name, width: m.width, height: m.height });
}
const chapters = ["01-meadow-of-naps","02-carrot-forest","03-lotus-lagoon","04-sunflower-valley","05-milk-sea-shore","06-star-pond"];
const cards = [];
for (let row=0; row<2; row++) {
  for (let col=0; col<6; col++) {
    const name = chapters[col] + (row ? '-boss' : '');
    const f = files.find(f=>f.name===name);
    const thumbnail = await sharp(f.path).resize(240, 426).png().toBuffer();
    cards.push({input:thumbnail,left:col*248+8,top:row*466+34});
    const label = Buffer.from('<svg width="240" height="26"><text x="120" y="19" text-anchor="middle" fill="#E8E8E8" font-family="Arial" font-size="12">' + name + '</text></svg>');
    cards.push({input:label,left:col*248+8,top:row*466+4});
  }
}
await sharp({create:{width:1496,height:936,channels:3,background:'#172027'}}).composite(cards).jpeg({quality:92}).toFile(output+'/backgrounds-overview.jpg');
await writeFile(output+'/source-metadata.json', JSON.stringify(sourceMeta,null,2));
console.log(JSON.stringify(sourceMeta));

const manifest = JSON.parse(await readFile('apps/web/public/sprites/v2/manifest.json','utf8'));
const expectedFrames = { 'druid-ground-burst':4, 'druid-vine-emerge':4, 'druid-vine-coil':3, 'druid-root-erupt':4 };
const frameCards = [];
const cellW = 248, cellH = 292, qaW = cellW * 4, qaH = cellH * 4;
const checker = Buffer.alloc(qaW * qaH * 3);
for (let y=0;y<qaH;y++) for(let x=0;x<qaW;x++) {
  const v = ((Math.floor(x/16)+Math.floor(y/16))%2) ? 62 : 78;
  const offset = (y*qaW+x)*3;
  checker[offset]=v; checker[offset+1]=v+10; checker[offset+2]=v+16;
}
let row = 0;
const extractedMeta = [];
for (const [name, frames] of Object.entries(expectedFrames)) {
  const meta = manifest['vfx/'+name];
  assert.ok(meta, name+' manifest');
  assert.equal(meta.frames, frames);
  assert.equal(meta.additive, false);
  for(let i=0;i<frames;i++) {
    const path = 'apps/web/public/sprites/v2/vfx/'+name+'-'+i+'.png';
    const {data,info} = await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width, meta.width);
    assert.equal(info.height, meta.height);
    let transparent=0, opaque=0, darkOpaque=0;
    for(let p=0;p<data.length;p+=4) {
      if(data[p+3]===0) transparent++;
      if(data[p+3]>=240) { opaque++; if(Math.max(data[p],data[p+1],data[p+2])<100) darkOpaque++; }
    }
    assert.ok(transparent>info.width*info.height*.05, name+' transparent background');
    assert.ok(opaque>100, name+' visible solid artwork');
    extractedMeta.push({name,frame:i,width:info.width,height:info.height,transparent,opaque,darkOpaque});
    const thumbnail = await sharp(path).resize(232,258,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    frameCards.push({input:thumbnail,left:i*cellW+8,top:row*cellH+28});
    const label = Buffer.from('<svg width="240" height="26"><text x="120" y="19" text-anchor="middle" fill="#FFFFFF" font-family="Arial" font-size="13">'+name+' / '+i+'</text></svg>');
    frameCards.push({input:label,left:i*cellW+4,top:row*cellH});
  }
  row++;
}
for(const name of [...chapters.flatMap(c=>[c,c+'-boss']),'village-hub']) {
  const meta=await sharp('apps/web/public/sprites/v2/bg/'+name+'.jpg').metadata();
  assert.ok(Math.abs(meta.width/meta.height-9/16)<.012, name+' exported portrait ratio');
}
await sharp(checker,{raw:{width:qaW,height:qaH,channels:3}}).composite(frameCards).png().toFile(output+'/vfx-frames-overview.png');
await writeFile(output+'/extracted-metadata.json',JSON.stringify(extractedMeta,null,2));
console.log('PASS: 17 source PNGs, 13 exported backgrounds, 15 painted frames; alpha and normal blending verified.');


