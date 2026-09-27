// World-Waking Garden on the save: planting, watering, picking blooms, and seeds from battle.
import { SEEDS, canWater, isBloomed, plant, water, type SeedKind } from '@puff/sim';
import type { SaveData } from './save';
import { bump } from './daily';
import type { ActionResult } from './workshop';

export const SEED_NAME: Record<SeedKind, string> = {
  daisy: 'เดซี่',
  tulip: 'ทิวลิป',
  sunflower: 'ทานตะวัน',
  lavender: 'ลาเวนเดอร์',
  cactus: 'กระบองเพชร',
  'honey-bud': 'ดอกน้ำผึ้ง',
  'queen-rafflesia': 'ราฟเฟิลเซียราชินี',
  'sunflower-colossus': 'ทานตะวันยักษ์',
  'lotus-moon-sage': 'บัวจันทรา',
};

const fail = (save: SaveData, message: string): ActionResult => ({ save, ok: false, message });
const replacePlot = (save: SaveData, index: number, plot: SaveData['plots'][number]): SaveData => ({
  ...save,
  plots: save.plots.map((p, i) => (i === index ? plot : p)),
});

export function plantSeed(save: SaveData, index: number, seed: SeedKind, now = Date.now()): ActionResult {
  if (save.plots[index] !== null) return fail(save, 'แปลงนี้ปลูกอยู่แล้ว');
  if ((save.seeds[seed] ?? 0) <= 0) return fail(save, 'ไม่มีเมล็ดนี้แล้ว');
  const next = replacePlot({ ...save, seeds: { ...save.seeds, [seed]: (save.seeds[seed] ?? 0) - 1 } }, index, plant(seed, now));
  return { save: next, ok: true, message: `ปลูก${SEED_NAME[seed]}แล้ว` };
}

export function waterPlot(save: SaveData, index: number, now = Date.now()): ActionResult {
  const plot = save.plots[index];
  if (!plot || !canWater(plot, now)) return fail(save, 'รดน้ำไปแล้ว — รอให้โตอีกขั้น');
  return { save: bump(replacePlot(save, index, water(plot, now)), 'garden'), ok: true, message: 'รดน้ำแล้ว โตไวขึ้น!' };
}

export function harvest(save: SaveData, index: number, now = Date.now()): ActionResult {
  const plot = save.plots[index];
  if (!plot || !isBloomed(plot, now)) return fail(save, 'ยังไม่บาน');
  const kind = plot.seed;
  const petals = SEEDS[kind].petals;
  const next = replacePlot(
    { ...save, blooms: { ...save.blooms, [kind]: (save.blooms[kind] ?? 0) + 1 }, petals: save.petals + petals },
    index,
    null,
  );
  return { save: bump(next, 'garden'), ok: true, message: `${SEED_NAME[kind]}บานแล้ว! +${petals} Petal` };
}

/** Picks every bloom at once. */
export function harvestAll(save: SaveData, now = Date.now()): ActionResult {
  let next = save;
  let count = 0;
  save.plots.forEach((plot, i) => {
    if (plot && isBloomed(plot, now)) {
      next = harvest(next, i, now).save;
      count++;
    }
  });
  return count ? { save: next, ok: true, message: `เก็บดอกไม้ ${count} ดอก!` } : fail(save, 'ยังไม่มีดอกที่บาน');
}

export function addSeeds(save: SaveData, found: readonly SeedKind[]): SaveData {
  const seeds = { ...save.seeds };
  for (const kind of found) seeds[kind] = (seeds[kind] ?? 0) + 1;
  return { ...save, seeds };
}

export const readyBlooms = (save: SaveData, now = Date.now()): number => save.plots.filter((p) => p && isBloomed(p, now)).length;
