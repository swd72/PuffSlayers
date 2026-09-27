// Spending Petals and Stardust: hero level-ups and the gear forge, applied to the save.
// Each action returns the new save plus a short Thai message for the bag's toast line.
import {
  canMerge,
  canTransferPlus,
  createRng,
  itemScore,
  levelUpCost,
  maxPlus,
  mergeItems,
  pityNeeded,
  plusOf,
  rerollCost,
  rerollSub,
  salvageValue,
  transferPlus,
  upgradeCost,
  upgradeItem,
  type Item,
  type Rng,
} from '@puff/sim';
import { TEAM_SIZE, heroDef } from '../assets';
import { activeTeam, heroLevel, itemById, wornBy, type SaveData } from './save';

export interface ActionResult {
  readonly save: SaveData;
  readonly ok: boolean;
  readonly message: string;
}

/** Tiers the "auto merge" button touches (Crumb–Silky); rarer items are merged by hand. */
export const AUTO_MERGE_MAX_TIER = 2;

let rngSerial = 0;
const freshRng = (): Rng => createRng((Date.now() ^ (++rngSerial * 0x9e3779b1)) >>> 0);

const fail = (save: SaveData, message: string): ActionResult => ({ save, ok: false, message });

const replaceItems = (save: SaveData, changed: readonly Item[]): SaveData => ({
  ...save,
  items: save.items.map((i) => changed.find((c) => c.id === i.id) ?? i),
});

// ---------- levels ----------

export function levelUp(save: SaveData, heroId: string): ActionResult {
  const level = heroLevel(save, heroId);
  const cost = levelUpCost(level);
  if (save.petals < cost) return fail(save, `Petal ไม่พอ (ต้องใช้ ${cost.toLocaleString('en-US')})`);
  const name = heroDef(heroId)?.name ?? heroId;
  return {
    save: { ...save, petals: save.petals - cost, levels: { ...save.levels, [heroId]: level + 1 } },
    ok: true,
    message: `${name} Lv.${level + 1}!`,
  };
}

/** Spends Petals on whoever is lowest, one level at a time, so the team rises together. */
export function levelUpTeam(save: SaveData): ActionResult {
  let next = save;
  let count = 0;
  for (;;) {
    const lowest = activeTeam(next).sort((a, b) => heroLevel(next, a.id) - heroLevel(next, b.id))[0];
    if (!lowest || next.petals < levelUpCost(heroLevel(next, lowest.id))) break;
    next = levelUp(next, lowest.id).save;
    count++;
  }
  return count ? { save: next, ok: true, message: `อัปเลเวลรวม ${count} ครั้ง` } : fail(save, 'Petal ไม่พอสำหรับเลเวลถัดไป');
}

/** Sends a puff out to fight or back to the bench. The team keeps 1–TEAM_SIZE puffs. */
export function toggleTeam(save: SaveData, heroId: string): ActionResult {
  const name = heroDef(heroId)?.name ?? heroId;
  if (save.team.includes(heroId)) {
    if (save.team.length <= 1) return fail(save, 'ต้องมีพัฟในทีมอย่างน้อย 1 ตัว');
    return { save: { ...save, team: save.team.filter((id) => id !== heroId) }, ok: true, message: `${name} ไปพักแล้ว — มีผลด่านถัดไป` };
  }
  if (save.team.length >= TEAM_SIZE) return fail(save, `ทีมเต็ม ${TEAM_SIZE} ตัว — ให้ตัวอื่นพักก่อน`);
  return { save: { ...save, team: [...save.team, heroId] }, ok: true, message: `${name} ลงทีมแล้ว — มีผลด่านถัดไป` };
}

// ---------- forge ----------

export function upgrade(save: SaveData, itemId: string, rng: Rng = freshRng()): ActionResult {
  const item = itemById(save, itemId);
  if (!item) return fail(save, 'ไม่พบไอเทม');
  if (plusOf(item) >= maxPlus(item)) return fail(save, 'ตีบวกเต็มแล้ว');
  const cost = upgradeCost(item);
  if (save.petals < cost.petals) return fail(save, 'Petal ไม่พอ');
  if (save.stardust < cost.stardust) return fail(save, 'Stardust ไม่พอ — แยกของที่ไม่ใช้ก่อน');
  const result = upgradeItem(rng, item);
  const paid = { ...save, petals: save.petals - cost.petals, stardust: save.stardust - cost.stardust };
  const next = replaceItems(paid, [result.item]);
  if (result.success) return { save: next, ok: true, message: `ตีบวกสำเร็จ! +${plusOf(result.item)}` };
  const left = pityNeeded(result.item) - (result.item.forgePity ?? 0);
  return { save: next, ok: false, message: left <= 0 ? 'พลาด… ครั้งหน้าสำเร็จแน่นอน!' : `พลาด… ของไม่เสียหาย (การันตีในอีก ${left + 1} ครั้ง)` };
}

