// Puff Album (GDD §13.1): every puff in the game, how rare it is, and the three ways to get one —
// the Puff Capsule (gacha with visible rates + pity), boss shards (farm), and the pond shop (fishing).
// Pure: randomness comes in as an Rng, so results replay from a seed.
import type { StatBlock } from './gear';
import type { Rng } from './rng';
import type { HeroClass, Species } from './types';

export type Rarity = 3 | 4 | 5 | 6;

export interface PuffInfo {
  readonly id: string;
  readonly name: string;
  readonly species: Species;
  readonly heroClass: HeroClass;
  readonly rarity: Rarity;
  /** one short line for the album card */
  readonly blurb: string;
}

/** Every puff. The first seven are the starting team (they have their own art); the rest are collected. */
export const PUFFS: readonly PuffInfo[] = [
  { id: 'pudding', name: 'Pudding', species: 'hamham', heroClass: 'pillow-guard', rarity: 4, blurb: 'กลิ้งเป็นลูกบอลได้ หมอนใหญ่กว่าตัว' },
  { id: 'tofu', name: 'Tofu', species: 'shibu', heroClass: 'carrot-knight', rarity: 3, blurb: 'ผ้าพันคอแดง ดาบแครอท ท่าเท่แต่ขาสั้น' },
  { id: 'usagi', name: 'Usagi', species: 'bunbun', heroClass: 'leaf-archer', rarity: 3, blurb: 'ฮู้ดใบไม้ หูพับข้างเดียว' },
  { id: 'kinako', name: 'Kinako', species: 'shibu', heroClass: 'bubble-mage', rarity: 4, blurb: 'หมวกพ่อมดทรงกรวยไอติม' },
  { id: 'momo', name: 'Momo', species: 'bunbun', heroClass: 'mochi-cleric', rarity: 3, blurb: 'หมวกโมจิ แก้มมีขนมตลอด' },
  { id: 'mimi', name: 'Mimi', species: 'hamham', heroClass: 'bell-bard', rarity: 4, blurb: 'โบว์กระดิ่งที่หู เต้นระหว่างสู้' },
  { id: 'taro', name: 'Taro', species: 'molemo', heroClass: 'root-druid', rarity: 4, blurb: 'ตุ่นจมูกดาว เสกรากจากพื้น' },
  { id: 'latte', name: 'Latte', species: 'bunbun', heroClass: 'carrot-knight', rarity: 5, blurb: 'ขนสีกาแฟ กระโดดฟันจากฟ้า' },
  { id: 'senbei', name: 'Senbei', species: 'shibu', heroClass: 'pillow-guard', rarity: 5, blurb: 'เกราะซามูไรทำจากข้าวเกรียบ' },
  { id: 'nugget', name: 'Nugget', species: 'hamham', heroClass: 'leaf-archer', rarity: 5, blurb: 'แว่นกันแดด ยิงเมล็ดรัวเป็นมินิกัน' },
  { id: 'sakura', name: 'Sakura', species: 'hamham', heroClass: 'mochi-cleric', rarity: 5, blurb: 'กลีบซากุระลอยรอบตัว' },
  { id: 'daifuku', name: 'Daifuku', species: 'hamham', heroClass: 'bubble-mage', rarity: 6, blurb: 'ฟองสบู่ยักษ์ขังศัตรูแล้วลอยขึ้นฟ้า' },
  { id: 'kuma', name: 'Kuma-Shiba', species: 'shibu', heroClass: 'bell-bard', rarity: 6, blurb: 'ใส่ชุดหมีทับอีกที น่ารักซ้อนน่ารัก' },
];

export const STARTER_PUFFS: readonly string[] = PUFFS.slice(0, 7).map((p) => p.id);

export const puffInfo = (id: string): PuffInfo | undefined => PUFFS.find((p) => p.id === id);

export const ALBUM = {
  /** shards that unlock a puff you don't have yet */
  unlockShards: 50,
  /** a duplicate from the capsule turns into this many of its shards (nothing is wasted) */
  dupeShards: { 3: 5, 4: 10, 5: 25, 6: 50 } as Record<Rarity, number>,
  /** shards for each star-up (★+1 … ★+5) */
  starCost: [10, 20, 30, 50, 80] as const,
  /** each star-up: team-strength bonus for that puff */
  starStep: { hpPct: 0.06, atkPct: 0.06 },
  /** rarer puffs start a little stronger */
  rarityBonus: { 3: 0, 4: 0.04, 5: 0.08, 6: 0.12 } as Record<Rarity, number>,
  /** boss shards: the chapter's featured puff */
  shardsPerClear: 2,
  shardsPerBoss: 8,
  shardsPerGiant: 15,
} as const;

