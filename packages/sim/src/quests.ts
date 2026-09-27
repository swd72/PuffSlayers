// Daily quests (GDD §0.4 "รายวัน"): a handful of small goals that reset every day, paying Dew Drops
// (for the Puff Capsule) and Petals. Which quests show up depends on the day and what is unlocked.
import type { Rng } from './rng';
import { createRng } from './rng';

export type QuestKind = 'clear' | 'bonk' | 'ultimate' | 'levelup' | 'garden' | 'capsule' | 'fish' | 'arena' | 'raid' | 'forge' | 'nap';

export interface QuestInfo {
  readonly kind: QuestKind;
  readonly target: number;
  readonly dew: number;
  readonly petals: number;
}

export const QUESTS: Record<QuestKind, QuestInfo> = {
  clear: { kind: 'clear', target: 3, dew: 30, petals: 0 },
  bonk: { kind: 'bonk', target: 60, dew: 20, petals: 0 },
  ultimate: { kind: 'ultimate', target: 12, dew: 20, petals: 0 },
  levelup: { kind: 'levelup', target: 3, dew: 20, petals: 0 },
  garden: { kind: 'garden', target: 2, dew: 20, petals: 0 },
  capsule: { kind: 'capsule', target: 1, dew: 20, petals: 0 },
  fish: { kind: 'fish', target: 3, dew: 30, petals: 0 },
  arena: { kind: 'arena', target: 2, dew: 30, petals: 0 },
  raid: { kind: 'raid', target: 1, dew: 30, petals: 0 },
  forge: { kind: 'forge', target: 1, dew: 20, petals: 0 },
  nap: { kind: 'nap', target: 1, dew: 20, petals: 0 },
};

export const DAILY = {
  /** quests offered per day */
  count: 5,
  /** always offered: the core loop */
  core: ['clear', 'bonk'] as readonly QuestKind[],
  /** finishing every quest of the day opens a bonus chest */
  bonusDew: 100,
  /** Petals in the bonus chest, in stage clears of the current stage */
  bonusStages: 2,
} as const;

const DAY_MS = 86_400_000;

/** Local calendar day number (tzOffsetMin = Date#getTimezoneOffset(), e.g. -420 for Bangkok). */
export const dayIndex = (now: number, tzOffsetMin = 0): number => Math.floor((now - tzOffsetMin * 60_000) / DAY_MS);
/** Weeks start on Monday (day 0 of the epoch was a Thursday). */
export const weekIndex = (now: number, tzOffsetMin = 0): number => Math.floor((dayIndex(now, tzOffsetMin) + 3) / 7);
/** ms until the next local midnight. */
export const msToNextDay = (now: number, tzOffsetMin = 0): number => DAY_MS - ((now - tzOffsetMin * 60_000) % DAY_MS);

/** The day's quests: the core two plus a seeded pick among what the player has unlocked. */
export function dailyQuests(day: number, unlocked: readonly QuestKind[]): QuestKind[] {
  const rng: Rng = createRng((day * 2654435761) >>> 0);
  const pool = unlocked.filter((k) => !DAILY.core.includes(k));
  const picked: QuestKind[] = [...DAILY.core];
  while (picked.length < DAILY.count && pool.length) {
    const i = Math.floor(rng.next() * pool.length);
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked;
}

export interface DailyState {
  readonly day: number;
  readonly quests: readonly QuestKind[];
  readonly progress: Readonly<Partial<Record<QuestKind, number>>>;
  readonly claimed: readonly QuestKind[];
  readonly bonusClaimed: boolean;
}

/** Starts a new day's board (or keeps today's). */
export function rollDaily(state: DailyState | null, day: number, unlocked: readonly QuestKind[]): DailyState {
  if (state && state.day === day) return state;
  return { day, quests: dailyQuests(day, unlocked), progress: {}, claimed: [], bonusClaimed: false };
}

/** Counts progress toward a quest (only if it is on today's board). */
export function bumpQuest(state: DailyState, kind: QuestKind, amount = 1): DailyState {
  if (!state.quests.includes(kind) || amount <= 0) return state;
  const now = state.progress[kind] ?? 0;
  const next = Math.min(QUESTS[kind].target, now + amount);
  return next === now ? state : { ...state, progress: { ...state.progress, [kind]: next } };
}

export const questDone = (state: DailyState, kind: QuestKind): boolean => (state.progress[kind] ?? 0) >= QUESTS[kind].target;
export const canClaimQuest = (state: DailyState, kind: QuestKind): boolean => state.quests.includes(kind) && questDone(state, kind) && !state.claimed.includes(kind);
export const canClaimBonus = (state: DailyState): boolean => !state.bonusClaimed && state.quests.every((k) => state.claimed.includes(k));
/** Things waiting to be collected (for the red dot on the board). */
export const claimableCount = (state: DailyState): number => state.quests.filter((k) => canClaimQuest(state, k)).length + (canClaimBonus(state) ? 1 : 0);