const isFree = (save: SaveData, item: Item): boolean => !item.relic && !wornBy(save, item.id);

/** Items that can be merged with this one: same tier, same slot (and class for weapons), not worn. */
export function mergePartners(save: SaveData, item: Item): Item[] {
  return save.items
    .filter((i) => i.id !== item.id && isFree(save, i) && i.tier === item.tier && i.slot === item.slot && i.heroClass === item.heroClass)
    .sort((a, b) => itemScore(a) - itemScore(b));
}

/** Merges the item with the two weakest partners; the result keeps the lead item's place if it was worn. */
export function merge(save: SaveData, itemId: string, rng: Rng = freshRng()): ActionResult {
  const lead = itemById(save, itemId);
  if (!lead) return fail(save, 'ไม่พบไอเทม');
  const group = [lead, ...mergePartners(save, lead).slice(0, 2)];
  if (!canMerge(group)) return fail(save, 'ต้องมีของ Tier และช่องเดียวกัน 3 ชิ้น');
  const made = mergeItems(rng, `i${save.nextId}`, group);
  const used = new Set(group.map((i) => i.id));
  const owner = wornBy(save, lead.id);
  const equipped = owner ? { ...save.equipped, [owner]: { ...save.equipped[owner], [lead.slot]: made.id } } : save.equipped;
  return {
    save: { ...save, items: [...save.items.filter((i) => !used.has(i.id)), made], equipped, nextId: save.nextId + 1 },
    ok: true,
    message: 'รวมสำเร็จ! ได้ของ Tier ใหม่',
  };
}

/** Merges every free triple of Crumb–Silky items, lowest first, until none are left. */
export function autoMerge(save: SaveData, rng: Rng = freshRng()): ActionResult {
  let next = save;
  let count = 0;
  for (let tier = 0; tier <= AUTO_MERGE_MAX_TIER; tier++) {
    for (;;) {
      const lead = next.items.find((i) => i.tier === tier && isFree(next, i) && mergePartners(next, i).length >= 2);
      if (!lead) break;
      next = merge(next, lead.id, rng).save;
      count++;
    }
  }
  return count ? { save: next, ok: true, message: `รวมอัตโนมัติ ${count} ครั้ง` } : fail(save, 'ไม่มีของ Crumb–Silky ครบ 3 ชิ้นให้รวม');
}

export function salvage(save: SaveData, itemId: string): ActionResult {
  const item = itemById(save, itemId);
  if (!item) return fail(save, 'ไม่พบไอเทม');
  if (item.relic) return fail(save, 'ของแรร์แยกไม่ได้');
  if (wornBy(save, item.id)) return fail(save, 'ถอดออกก่อนจึงจะแยกได้');
  const dust = salvageValue(item);
  return {
    save: { ...save, items: save.items.filter((i) => i.id !== item.id), stardust: save.stardust + dust },
    ok: true,
    message: `แยกแล้ว ได้ Stardust +${dust}`,
  };
}

export function reroll(save: SaveData, itemId: string, subIndex: number, rng: Rng = freshRng()): ActionResult {
  const item = itemById(save, itemId);
  if (!item || !item.subs[subIndex]) return fail(save, 'ไม่พบค่าพลังนี้');
  const cost = rerollCost(item);
  if (save.stardust < cost) return fail(save, `Stardust ไม่พอ (ต้องใช้ ${cost})`);
  return { save: replaceItems({ ...save, stardust: save.stardust - cost }, [rerollSub(rng, item, subIndex)]), ok: true, message: 'สุ่มค่าพลังใหม่แล้ว' };
}

/** The equipped item in the same slot whose +N could move onto this one, if any. */
export function transferSource(save: SaveData, heroId: string, to: Item): Item | undefined {
  const worn = itemById(save, save.equipped[heroId]?.[to.slot]);
  return worn && canTransferPlus(worn, to) ? worn : undefined;
}

export function transfer(save: SaveData, fromId: string, toId: string): ActionResult {
  const from = itemById(save, fromId);
  const to = itemById(save, toId);
  if (!from || !to || !canTransferPlus(from, to)) return fail(save, 'ย้ายค่าตีบวกได้เฉพาะของ Tier เดียวกัน');
  const moved = transferPlus(from, to);
  return { save: replaceItems(save, [moved.from, moved.to]), ok: true, message: `ย้าย +${plusOf(moved.to)} สำเร็จ` };
}
