// Puff Album on the save: open capsules, turn shards into puffs and stars.
import { ALBUM, CAPSULE, MAX_STARS, createRng, openCapsules, puffInfo, starUpCost, type CapsulePull } from '@puff/sim';
import { bump, today } from './daily';
import { welcomePuff, type SaveData } from './save';
import type { ActionResult } from './workshop';

export interface PullOutcome extends CapsulePull {
  /** first time this puff joined */
  readonly isNew: boolean;
  /** shards given instead (duplicates) */
  readonly shards: number;
}

export const freePullReady = (save: SaveData, now = Date.now()): boolean => save.freePullDay !== today(now);
export const shardsOf = (save: SaveData, id: string): number => save.shards[id] ?? 0;
export const starsOf = (save: SaveData, id: string): number => save.stars[id] ?? 0;

/** Puts pulls on the save: new puffs join, duplicates become shards. */
function applyPulls(save: SaveData, pulls: readonly CapsulePull[]): { save: SaveData; outcomes: PullOutcome[] } {
  let next = save;
  const outcomes = pulls.map((p) => {
    if (!next.owned.includes(p.puff)) {
      next = welcomePuff(next, p.puff);
      return { ...p, isNew: true, shards: 0 };
    }
    const shards = ALBUM.dupeShards[p.rarity];
    next = addShards(next, p.puff, shards);
    return { ...p, isNew: false, shards };
  });
  return { save: next, outcomes };
}

export const addShards = (save: SaveData, id: string, n: number): SaveData =>
  n > 0 ? { ...save, shards: { ...save.shards, [id]: shardsOf(save, id) + n } } : save;

/** Opens 1 or 10 capsules (or the free daily one). */
export function pullCapsules(save: SaveData, count: 1 | 10, free = false): { result: ActionResult; outcomes: PullOutcome[] } {
  const cost = free ? 0 : count === 10 ? CAPSULE.tenCost : CAPSULE.cost * count;
  if (free && !freePullReady(save)) return { result: { save, ok: false, message: 'วันนี้ใช้แคปซูลฟรีแล้ว' }, outcomes: [] };
  if (save.dew < cost) return { result: { save, ok: false, message: `Dew Drop ไม่พอ (ต้องใช้ ${cost})` }, outcomes: [] };
  const rolled = openCapsules(createRng((Date.now() ^ (save.pity.spark * 0x9e3779b1)) >>> 0), save.pity, count);
  let next: SaveData = { ...save, dew: save.dew - cost, pity: rolled.pity, ...(free ? { freePullDay: today() } : {}) };
  const applied = applyPulls(next, rolled.pulls);
  next = bump(applied.save, 'capsule', count);
  const best = Math.max(...rolled.pulls.map((p) => p.rarity));
  return { result: { save: next, ok: true, message: best >= 5 ? `ว้าว! ได้พัฟ ★${best}!` : 'เปิดแคปซูลแล้ว!' }, outcomes: applied.outcomes };
}

/** 50 shards unlock a puff you don't have yet. */
export function unlockWithShards(save: SaveData, id: string): ActionResult {
  const info = puffInfo(id);
  if (!info || save.owned.includes(id)) return { save, ok: false, message: 'มีพัฟตัวนี้แล้ว' };
  if (shardsOf(save, id) < ALBUM.unlockShards) return { save, ok: false, message: `ชิ้นส่วนยังไม่พอ (${shardsOf(save, id)}/${ALBUM.unlockShards})` };
  const next = welcomePuff({ ...save, shards: { ...save.shards, [id]: shardsOf(save, id) - ALBUM.unlockShards } }, id);
  return { save: next, ok: true, message: `${info.name} เข้าร่วมทีมแล้ว!` };
}

export function starUp(save: SaveData, id: string): ActionResult {
  const info = puffInfo(id);
  const stars = starsOf(save, id);
  const cost = starUpCost(stars);
  if (!info || !save.owned.includes(id)) return { save, ok: false, message: 'ยังไม่มีพัฟตัวนี้' };
  if (cost === undefined || stars >= MAX_STARS) return { save, ok: false, message: 'ดาวเต็มแล้ว' };
  if (shardsOf(save, id) < cost) return { save, ok: false, message: `ชิ้นส่วนไม่พอ (${shardsOf(save, id)}/${cost})` };
  return {
    save: { ...save, shards: { ...save.shards, [id]: shardsOf(save, id) - cost }, stars: { ...save.stars, [id]: stars + 1 } },
    ok: true,
    message: `${info.name} อัปดาว! ★+${stars + 1}`,
  };
}

/** 150 capsules (spark) let you pick any ★6 puff. */
export function sparkPick(save: SaveData, id: string): ActionResult {
  const info = puffInfo(id);
  if (!info || info.rarity !== 6) return { save, ok: false, message: 'เลือกได้เฉพาะพัฟ ★6' };
  if (save.pity.spark < CAPSULE.spark) return { save, ok: false, message: `ต้องเปิดครบ ${CAPSULE.spark} ครั้งก่อน` };
  const paid: SaveData = { ...save, pity: { ...save.pity, spark: save.pity.spark - CAPSULE.spark } };
  const { save: next } = applyPulls(paid, [{ puff: id, rarity: 6, pity: true }]);
  return { save: next, ok: true, message: `เลือก ${info.name} แล้ว!` };
}