export const MAX_STARS = ALBUM.starCost.length;

/** Each 10-stage chapter features one puff whose shards its bosses drop (the farm path). */
const CHAPTER_PUFF: readonly string[] = ['latte', 'senbei', 'nugget', 'sakura', 'daifuku', 'kuma'];
export const chapterOf = (stage: number): number => Math.floor((stage - 1) / 10) + 1;
export const chapterPuff = (stage: number): string => CHAPTER_PUFF[(chapterOf(stage) - 1) % CHAPTER_PUFF.length] ?? 'latte';

/** Shards of the chapter puff for clearing a stage (bosses give more). */
export function stageShards(stage: number): number {
  if (stage % 10 === 0) return ALBUM.shardsPerGiant;
  if (stage % 5 === 0) return ALBUM.shardsPerBoss;
  return ALBUM.shardsPerClear;
}

/** Stats a puff gets from its rarity and stars (added to its gear). */
export function puffBonus(rarity: Rarity, stars: number): StatBlock {
  const s = Math.max(0, Math.min(MAX_STARS, stars));
  const base = ALBUM.rarityBonus[rarity];
  return { hpPct: base + ALBUM.starStep.hpPct * s, atkPct: base + ALBUM.starStep.atkPct * s };
}

/** Shards for the next star, or undefined at max. */
export const starUpCost = (stars: number): number | undefined => ALBUM.starCost[stars];

// ---------- Puff Capsule ----------

export const CAPSULE = {
  cost: 100,
  /** ten at once costs a little less */
  tenCost: 900,
  /** chance per pull, % (GDD §13.1) — always shown on the machine */
  rates: { 3: 79, 4: 18, 5: 2.7, 6: 0.3 } as Record<Rarity, number>,
  /** every 10th pull is ★4 or better */
  pity4: 10,
  /** ★5 or better within 60 pulls */
  pity5: 60,
  /** 150 pulls (never reset) lets you pick any ★6 */
  spark: 150,
} as const;

export interface CapsulePity {
  /** pulls since the last ★4+ */
  readonly since4: number;
  /** pulls since the last ★5+ */
  readonly since5: number;
  /** spark points (one per pull; spent when picking a ★6) */
  readonly spark: number;
}

export const freshPity = (): CapsulePity => ({ since4: 0, since5: 0, spark: 0 });

export interface CapsulePull {
  readonly puff: string;
  readonly rarity: Rarity;
  /** true when the pity counter forced this rarity */
  readonly pity: boolean;
}

function rollRarity(rng: Rng, pity: CapsulePity): { rarity: Rarity; pity: boolean } {
  const r = rng.next() * 100;
  const { rates } = CAPSULE;
  let rarity: Rarity = r < rates[6] ? 6 : r < rates[6] + rates[5] ? 5 : r < rates[6] + rates[5] + rates[4] ? 4 : 3;
  let forced = false;
  if (rarity < 5 && pity.since5 + 1 >= CAPSULE.pity5) {
    rarity = rng.next() < rates[6] / (rates[5] + rates[6]) ? 6 : 5;
    forced = true;
  } else if (rarity < 4 && pity.since4 + 1 >= CAPSULE.pity4) {
    rarity = 4;
    forced = true;
  }
  return { rarity, pity: forced };
}

/** Opens `count` capsules. Every puff can come out (every puff can also be farmed, so none is capsule-only). */
export function openCapsules(rng: Rng, pity: CapsulePity, count: number): { pulls: CapsulePull[]; pity: CapsulePity } {
  let p = pity;
  const pulls: CapsulePull[] = [];
  for (let i = 0; i < count; i++) {
    const { rarity, pity: forced } = rollRarity(rng, p);
    const pool = PUFFS.filter((x) => x.rarity === rarity);
    const puff = pool[Math.floor(rng.next() * pool.length)] ?? pool[0]!;
    pulls.push({ puff: puff.id, rarity, pity: forced });
    p = {
      since4: rarity >= 4 ? 0 : p.since4 + 1,
      since5: rarity >= 5 ? 0 : p.since5 + 1,
      spark: p.spark + 1,
    };
  }
  return { pulls, pity: p };
}
