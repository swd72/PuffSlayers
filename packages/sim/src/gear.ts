// Equipment: 5 slots, 7 tiers, random substats, named relics, and loot rolls. Deterministic given an Rng.
import type { Rng } from './rng';
import type { HeroClass } from './types';

export const SLOTS = ['weapon', 'hat', 'outfit', 'charm', 'trinket'] as const;
export type Slot = (typeof SLOTS)[number];

export const TIERS = ['crumb', 'fluffy', 'silky', 'dreamy', 'starry', 'mythic', 'cosmic'] as const;
export type TierName = (typeof TIERS)[number];
/** 0 = Crumb … 6 = Cosmic Cotton */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const STAT_KEYS = ['atkPct', 'hpPct', 'defPct', 'crit', 'dodge', 'haste', 'charge', 'luck'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type StatBlock = Partial<Record<StatKey, number>>;

export type RelicId =
  | 'carrot-excalibur'
  | 'bottomless-cheek-pouch'
  | 'grandmas-knitted-scarf'
  | 'moonlit-lullaby-bell'
  | 'sunflower-crown'
  | 'lucky-clover-pin';

export interface Item {
  readonly id: string;
  readonly slot: Slot;
  readonly tier: Tier;
  /** weapons only fit their class */
  readonly heroClass?: HeroClass;
  /** which icon/look of the slot (0–7; weapons use the tier) */
  readonly design: number;
  readonly relic?: RelicId;
  readonly main: { readonly stat: StatKey; readonly value: number };
  readonly subs: readonly { readonly stat: StatKey; readonly value: number }[];
  /** upgrade level (+N); missing = +0 */
  readonly plus?: number;
  /** failed upgrade tries at the current level (guarantee gauge) */
  readonly forgePity?: number;
  /** Stardust actually paid into this item (upgrade tries, carried through merge / transfer) */
  readonly dustPaid?: number;
}

/** Main stat gained per +1. */
export const PLUS_MAIN_STEP = 0.1;
export const plusOf = (item: Item): number => item.plus ?? 0;
/** Main stat after upgrades. */
export const mainValue = (item: Item): number => Math.round(item.main.value * (1 + PLUS_MAIN_STEP * plusOf(item)) * 1000) / 1000;

/** Main stat multiplier and substat count per tier (GDD §6.1). */
export const TIER_MULT: readonly number[] = [1, 1.3, 1.7, 2.2, 2.9, 3.8, 5];
export const TIER_SUBS: readonly number[] = [0, 1, 2, 3, 4, 4, 4];

const MAIN_BASE: Record<Slot, { stat: StatKey; value: number }> = {
  weapon: { stat: 'atkPct', value: 0.05 },
  hat: { stat: 'hpPct', value: 0.05 },
  outfit: { stat: 'defPct', value: 0.06 },
  charm: { stat: 'crit', value: 0.015 },
  trinket: { stat: 'charge', value: 0.03 },
};

export const SUB_BASE: Record<StatKey, number> = {
  atkPct: 0.02,
  hpPct: 0.025,
  defPct: 0.025,
  crit: 0.01,
  dodge: 0.008,
  haste: 0.015,
  charge: 0.02,
  luck: 0.03,
};

export interface RelicInfo {
  readonly slot: Slot;
  readonly tier: Tier;
  readonly heroClass?: HeroClass;
}

export const RELICS: Record<RelicId, RelicInfo> = {
  'carrot-excalibur': { slot: 'weapon', tier: 5, heroClass: 'carrot-knight' },
  'bottomless-cheek-pouch': { slot: 'charm', tier: 5 },
  'grandmas-knitted-scarf': { slot: 'charm', tier: 6 },
  'moonlit-lullaby-bell': { slot: 'weapon', tier: 6, heroClass: 'bell-bard' },
  'sunflower-crown': { slot: 'hat', tier: 4 },
  'lucky-clover-pin': { slot: 'trinket', tier: 4 },
};
export const RELIC_IDS = Object.keys(RELICS) as RelicId[];

/** Per-roll tier odds by stage band (GDD §6.11), highest tier last. */
const TIER_ODDS: readonly (readonly number[])[] = [
  [0.6, 0.3, 0.09, 0.009, 0.001, 0, 0], // stages 1–10
  [0.4, 0.38, 0.17, 0.045, 0.0045, 0.0005, 0], // 11–20
  [0.2, 0.35, 0.3, 0.12, 0.025, 0.005, 0], // 21+
];

export const LOOT = {
  rollsPerClear: 3,
  bossRolls: 1,
  giantRolls: 2,
  /** chance a giant boss drops a relic, before pity */
  relicChance: 0.08,
  /** giant clears without a relic before one is guaranteed */
  relicPity: 20,
} as const;

const pickFrom = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng.next() * list.length) % list.length] as T;

export function rollValue(rng: Rng, base: number, tier: Tier): number {
  const spread = 0.8 + rng.next() * 0.4;
  return Math.round(base * spread * (1 + tier * 0.15) * 1000) / 1000;
}

