// Daily quest board on the save: today's quests, progress counters and payouts.
import { DAILY, QUESTS, bumpQuest, canClaimBonus, canClaimQuest, dayIndex, rollDaily, stagePetals, type DailyState, type QuestKind } from '@puff/sim';
import type { ActionResult } from './workshop';
import type { SaveData } from './save';
import { isOpen } from './unlocks';

export const tzOffset = (): number => new Date().getTimezoneOffset();
export const today = (now = Date.now()): number => dayIndex(now, tzOffset());

export const QUEST_TEXT: Record<QuestKind, { title: string; icon: string }> = {
  clear: { title: 'ผ่านด่าน', icon: '🚩' },
  bonk: { title: 'Bonk ดอกไม้ให้หายงอน', icon: '🌼' },
  ultimate: { title: 'ใช้ท่าไม้ตาย', icon: '✨' },
  levelup: { title: 'อัปเลเวลพัฟ', icon: '⬆️' },
  garden: { title: 'รดน้ำหรือเก็บดอกในสวน', icon: '🌱' },
  capsule: { title: 'เปิด Puff Capsule', icon: '🥚' },
  fish: { title: 'ตกปลาที่ Puff Pond', icon: '🎣' },
  arena: { title: 'ท้าประลองหมอน', icon: '🪶' },
  raid: { title: 'ตีบอส Raid', icon: '👑' },
  forge: { title: 'ตีบวกอุปกรณ์', icon: '🔨' },
  nap: { title: 'รับรางวัลตอนงีบ', icon: '💤' },
};

/** Quest kinds that make sense with what's open now. */
export function unlockedQuests(save: SaveData): QuestKind[] {
  const kinds: QuestKind[] = ['ultimate', 'levelup', 'garden', 'forge', 'nap'];
  if (isOpen(save, 'album')) kinds.push('capsule');
  if (isOpen(save, 'pond')) kinds.push('fish');
  if (isOpen(save, 'arena')) kinds.push('arena');
  if (isOpen(save, 'raid')) kinds.push('raid');
  return kinds;
}

export function currentDaily(save: SaveData, now = Date.now()): DailyState {
  return rollDaily(save.daily, today(now), unlockedQuests(save));
}

/** Rolls the board over at local midnight. */
export function ensureDaily(save: SaveData, now = Date.now()): SaveData {
  const daily = currentDaily(save, now);
  return daily === save.daily ? save : { ...save, daily };
}

/** Counts toward a quest (no-op if it isn't on today's board). */
export function bump(save: SaveData, kind: QuestKind, amount = 1): SaveData {
  const fresh = ensureDaily(save);
  const daily = bumpQuest(fresh.daily!, kind, amount);
  return daily === fresh.daily ? fresh : { ...fresh, daily };
}

export function claimQuest(save: SaveData, kind: QuestKind): ActionResult {
  const daily = currentDaily(save);
  if (!canClaimQuest(daily, kind)) return { save, ok: false, message: 'ยังทำภารกิจนี้ไม่ครบ' };
  const q = QUESTS[kind];
  return {
    save: { ...save, daily: { ...daily, claimed: [...daily.claimed, kind] }, dew: save.dew + q.dew, petals: save.petals + q.petals },
    ok: true,
    message: `ได้ ${q.dew} Dew Drop!`,
  };
}

export function claimBonus(save: SaveData): ActionResult {
  const daily = currentDaily(save);
  if (!canClaimBonus(daily)) return { save, ok: false, message: 'ทำภารกิจวันนี้ให้ครบก่อนนะ' };
  const petals = stagePetals(Math.max(1, save.stage - 1)) * DAILY.bonusStages;
  return {
    save: { ...save, daily: { ...daily, bonusClaimed: true }, dew: save.dew + DAILY.bonusDew, petals: save.petals + petals },
    ok: true,
    message: `กล่องโบนัส! +${DAILY.bonusDew} Dew Drop +${petals.toLocaleString('en-US')} Petal`,
  };
}
