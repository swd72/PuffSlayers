// "What should I do next?" — the village's guide. Looks at the save and lists the most useful next steps,
// so a new player always has one clear goal (and a returning one sees what's waiting).
import { chapterOf, claimableCount, isBloomed, isBossStage, isGiantStage, levelUpCost, recommendedLevel } from '@puff/sim';
import { freePullReady } from './album';
import { currentDaily } from './daily';
import { pendingAuto } from './pond';
import { arenaTicketsLeft, raidTicketsLeft } from './pvp';
import { heroLevel, activeTeam, teamLevel, type SaveData } from './save';
import { isOpen } from './unlocks';

export type GoalAction = 'adventure' | 'bag' | 'garden' | 'album' | 'board' | 'pond' | 'arena' | 'raid' | 'nap';

export interface Goal {
  readonly id: string;
  readonly icon: string;
  readonly text: string;
  readonly action: GoalAction;
  /** something is ready to collect (shows a dot) */
  readonly ready?: boolean;
}

/** Stages in a chapter (every 5th a boss, the 10th a giant). */
export const CHAPTER_LEN = 10;
export const CHAPTER_NAMES = ['ทุ่งงีบหลับ', 'ป่าแครอทกรอบ', 'หนองบัวจันทร์', 'หุบเขาทานตะวัน', 'ทะเลนม', 'สระดาว'];
export const chapterName = (stage: number): string => CHAPTER_NAMES[(chapterOf(stage) - 1) % CHAPTER_NAMES.length] ?? '';
/** "1-7" style label: chapter-stageInChapter. */
export const stageLabel = (stage: number): string => `${chapterOf(stage)}-${((stage - 1) % CHAPTER_LEN) + 1}`;

export function goals(save: SaveData, now = Date.now()): Goal[] {
  const out: Goal[] = [];
  if (save.pendingNap) out.push({ id: 'nap', icon: '💤', text: 'รับของที่ได้ตอนงีบ', action: 'nap', ready: true });
  const daily = currentDaily(save, now);
  if (claimableCount(daily)) out.push({ id: 'quests', icon: '📜', text: 'รับรางวัลภารกิจรายวัน', action: 'board', ready: true });
  const blooms = save.plots.filter((p) => p && isBloomed(p, now)).length;
  if (blooms) out.push({ id: 'bloom', icon: '🌸', text: `ดอกไม้บานแล้ว ${blooms} แปลง — ไปเก็บ`, action: 'garden', ready: true });
  if (isOpen(save, 'album') && freePullReady(save, now)) out.push({ id: 'capsule', icon: '🥚', text: 'สุ่ม Puff Capsule ฟรีวันนี้', action: 'album', ready: true });
  if (isOpen(save, 'pond') && pendingAuto(save, now).length) out.push({ id: 'fish', icon: '🎣', text: 'พัฟที่บ่อตกปลาได้ปลามาแล้ว', action: 'pond', ready: true });

  // growth: level up when behind and Petals allow it
  const rec = recommendedLevel(save.stage);
  const lowest = activeTeam(save).reduce((m, h) => Math.min(m, heroLevel(save, h.id)), Infinity);
  if (teamLevel(save) < rec && Number.isFinite(lowest) && save.petals >= levelUpCost(lowest)) {
    out.push({ id: 'level', icon: '⬆️', text: `อัปเลเวลทีมให้ถึง Lv.${rec} (มี Petal พอแล้ว)`, action: 'bag' });
  }
  const emptyPlot = save.plots.some((p) => p === null);
  if (emptyPlot && Object.values(save.seeds).some((n) => (n ?? 0) > 0)) out.push({ id: 'plant', icon: '🌱', text: 'ปลูกเมล็ดในแปลงว่าง', action: 'garden' });

  // the main road: the next stage, with how far the next boss is
  const toBoss = 5 - ((save.stage - 1) % 5) - 1;
  const where = isGiantStage(save.stage) ? 'บอสยักษ์ประจำบท!' : isBossStage(save.stage) ? 'ด่านบอส!' : toBoss > 0 ? `อีก ${toBoss} ด่านถึงบอส` : '';
  out.push({ id: 'stage', icon: '🚩', text: `ผ่านด่าน ${stageLabel(save.stage)} ${where}`.trim(), action: 'adventure' });

  if (isOpen(save, 'arena') && arenaTicketsLeft(save) > 0) out.push({ id: 'arena', icon: '🪶', text: `ท้าประลองหมอน (เหลือ ${arenaTicketsLeft(save)} ครั้ง)`, action: 'arena' });
  if (isOpen(save, 'raid') && raidTicketsLeft(save) > 0) out.push({ id: 'raid', icon: '👑', text: `ตีบอส Raid ประจำสัปดาห์ (เหลือ ${raidTicketsLeft(save)} ครั้ง)`, action: 'raid' });
  return out;
}
