import type { BossKind, EnemyKind, HeroClass, Point, Species, Stats } from './types';

/** Base stats at level 1; tuned for readability of the prototype, not final balance. */
export const CLASS_STATS: Record<HeroClass, Stats> = {
  'pillow-guard': { maxHp: 1600, atk: 70, def: 40, attackInterval: 1300, crit: 0.05, dodge: 0, range: 28, moveSpeed: 62 },
  'carrot-knight': { maxHp: 1100, atk: 150, def: 22, attackInterval: 900, crit: 0.12, dodge: 0, range: 30, moveSpeed: 80 },
  'leaf-archer': { maxHp: 800, atk: 145, def: 12, attackInterval: 1000, crit: 0.18, dodge: 0, range: 170, moveSpeed: 70 },
  'bubble-mage': { maxHp: 820, atk: 110, def: 12, attackInterval: 1200, crit: 0.08, dodge: 0, range: 145, moveSpeed: 62 },
  'mochi-cleric': { maxHp: 900, atk: 60, def: 16, attackInterval: 1100, crit: 0.05, dodge: 0, range: 130, moveSpeed: 62 },
  'bell-bard': { maxHp: 950, atk: 80, def: 18, attackInterval: 1100, crit: 0.08, dodge: 0, range: 130, moveSpeed: 66 },
  'root-druid': { maxHp: 980, atk: 105, def: 20, attackInterval: 1150, crit: 0.06, dodge: 0, range: 150, moveSpeed: 58 },
};

export const ENEMY_STATS: Record<EnemyKind, Stats> = {
  daisy: { maxHp: 630, atk: 45, def: 8, attackInterval: 1300, crit: 0.05, dodge: 0, range: 26, moveSpeed: 44 },
  tulip: { maxHp: 490, atk: 55, def: 6, attackInterval: 1000, crit: 0.08, dodge: 0.05, range: 26, moveSpeed: 58 },
  sunflower: { maxHp: 740, atk: 60, def: 10, attackInterval: 1500, crit: 0.1, dodge: 0, range: 120, moveSpeed: 32 },
  lavender: { maxHp: 560, atk: 35, def: 8, attackInterval: 1400, crit: 0.05, dodge: 0, range: 105, moveSpeed: 40 },
  cactus: { maxHp: 1120, atk: 50, def: 24, attackInterval: 1600, crit: 0.05, dodge: 0, range: 28, moveSpeed: 30 },
  'honey-bud': { maxHp: 600, atk: 40, def: 8, attackInterval: 1500, crit: 0.05, dodge: 0, range: 115, moveSpeed: 38 },
};

export const BOSS_STATS: Record<BossKind, Stats> = {
  'queen-rafflesia': { maxHp: 22000, atk: 95, def: 22, attackInterval: 1600, crit: 0.08, dodge: 0, range: 70, moveSpeed: 14 },
  'sunflower-colossus': { maxHp: 26000, atk: 105, def: 32, attackInterval: 1800, crit: 0.08, dodge: 0, range: 150, moveSpeed: 10 },
  'lotus-moon-sage': { maxHp: 19000, atk: 85, def: 16, attackInterval: 1400, crit: 0.1, dodge: 0.05, range: 140, moveSpeed: 16 },
};

/** Which minion each boss summons. */
export const BOSS_MINION: Record<BossKind, EnemyKind> = {
  'queen-rafflesia': 'tulip',
  'sunflower-colossus': 'sunflower',
  'lotus-moon-sage': 'daisy',
};

export const ENEMY_NAMES: Record<EnemyKind | BossKind, string> = {
  daisy: 'Daisy Dozer',
  tulip: 'Tulip Pip',
  sunflower: 'Sunflower Spitter',
  lavender: 'Lavender Nurse',
  cactus: 'Cactus Cuddle',
  'honey-bud': 'Honey Bud',
  'queen-rafflesia': 'Queen Rafflesia',
  'sunflower-colossus': 'Sunflower Colossus',
  'lotus-moon-sage': 'Lotus Moon Sage',
};

export const SPECIES_PASSIVE: Record<Species, { hp: number; crit: number; dodge: number }> = {
  bunbun: { hp: 1, crit: 0, dodge: 0.08 }, // Moon Hop
  hamham: { hp: 1.1, crit: 0, dodge: 0 }, // Cheek Pouch (HP part)
  shibu: { hp: 1, crit: 0.08, dodge: 0 }, // Doge Pride
  molemo: { hp: 1.05, crit: 0, dodge: 0.03 }, // Earthy Paws (also: sticky honey can't slow a mole's digging paws)
};

/**
 * Playable ground in world px (the renderer uses the same 540×960 space).
 * High top-down map view: sky/horizon above minY, foreground framing below maxY.
 */
export const ARENA = { minX: 30, maxX: 510, minY: 270, maxY: 730 } as const;
export const ARENA_CENTER: Point = { x: (ARENA.minX + ARENA.maxX) / 2, y: (ARENA.minY + ARENA.maxY) / 2 };
/** bosses stand a little above the middle, so the fight fills the centre of the screen (not the top edge) */
export const BOSS_SPOT: Point = { x: ARENA_CENTER.x, y: ARENA_CENTER.y - 70 };

