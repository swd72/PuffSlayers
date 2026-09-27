// Puff Pond on the save: logging catches, bench puffs fishing on their own, and the pond shop.
import { FISHING, PUFFS, autoFish, createRng, fishInfo, logCatch, weekIndex, type FishInfo } from '@puff/sim';
import { heroDef } from '../assets';
import { addShards } from './album';
import { bump, tzOffset } from './daily';
import type { SaveData } from './save';
import type { ActionResult } from './workshop';

export const FISH_NAME: Record<string, string> = {
  'bread-carp': 'ปลาคาร์ปขนมปัง',
  'bubble-guppy': 'ปลาหางนกยูงฟองสบู่',
  'pebble-loach': 'ปลาหมูหินกลม',
  'moon-minnow': 'ปลาซิวแสงจันทร์',
  'pudding-puffer': 'ปลาปักเป้าพุดดิ้ง',
  'petal-betta': 'ปลากัดกลีบดอก',
  'lantern-catfish': 'ปลาดุกโคมไฟ',
  'mochi-ray': 'ปลากระเบนโมจิ',
  'sakura-koi': 'ปลาคาร์ปซากุระ',
  'star-jelly': 'แมงกะพรุนดาว',
  'golden-koi': 'ปลาคาร์ปทองคำ',
  'rainbow-whale': 'วาฬสายรุ้งจิ๋ว',
};

export const RARITY_TEXT = { common: 'ธรรมดา', uncommon: 'ไม่ธรรมดา', rare: 'หายาก', legend: 'ตำนาน' } as const;
export const RARITY_COLOR = { common: '#8fb3c9', uncommon: '#5fc08a', rare: '#8a6cf0', legend: '#f0a92e' } as const;

/** A caught fish goes into the Fishdex and pays its scales. */
export function catchFish(save: SaveData, fish: FishInfo, size: number): SaveData {
  const pond = { ...save.pond, log: logCatch(save.pond.log, fish.id, size), scales: save.pond.scales + fish.scales };
  return bump({ ...save, pond }, 'fish');
}

/** Fish waiting from bench puffs since the last visit. */
export function pendingAuto(save: SaveData, now = Date.now()): string[] {
  const anglers = save.pond.anglers.filter((id) => save.owned.includes(id) && !save.team.includes(id)).length;
  return autoFish(createRng((save.pond.autoSince ^ 0x2545f491) >>> 0), { anglers, elapsedMs: now - save.pond.autoSince, hour: new Date(now).getHours() });
}

export function collectAuto(save: SaveData, now = Date.now()): { result: ActionResult; fish: string[] } {
  const fish = pendingAuto(save, now);
  let pond = { ...save.pond, autoSince: now };
  for (const id of fish) {
    const info = fishInfo(id);
    if (!info) continue;
    pond = { ...pond, log: logCatch(pond.log, id, info.size[0]), scales: pond.scales + info.scales };
  }
  const message = fish.length ? `พัฟที่นั่งตกปลาได้ปลามา ${fish.length} ตัว!` : 'ยังไม่มีปลาจากพัฟที่นั่งตกปลา';
  return { result: { save: { ...save, pond }, ok: fish.length > 0, message }, fish };
}

/** Sends a bench puff to (or back from) the pond; collects what's waiting first so no fish are lost. */
export function toggleAngler(save: SaveData, heroId: string): ActionResult {
  if (save.team.includes(heroId)) return { save, ok: false, message: 'พัฟที่อยู่ในทีมลงสนามไปตกปลาไม่ได้ — พักจากทีมก่อน' };
  const collected = collectAuto(save).result.save;
  const on = collected.pond.anglers.includes(heroId);
  const anglers = on ? collected.pond.anglers.filter((id) => id !== heroId) : [...collected.pond.anglers, heroId];
  const name = heroDef(heroId)?.name ?? heroId;
  return { save: { ...collected, pond: { ...collected.pond, anglers } }, ok: true, message: on ? `${name} กลับจากบ่อแล้ว` : `${name} ไปนั่งตกปลาแล้ว (ได้ปลาทุก ${FISHING.autoEveryMs / 60000} นาที)` };
}

// ---------- pond shop ----------

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** most per week */
  readonly limit: number;
  give(save: SaveData): SaveData;
}

/** The pond's featured puff changes every week (a ★5/★6 you can collect with scales). */
export function featuredPuff(now = Date.now()): string {
  const pool = PUFFS.filter((p) => p.rarity >= 5);
  const w = weekIndex(now, tzOffset());
  return pool[((w % pool.length) + pool.length) % pool.length]!.id;
}

export function shopItems(now = Date.now()): ShopItem[] {
  const puff = featuredPuff(now);
  return [
    { id: 'shards', name: `ชิ้นส่วน ${heroDef(puff)?.name ?? puff} ×10`, price: 60, limit: 5, give: (s) => addShards(s, puff, 10) },
    { id: 'dew', name: 'Dew Drop ×50', price: 40, limit: 3, give: (s) => ({ ...s, dew: s.dew + 50 }) },
    { id: 'dust', name: 'Stardust ×30', price: 15, limit: 10, give: (s) => ({ ...s, stardust: s.stardust + 30 }) },
  ];
}

/** Bought counts reset each week. */
export function shopState(save: SaveData, now = Date.now()): SaveData['pond'] {
  const week = weekIndex(now, tzOffset());
  return save.pond.shopWeek === week ? save.pond : { ...save.pond, shopWeek: week, bought: {} };
}

export function buy(save: SaveData, itemId: string): ActionResult {
  const item = shopItems().find((i) => i.id === itemId);
  const pond = shopState(save);
  if (!item) return { save, ok: false, message: 'ไม่มีของชิ้นนี้' };
  const bought = pond.bought[itemId] ?? 0;
  if (bought >= item.limit) return { save, ok: false, message: 'ซื้อครบสัปดาห์นี้แล้ว' };
  if (pond.scales < item.price) return { save, ok: false, message: `เกล็ดปลาไม่พอ (ต้องใช้ ${item.price})` };
  const paid: SaveData = { ...save, pond: { ...pond, scales: pond.scales - item.price, bought: { ...pond.bought, [itemId]: bought + 1 } } };
  return { save: item.give(paid), ok: true, message: `ได้ ${item.name}!` };
}
