import { readFile, writeFile, access } from 'node:fs/promises';

const out = 'output/imagegen/signature-moves-2026-09-28/prompts.json';
const doc = await readFile('docs/art-prompts-v2.md', 'utf8');
const data = JSON.parse(await readFile(out, 'utf8'));
const style = doc.match(/\*\*`\[MOVE STYLE\]`\*\*[\s\S]*?```\s*([\s\S]*?)```/)[1].trim();
const references = {
  'pillow-guard': 'hamham-pillow-guard',
  'carrot-knight': 'shibu-carrot-knight',
  'leaf-archer': 'bunbun-leaf-archer',
  'bubble-mage': 'shibu-bubble-mage',
  'mochi-cleric': 'bunbun-mochi-cleric',
  'bell-bard': 'hamham-bell-bard',
  'root-druid': 'molemo-root-druid',
};
const ultimate = doc.split('### 14.3')[1].split('### 14.4')[0];
const attack = doc.split('### 14.4')[1].split('### 14.5')[0];
const moves = [...ultimate.matchAll(/\*\*[^\n]*?`([a-z-]+)-ult\.png`[^\n]*\n```\s*([\s\S]*?)```/g)].map(m => ({ name: m[1] + '-ult', cls: m[1], action: m[2].trim(), frames: 12, cols: 4, rows: 3 }));
for (const m of attack.matchAll(/\| `([a-z-]+)-attack\.png` \| `([^`]+)` \|/g)) moves.push({ name: m[1] + '-attack', cls: m[1], action: m[2], frames: 6, cols: 3, rows: 2 });
if (moves.length !== 14) throw new Error(`Expected 14 move sheets, found ${moves.length}`);
for (const move of moves) {
  move.asset = `assets/generated/v2/moves/${move.name}.png`;
  move.reference = `assets/generated/v2/characters/${references[move.cls]}-model.png`;
  move.existing = await access(move.asset).then(() => true, () => false);
  move.prompt = `Use case: stylized-concept. Asset type: Puff Slayers production game animation sprite sheet, ${move.name}. Input image 1 is a CHARACTER IDENTITY REFERENCE model sheet; do not reproduce its layout. Keep exactly the same species, face, fur, costume and weapon design. Output ONE continuous move with exactly ${move.frames} poses in a strict ${move.cols} columns by ${move.rows} rows grid of EQUAL SQUARE CELLS, image aspect ${move.cols}:${move.rows}. Sequence read left-to-right then top-to-bottom.\nActions: ${move.action}\nStyle: ${style}\nProduction constraints: perfectly uniform flat light gray #E8E8E8 backdrop, absolutely no floor shadows, no gradients, no scenery. Every COMPLETE drawing including every weapon tip, ear, energy streak, debris and sparkle must fit within the central 76% width and 76% height of its OWN cell. Leave at least 12% of each cell completely blank on all four sides. Continuous empty gray corridors separate all rows and columns. Do not draw grid lines, labels, numbers, text or borders. Same head diameter and body size in every frame; first and last poses both ready stance scale. Feet at horizontal center and 76% cell height except jumping poses. Size the puff small enough to leave room for the biggest impact VFX inside its cell; frame ${move.frames === 12 ? 9 : 3} has strongest effect but same puff body scale. Exactly ONE puff per cell, no extra characters. All frames face right at top-down 55 degrees. Crisp painted effect edges; no haze or glow leaking into corridors. Entire image and every complete pose inside canvas.`;
}
data.assets = [...data.assets.filter(a => !a.asset.includes('/moves/')), ...moves];
await writeFile(out, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(moves.map(({ name, existing }) => ({ name, existing }))));