export function rollItem(rng: Rng, id: string, opts: { tier: Tier; slot: Slot; heroClass?: HeroClass; relic?: RelicId }): Item {
  const main = MAIN_BASE[opts.slot];
  const guardWeapon = opts.slot === 'weapon' && opts.heroClass === 'pillow-guard';
  const mainStat: StatKey = guardWeapon ? 'defPct' : main.stat;
  const pool = STAT_KEYS.filter((k) => k !== mainStat);
  const subs: { stat: StatKey; value: number }[] = [];
  for (let i = 0; i < (TIER_SUBS[opts.tier] ?? 0); i++) {
    const stat = pickFrom(rng, pool.filter((k) => !subs.some((s) => s.stat === k)));
    subs.push({ stat, value: rollValue(rng, SUB_BASE[stat], opts.tier) });
  }
  return {
    id,
    slot: opts.slot,
    tier: opts.tier,
    ...(opts.heroClass && opts.slot === 'weapon' ? { heroClass: opts.heroClass } : {}),
    design: opts.slot === 'weapon' ? opts.tier : Math.floor(rng.next() * 8),
    ...(opts.relic ? { relic: opts.relic } : {}),
    main: { stat: mainStat, value: Math.round(main.value * (TIER_MULT[opts.tier] ?? 1) * 1000) / 1000 },
    subs,
  };
}

export function relicItem(rng: Rng, id: string, relic: RelicId): Item {
  const info = RELICS[relic];
  return rollItem(rng, id, { tier: info.tier, slot: info.slot, heroClass: info.heroClass, relic });
}

/** Tier for one loot roll; luck nudges odds toward rarer tiers; `floor` guarantees at least that tier. */
export function rollTier(rng: Rng, stage: number, luck = 0, floor: Tier = 0): Tier {
  const band = TIER_ODDS[stage <= 10 ? 0 : stage <= 20 ? 1 : 2] ?? TIER_ODDS[0]!;
  const weights: number[] = band.map((p, t) => (t < floor ? 0 : p * (t >= 3 ? 1 + luck : 1)));
  // (some() instead of every(w === 0): TS would narrow the array to 0[])
  if (!weights.some((w) => w > 0)) weights[floor] = 1;
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng.next() * total;
  for (let t = 0; t < weights.length; t++) {
    roll -= weights[t] ?? 0;
    if (roll <= 0) return t as Tier;
  }
  return floor;
}

/** One random drop: any slot, weapons for a class in the team. */
export function rollDrop(rng: Rng, stage: number, opts: { classes: readonly HeroClass[]; luck: number; floor: Tier; id: string }): Item {
  const slot = pickFrom(rng, SLOTS);
  const heroClass = slot === 'weapon' ? pickFrom(rng, opts.classes) : undefined;
  return rollItem(rng, opts.id, { tier: rollTier(rng, stage, opts.luck, opts.floor), slot, heroClass });
}

export interface LootResult {
  readonly items: Item[];
  /** giant clears since the last relic */
  readonly relicPity: number;
}

/** Items for clearing a stage. Weapons are rolled for classes in the team. */
export function rollLoot(
  rng: Rng,
  stage: number,
  opts: { classes: readonly HeroClass[]; boss: boolean; giant: boolean; luck: number; relicPity: number; nextId: () => string },
): LootResult {
  const items: Item[] = [];
  const roll = (floor: Tier) => items.push(rollDrop(rng, stage, { ...opts, floor, id: opts.nextId() }));
  for (let i = 0; i < LOOT.rollsPerClear; i++) roll(0);
  if (opts.boss) for (let i = 0; i < LOOT.bossRolls; i++) roll(3);
  let relicPity = opts.relicPity;
  if (opts.giant) {
    for (let i = 0; i < LOOT.giantRolls; i++) roll(4);
    relicPity += 1;
    if (relicPity >= LOOT.relicPity || rng.next() < LOOT.relicChance * (1 + opts.luck)) {
      items.push(relicItem(rng, opts.nextId(), pickFrom(rng, RELIC_IDS)));
      relicPity = 0;
    }
  }
  return { items, relicPity };
}

export interface GearBonus {
  readonly stats: StatBlock;
  readonly relics: readonly RelicId[];
}

/** Sums the stats of equipped items. */
export function gearBonus(items: readonly Item[]): GearBonus {
  const stats: Record<string, number> = {};
  const add = (stat: StatKey, value: number) => {
    stats[stat] = Math.round(((stats[stat] ?? 0) + value) * 1000) / 1000;
  };
  for (const item of items) {
    add(item.main.stat, mainValue(item));
    for (const s of item.subs) add(s.stat, s.value);
  }
  return { stats: stats as StatBlock, relics: items.flatMap((i) => (i.relic ? [i.relic] : [])) };
}

/** A single comparable number for sorting / "equip best". */
export function itemScore(item: Item): number {
  const weight: Record<StatKey, number> = { atkPct: 1, hpPct: 0.8, defPct: 0.7, crit: 1.6, dodge: 1.4, haste: 1.2, charge: 1, luck: 0.4 };
  const relicBonus = item.relic ? 0.5 : 0;
  return mainValue(item) * weight[item.main.stat] + item.subs.reduce((s, x) => s + x.value * weight[x.stat], 0) + relicBonus;
}

/** Whether an item may go on a hero of this class. */
export const fitsClass = (item: Item, heroClass: HeroClass): boolean => item.slot !== 'weapon' || item.heroClass === heroClass;
