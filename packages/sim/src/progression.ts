// Petal economy: what a stage pays, what a level costs, and the Nap Bank (offline rewards, GDD §7).
// Costs and income grow by the same factor per stage, so the pace stays the same deep into the game.
import { rollDrop, type Item } from './gear';
import type { Rng } from './rng';
import type { HeroClass } from './types';

export const PROGRESSION = {
  /** Petal cost of Lv.1 → 2; each level costs this much more than the last */
  levelCostBase: 12,
  levelCostGrowth: 1.08,
  bonkPetalsBase: 10,
  /** matches two levels of cost growth, since the recommended level rises 2 per stage */
  bonkPetalsGrowth: 1.08 ** 2,
  bossBonkMult: 5,
  /** stage-clear bonus, in bonks */
  clearBonusBonks: 5,
} as const;

export const NAP = {
  capMs: 12 * 60 * 60 * 1000,
  /** shorter absences are not worth a popup */
  minMs: 2 * 60 * 1000,
  /** Petals worth this many stage clears per hour asleep */
  stagesPerHour: 1.2,
  itemEveryMin: 40,
  stardustEveryMin: 10,
} as const;

/** Petals to raise a hero from `level` to `level + 1`. */
export const levelUpCost = (level: number): number =>
  Math.round(PROGRESSION.levelCostBase * PROGRESSION.levelCostGrowth ** Math.max(0, level - 1));

/** Petals for raising a hero several levels in a row. */
export function levelUpCostMany(level: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += levelUpCost(level + i);
  return total;
}

/** How many levels a budget buys, starting at `level`. */
export function affordableLevels(level: number, petals: number): number {
  let n = 0;
  let left = petals;
  while (left >= levelUpCost(level + n)) {
    left -= levelUpCost(level + n);
    n++;
  }
  return n;
}

export const bonkPetals = (stage: number, boss = false): number =>
  Math.round(PROGRESSION.bonkPetalsBase * PROGRESSION.bonkPetalsGrowth ** Math.max(0, stage - 1)) * (boss ? PROGRESSION.bossBonkMult : 1);

export const clearPetals = (stage: number): number => bonkPetals(stage) * PROGRESSION.clearBonusBonks;

/** Rough Petals for one full clear (18 flowers + the clear bonus); the Nap Bank pays in these. */
export const stagePetals = (stage: number): number => bonkPetals(stage) * 18 + clearPetals(stage);

export interface NapReward {
  /** time counted, after the cap */
  readonly ms: number;
  readonly petals: number;
  readonly stardust: number;
  readonly items: readonly Item[];
}

/** Rewards for time away, farming the last cleared stage. Empty below the minimum nap. */
export function napReward(
  rng: Rng,
  opts: { stage: number; elapsedMs: number; classes: readonly HeroClass[]; luck: number; nextId: () => string },
): NapReward {
  // a corrupt or missing clock value must never turn Petals into NaN
  const elapsed = Number.isFinite(opts.elapsedMs) ? opts.elapsedMs : 0;
  const ms = Math.min(Math.max(0, elapsed), NAP.capMs);
  if (ms < NAP.minMs) return { ms: 0, petals: 0, stardust: 0, items: [] };
  const minutes = ms / 60000;
  const farmStage = Math.max(1, opts.stage - 1);
  const items = Array.from({ length: Math.floor(minutes / NAP.itemEveryMin) }, () =>
    rollDrop(rng, farmStage, { classes: opts.classes, luck: opts.luck, floor: 0, id: opts.nextId() }),
  );
  return {
    ms,
    petals: Math.round(stagePetals(farmStage) * NAP.stagesPerHour * (minutes / 60)),
    stardust: Math.floor(minutes / NAP.stardustEveryMin),
    items,
  };
}
