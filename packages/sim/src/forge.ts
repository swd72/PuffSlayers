// Gear crafting (GDD §6.6): upgrade (+N), merge 3 → next tier, salvage into Stardust, reroll a substat, move +N.
// Pure and deterministic given an Rng; the caller pays the costs and swaps items in the bag.
import { SUB_BASE, STAT_KEYS, plusOf, rollItem, rollValue, type Item, type StatKey, type Tier } from './gear';
import type { Rng } from './rng';

/** Highest upgrade level per tier (GDD §6.1). */
export const MAX_PLUS: readonly number[] = [5, 7, 9, 11, 13, 15, 15];

export const FORGE = {
  /** +1 … +3 always succeed; after that the chance drops by this much per level */
  safePlus: 3,
  chanceStep: 0.09,
  minChance: 0.3,
  /** Mythic and Cosmic cannot be merged */
  maxMergeTier: 4,
  /** Stardust for salvaging, by tier */
  salvageDust: [2, 4, 8, 14, 24, 40, 60],
  /** share of the Stardust spent on upgrades that comes back on salvage */
  salvageRefund: 0.5,
} as const;

export const maxPlus = (item: Item): number => MAX_PLUS[item.tier] ?? 5;

export interface UpgradeCost {
  readonly petals: number;
  readonly stardust: number;
}

/** Cost of the next +1 attempt. Stardust is only needed from +3 on. */
export function upgradeCost(item: Item): UpgradeCost {
  const plus = plusOf(item);
  return {
    petals: 20 * (item.tier + 1) * (plus + 1),
    stardust: plus < FORGE.safePlus ? 0 : (item.tier + 1) * (plus - FORGE.safePlus + 1),
  };
}

export const upgradeChance = (item: Item): number => {
  const plus = plusOf(item);
  return plus < FORGE.safePlus ? 1 : Math.max(FORGE.minChance, 1 - FORGE.chanceStep * (plus - FORGE.safePlus + 1));
};

/** Failed tries at this level before a success is guaranteed. */
export const pityNeeded = (item: Item): number => Math.ceil(1 / upgradeChance(item)) - 1;

export interface UpgradeResult {
  readonly item: Item;
  readonly success: boolean;
}

/** One +1 attempt. Failing never breaks or lowers the item; it only fills the guarantee gauge. */
export function upgradeItem(rng: Rng, item: Item): UpgradeResult {
  if (plusOf(item) >= maxPlus(item)) return { item, success: false };
  const pity = item.forgePity ?? 0;
  const success = pity >= pityNeeded(item) || rng.next() < upgradeChance(item);
  const paid = dustPaid(item) + upgradeCost(item).stardust;
  const withPaid = paid > 0 ? { dustPaid: paid } : {};
  if (!success) return { item: { ...item, ...withPaid, forgePity: pity + 1 }, success };
  const { forgePity: _cleared, ...rest } = item;
  return { item: { ...rest, ...withPaid, plus: plusOf(item) + 1 }, success };
}

/** Stardust paid into the item so far (refunded in part on salvage). */
export const dustPaid = (item: Item): number => item.dustPaid ?? 0;

export const salvageValue = (item: Item): number =>
  (FORGE.salvageDust[item.tier] ?? 2) + Math.floor(dustPaid(item) * FORGE.salvageRefund);

export const canMerge = (items: readonly Item[]): boolean =>
  items.length === 3 && items.every((i) => !i.relic && i.tier === items[0]!.tier && i.tier <= FORGE.maxMergeTier);

/**
 * Three items of one tier → one item of the next tier, in the first item's slot (and class, for weapons).
 * The best +N of the three carries over, capped by the new tier.
 */
export function mergeItems(rng: Rng, id: string, items: readonly Item[]): Item {
  if (!canMerge(items)) throw new Error('mergeItems: need 3 non-relic items of the same tier (Starry or lower)');
  const lead = items[0]!;
  const tier = (lead.tier + 1) as Tier;
  const made = rollItem(rng, id, { tier, slot: lead.slot, heroClass: lead.heroClass });
  const plus = Math.max(...items.map(plusOf));
  // refunds follow what was really paid, so merging can't turn cheap upgrades into pricier ones
  const paid = items.reduce((sum, i) => sum + dustPaid(i), 0);
  return { ...made, ...(plus > 0 ? { plus: Math.min(plus, MAX_PLUS[tier] ?? plus) } : {}), ...(paid > 0 ? { dustPaid: paid } : {}) };
}

export const rerollCost = (item: Item): number => 3 * (item.tier + 1);

/** Replaces one substat with a fresh roll of a stat the item doesn't have yet. */
export function rerollSub(rng: Rng, item: Item, index: number): Item {
  if (index < 0 || index >= item.subs.length) throw new Error(`rerollSub: no substat ${index}`);
  const taken = new Set<StatKey>([item.main.stat, ...item.subs.filter((_, i) => i !== index).map((s) => s.stat)]);
  const pool = STAT_KEYS.filter((k) => !taken.has(k));
  const stat = pool[Math.floor(rng.next() * pool.length) % pool.length]!;
  const subs = item.subs.map((s, i) => (i === index ? { stat, value: rollValue(rng, SUB_BASE[stat], item.tier) } : s));
  return { ...item, subs };
}

/** Free move of +N between two items of the same tier (so a new drop doesn't waste old upgrades). */
export function canTransferPlus(from: Item, to: Item): boolean {
  return from.id !== to.id && from.tier === to.tier && plusOf(from) > plusOf(to);
}

export function transferPlus(from: Item, to: Item): { from: Item; to: Item } {
  if (!canTransferPlus(from, to)) throw new Error('transferPlus: needs a higher +N on a same-tier item');
  const { plus: _moved, forgePity: _p1, dustPaid: _d1, ...bare } = from;
  const { forgePity: _p2, ...target } = to;
  const paid = dustPaid(from) + dustPaid(to);
  return { from: bare, to: { ...target, plus: plusOf(from), ...(paid > 0 ? { dustPaid: paid } : {}) } };
}