/** Loose hero formation, offsets from the arena center. */
export const FORMATION: Record<HeroClass, Point> = {
  'pillow-guard': { x: 20, y: 10 },
  'carrot-knight': { x: 55, y: 55 },
  'leaf-archer': { x: -60, y: 25 },
  'bubble-mage': { x: -45, y: 80 },
  'mochi-cleric': { x: 5, y: 125 },
  'bell-bard': { x: 60, y: 120 },
  'root-druid': { x: -10, y: 70 },
};

/** Area-of-effect radius of each ultimate, around the target (or along the roll for the guard). */
export const ULTIMATE_RADIUS: Record<HeroClass, number> = {
  'pillow-guard': 42,
  'carrot-knight': 95,
  'leaf-archer': 90,
  'bubble-mage': 90,
  'mochi-cleric': Infinity,
  'bell-bard': Infinity,
  'root-druid': 115,
};

/** Each class charges its ultimate at its own pace (ms from empty to ready, before attack bonuses). */
/** Long enough that the team fires one ultimate every ~6–8 s: each one is a 1.5–2 s combo with a cut-in. */
export const ULTIMATE_COOLDOWN_MS: Record<HeroClass, number> = {
  'leaf-archer': 20000,
  'carrot-knight': 22000,
  'mochi-cleric': 18000,
  'bubble-mage': 24000,
  'bell-bard': 32000,
  'pillow-guard': 35000,
  'root-druid': 26000,
};

/**
 * How long each ultimate's combo plays on screen (plus a short breath). No other ultimate may start in that
 * window, so combos never pile on top of each other; the cast just waits its turn.
 */
export const ULTIMATE_COMBO_MS: Record<HeroClass, number> = {
  'pillow-guard': 2000,
  'carrot-knight': 1900,
  'leaf-archer': 2200,
  'bubble-mage': 2000,
  'mochi-cleric': 1900,
  'bell-bard': 2000,
  'root-druid': 3000,
};

export const ULTIMATE_DAMAGE: Record<HeroClass, number> = {
  'pillow-guard': 3.5,
  'carrot-knight': 6.2,
  'leaf-archer': 4.8,
  'bubble-mage': 4.2,
  'mochi-cleric': 0,
  'bell-bard': 0,
  'root-druid': 3.6,
};

export const TUNING = {
  tickMs: 100,
  levelGrowth: 0.06,
  /** damage scales with the level gap between attacker and defender */
  levelGapPerLevel: 0.05,
  levelGapClamp: { min: 0.35, max: 2 },
  critMultiplier: 1.8,
  damageSpread: 0.1,
  bardBuffMs: 8000,
  bardBuffAtk: 1.3,
  healThreshold: 0.7,
  /** Mochi Rain heals every ally this share of max HP (ultimates are rare, so it is big) */
  clericUltHeal: 0.55,
  /** small bonus charge on top of the cooldown, so fighting still speeds things up */
  energyPerAttack: 1.5,
  energyPerHit: 1,
  /** how long the ultimate cut-in holds the battle before the skill fires */
  castMs: 450,
  /** enemies within this distance of a Pillow Guard must hit it first */
  tauntRadius: 120,
  /** allies push apart when closer than this */
  personalSpace: 24,
  /** ranged units back off when a foe gets closer than this share of their range */
  kiteRatio: 0.4,
  spawnRadius: 260,
  /** Arena: how far behind the center line the rival team lines up */
  rivalGap: 60,
  /** enemies come from the far side and both flanks (a little below the middle too), so fights fill the whole field */
  spawnArc: { from: -Math.PI * 1.25, to: Math.PI * 0.25 },
  /** Hamham Cheek Cannon */
  cheek: { everyMs: 6000, seeds: 3, damage: 0.7, range: 170 },
  /** Pillow Guard Ultimate Roll */
  roll: { length: 170, knockback: 26 },
  /** Bubble Prison */
  bubbleStunMs: 4000,
  /** Root Druid: basic attacks may root (can't move, can still hit), the ultimate roots everything it hits */
  root: { basicChance: 0.3, basicMs: 1200, ultimateMs: 3000 },
  /** Honey Bud sticky honey */
  sticky: { ms: 2500, slow: 0.55 },
  /** boss behaviour */
  boss: { summonEveryMs: 12000, summonCount: 3, slamEveryMs: 9000, telegraphMs: 1100, slamRadius: 80, slamDamage: 2.4 },
  /** giant boss (every 10th stage) on top of the normal boss rules */
  giant: {
    hp: 2.4,
    atk: 1.2,
    enrageAt: 0.5,
    /** timers run this much faster once enraged */
    enragedHaste: 1.5,
    enragedSummons: 5,
    /** enraged slams drop this many circles at once */
    enragedSlams: 3,
  },
  /** relic numbers (GDD §6.4) */
  relic: { excaliburDamage: 1.6, pouchSeeds: 5, scarfReviveHp: 0.4, lullabyStunMs: 1000, lullabyRadius: 130, crownWaveHeal: 0.15 },
} as const;

/** Level the stage is balanced for: a team at this level clears a wave in roughly 6–10 s. */
export const recommendedLevel = (stage: number): number => 6 + stage * 2;
