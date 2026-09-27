// Forage & picnic (GDD §6.12): stages drop ingredients; before a stage each puff can be fed one.
// Every ingredient gives a buff for that stage — but some can't be eaten by some species
// (based on real pet care: no grapes / onion / chocolate for dogs, no citrus or almonds for hamsters,
// no avocado / acorns for bunnies…) and give a tummy ache instead. Pure and deterministic.
import type { StatBlock } from './gear';
import type { Rng } from './rng';
import type { Species } from './types';

export type IngredientId =
  | 'sweet-clover'
  | 'dandelion'
  | 'sunny-carrot'
  | 'sweet-potato'
  | 'sunflower-seeds'
  | 'crunchy-acorn'
  | 'bitter-almond'
  | 'wild-grapes'
  | 'lemon-drop'
  | 'forest-avocado'
  | 'wild-onion'
  | 'cocoa-pod'
  | 'glow-mushroom'
  | 'honeycomb'
  | 'wiggle-worm'
  | 'moon-berry';

export type IngredientRarity = 'common' | 'uncommon' | 'rare';

export interface IngredientInfo {
  readonly rarity: IngredientRarity;
  readonly buff: StatBlock;
  /** species that get a tummy ache from it */
  readonly toxicTo: readonly Species[];
  /** species that refuse it (no effect, not eaten) */
  readonly refusedBy: readonly Species[];
  /** species that love it: double buff */
  readonly favoriteOf: readonly Species[];
}

export const INGREDIENTS: Record<IngredientId, IngredientInfo> = {
  'sweet-clover': { rarity: 'common', buff: { hpPct: 0.08 }, toxicTo: [], refusedBy: [], favoriteOf: ['bunbun'] },
  dandelion: { rarity: 'common', buff: { dodge: 0.04 }, toxicTo: [], refusedBy: [], favoriteOf: ['bunbun'] },
  'sunny-carrot': { rarity: 'common', buff: { crit: 0.05 }, toxicTo: [], refusedBy: [], favoriteOf: ['bunbun'] },
  'sweet-potato': { rarity: 'common', buff: { atkPct: 0.08 }, toxicTo: [], refusedBy: [], favoriteOf: ['shibu'] },
  'sunflower-seeds': { rarity: 'common', buff: { luck: 0.1 }, toxicTo: [], refusedBy: [], favoriteOf: ['hamham'] },
  'crunchy-acorn': { rarity: 'uncommon', buff: { defPct: 0.12 }, toxicTo: ['bunbun', 'shibu'], refusedBy: [], favoriteOf: ['hamham'] },
  'bitter-almond': { rarity: 'uncommon', buff: { defPct: 0.1, hpPct: 0.05 }, toxicTo: ['hamham', 'shibu'], refusedBy: [], favoriteOf: [] },
  'wild-grapes': { rarity: 'common', buff: { haste: 0.08 }, toxicTo: ['shibu'], refusedBy: [], favoriteOf: [] },
  'lemon-drop': { rarity: 'common', buff: { charge: 0.12 }, toxicTo: ['hamham'], refusedBy: ['bunbun'], favoriteOf: [] },
  'forest-avocado': { rarity: 'uncommon', buff: { hpPct: 0.15 }, toxicTo: ['bunbun', 'shibu'], refusedBy: [], favoriteOf: [] },
  'wild-onion': { rarity: 'uncommon', buff: { atkPct: 0.12, crit: 0.03 }, toxicTo: ['bunbun', 'hamham', 'shibu'], refusedBy: [], favoriteOf: [] },
  // a trap: chocolate is bad for every puff — sell it, don't feed it
  'cocoa-pod': { rarity: 'uncommon', buff: { atkPct: 0.15 }, toxicTo: ['bunbun', 'hamham', 'shibu', 'molemo'], refusedBy: [], favoriteOf: [] },
  'glow-mushroom': { rarity: 'rare', buff: { charge: 0.2 }, toxicTo: ['shibu', 'bunbun'], refusedBy: [], favoriteOf: ['molemo'] },
  honeycomb: { rarity: 'uncommon', buff: { hpPct: 0.1, haste: 0.04 }, toxicTo: [], refusedBy: [], favoriteOf: ['hamham'] },
  // moles eat earthworms; nobody else will touch it
  'wiggle-worm': { rarity: 'uncommon', buff: { atkPct: 0.1, hpPct: 0.08 }, toxicTo: [], refusedBy: ['bunbun', 'hamham', 'shibu'], favoriteOf: ['molemo'] },
  'moon-berry': { rarity: 'rare', buff: { atkPct: 0.06, hpPct: 0.06, defPct: 0.06, crit: 0.03, charge: 0.06 }, toxicTo: [], refusedBy: [], favoriteOf: [] },
};
export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[];

export const PANTRY = {
  /** tummy ache for the stage: weaker and slower to charge */
  tummyAche: { hpPct: -0.15, atkPct: -0.12, charge: -0.15 } as StatBlock,
  favoriteMult: 2,
  forage: { perClear: 2, bossExtra: 2 },
  rarityWeight: { common: 70, uncommon: 25, rare: 5 } as Record<IngredientRarity, number>,
  /** Petals for selling one, by rarity */
  sellPetals: { common: 4, uncommon: 10, rare: 30 } as Record<IngredientRarity, number>,
} as const;

export type MealReaction = 'favorite' | 'good' | 'refuse' | 'tummyache';

export interface MealEffect {
  readonly reaction: MealReaction;
  /** stat changes for the next stage (empty when refused) */
  readonly stats: StatBlock;
  /** whether the ingredient is used up */
  readonly eaten: boolean;
}

const scale = (s: StatBlock, k: number): StatBlock =>
  Object.fromEntries(Object.entries(s).map(([key, v]) => [key, Math.round((v ?? 0) * k * 1000) / 1000])) as StatBlock;

export function mealEffect(id: IngredientId, species: Species): MealEffect {
  const info = INGREDIENTS[id];
  if (info.toxicTo.includes(species)) return { reaction: 'tummyache', stats: PANTRY.tummyAche, eaten: true };
  if (info.refusedBy.includes(species)) return { reaction: 'refuse', stats: {}, eaten: false };
  if (info.favoriteOf.includes(species)) return { reaction: 'favorite', stats: scale(info.buff, PANTRY.favoriteMult), eaten: true };
  return { reaction: 'good', stats: info.buff, eaten: true };
}

/** Adds stat blocks (gear + meal). */
export function addStats(a: StatBlock, b: StatBlock): StatBlock {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.round(((out[k] ?? 0) + (v ?? 0)) * 1000) / 1000;
  return out as StatBlock;
}

/** Ingredients found on a stage clear (weighted by rarity; luck favors rarer finds). */
export function rollForage(rng: Rng, opts: { boss: boolean; luck: number }): IngredientId[] {
  const count = PANTRY.forage.perClear + (opts.boss ? PANTRY.forage.bossExtra : 0);
  const weight = (id: IngredientId) => {
    const r = INGREDIENTS[id].rarity;
    return PANTRY.rarityWeight[r] * (r === 'common' ? 1 : 1 + opts.luck);
  };
  const total = INGREDIENT_IDS.reduce((s, id) => s + weight(id), 0);
  return Array.from({ length: count }, () => {
    let roll = rng.next() * total;
    for (const id of INGREDIENT_IDS) {
      roll -= weight(id);
      if (roll <= 0) return id;
    }
    return INGREDIENT_IDS[0]!;
  });
}
