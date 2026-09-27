import { describe, expect, it } from 'vitest';
import {
  FORGE,
  MAX_PLUS,
  canMerge,
  canTransferPlus,
  createRng,
  dustPaid,
  gearBonus,
  itemScore,
  mainValue,
  mergeItems,
  pityNeeded,
  relicItem,
  rerollCost,
  rerollSub,
  rollItem,
  salvageValue,
  transferPlus,
  upgradeChance,
  upgradeCost,
  upgradeItem,
  type Item,
  type Tier,
} from '../src';

const hat = (tier: Tier, seed = 1, id = 'h'): Item => rollItem(createRng(seed), id, { tier, slot: 'hat' });

/** An rng that always rolls the same number (0.99 = every chance-based try fails). */
const fixedRng = (value: number) => ({ seed: 0, next: () => value });

describe('upgrade (+N)', () => {
  it('always succeeds up to the safe level and costs no Stardust there', () => {
    let item = hat(2);
    for (let i = 0; i < FORGE.safePlus; i++) {
      expect(upgradeCost(item).stardust).toBe(0);
      const r = upgradeItem(fixedRng(0.99), item);
      expect(r.success).toBe(true);
      item = r.item;
    }
    expect(item.plus).toBe(FORGE.safePlus);
    expect(upgradeCost(item).stardust).toBeGreaterThan(0);
  });

  it('raises the main stat and the item score', () => {
    const base = hat(3);
    const up = { ...base, plus: 5 };
    expect(mainValue(up)).toBeCloseTo(base.main.value * 1.5, 2);
    expect(gearBonus([up]).stats.hpPct).toBeGreaterThan(gearBonus([base]).stats.hpPct ?? 0);
    expect(itemScore(up)).toBeGreaterThan(itemScore(base));
  });

  it('never breaks on failure and guarantees success once the gauge is full', () => {
    let item: Item = { ...hat(4), plus: 9 };
    expect(upgradeChance(item)).toBeLessThan(1);
    const needed = pityNeeded(item);
    for (let i = 0; i < needed; i++) {
      const r = upgradeItem(fixedRng(0.99), item);
      expect(r.success).toBe(false);
      expect(r.item.plus).toBe(9);
      item = r.item;
    }
    expect(item.forgePity).toBe(needed);
    const done = upgradeItem(fixedRng(0.99), item);
    expect(done.success).toBe(true);
    expect(done.item.plus).toBe(10);
    expect(done.item.forgePity).toBeUndefined();
  });

  it('stops at the tier cap', () => {
    const capped = { ...hat(0), plus: MAX_PLUS[0] };
    const r = upgradeItem(createRng(1), capped);
    expect(r.success).toBe(false);
    expect(r.item).toBe(capped);
  });

  it('chance never falls below the floor', () => {
    expect(upgradeChance({ ...hat(6), plus: 14 })).toBe(FORGE.minChance);
  });
});

describe('merge', () => {
  it('turns three same-tier items into one of the next tier in the first slot', () => {
    const rng = createRng(3);
    const a = rollItem(rng, 'a', { tier: 1, slot: 'weapon', heroClass: 'leaf-archer' });
    const b = { ...hat(1, 4, 'b'), plus: 4 };
    const c = hat(1, 5, 'c');
    const made = mergeItems(createRng(7), 'm', [a, b, c]);
    expect(made.tier).toBe(2);
    expect(made.slot).toBe('weapon');
    expect(made.heroClass).toBe('leaf-archer');
    expect(made.plus).toBe(4);
    expect(made.id).toBe('m');
  });

  it('refuses mixed tiers, relics, Mythic and pairs', () => {
    expect(canMerge([hat(1), hat(1), hat(2)])).toBe(false);
    expect(canMerge([hat(5), hat(5), hat(5)])).toBe(false);
    expect(canMerge([hat(4), hat(4), relicItem(createRng(1), 'r', 'sunflower-crown')])).toBe(false);
    expect(canMerge([hat(1), hat(1)])).toBe(false);
    expect(canMerge([hat(4), hat(4), hat(4)])).toBe(true);
    expect(() => mergeItems(createRng(1), 'x', [hat(1), hat(2), hat(1)])).toThrow();
  });

  it('caps a carried +N at the new tier limit', () => {
    const made = mergeItems(createRng(2), 'm', [{ ...hat(0), plus: 5 }, hat(0), hat(0)]);
    expect(made.plus).toBeLessThanOrEqual(MAX_PLUS[1]!);
    expect(mergeItems(createRng(2), 'n', [hat(0), hat(0), hat(0)]).plus).toBeUndefined();
  });
});

describe('salvage & reroll', () => {
  it('pays more Stardust for higher tiers and refunds some upgrade dust', () => {
    expect(salvageValue(hat(4))).toBeGreaterThan(salvageValue(hat(1)));
    let upgraded = hat(2);
    for (let i = 0; i < 6; i++) upgraded = upgradeItem(createRng(i), upgraded).item;
    expect(dustPaid(upgraded)).toBeGreaterThan(0);
    expect(salvageValue(upgraded)).toBe(FORGE.salvageDust[2]! + Math.floor(dustPaid(upgraded) * FORGE.salvageRefund));
  });

  it('counts Stardust paid on failed tries too', () => {
    const item = { ...hat(4), plus: 8 };
    const failed = upgradeItem(fixedRng(0.99), item).item;
    expect(failed.plus).toBe(8);
    expect(dustPaid(failed)).toBe(upgradeCost(item).stardust);
  });

  it('merging never refunds more Stardust than was paid (no merge → salvage loop)', () => {
    let a = hat(0, 1, 'a');
    while ((a.plus ?? 0) < MAX_PLUS[0]!) a = upgradeItem(createRng(1), a).item;
    const made = mergeItems(createRng(2), 'm', [a, hat(0, 2, 'b'), hat(0, 3, 'c')]);
    expect(dustPaid(made)).toBe(dustPaid(a));
    const junkValue = 3 * salvageValue(hat(0));
    expect(salvageValue(made) - FORGE.salvageDust[1]!).toBeLessThanOrEqual(dustPaid(a));
    expect(salvageValue(made)).toBeLessThanOrEqual(salvageValue(a) + junkValue);
  });

  it('rerolls one substat into a stat the item does not already have', () => {
    const item = hat(4, 9);
    for (let seed = 1; seed < 20; seed++) {
      const next = rerollSub(createRng(seed), item, 1);
      const stats = [next.main.stat, ...next.subs.map((s) => s.stat)];
      expect(new Set(stats).size).toBe(stats.length);
      expect(next.subs[0]).toEqual(item.subs[0]);
      expect(next.subs).toHaveLength(item.subs.length);
    }
    expect(rerollCost(item)).toBeGreaterThan(rerollCost(hat(1)));
    expect(() => rerollSub(createRng(1), hat(0), 0)).toThrow();
  });
});

describe('transfer +N', () => {
  it('moves upgrades to a same-tier item for free', () => {
    const old = { ...hat(3, 1, 'old'), plus: 7, forgePity: 1, dustPaid: 20 };
    const fresh = hat(3, 2, 'new');
    expect(canTransferPlus(old, fresh)).toBe(true);
    const { from, to } = transferPlus(old, fresh);
    expect(from.plus).toBeUndefined();
    expect(from.forgePity).toBeUndefined();
    expect(to.plus).toBe(7);
    expect(to.dustPaid).toBe(20);
    expect(from.dustPaid).toBeUndefined();
  });

  it('refuses other tiers or a lower +N', () => {
    expect(canTransferPlus({ ...hat(3), plus: 2 }, hat(2, 3, 'x'))).toBe(false);
    expect(canTransferPlus(hat(3, 1, 'a'), { ...hat(3, 2, 'b'), plus: 1 })).toBe(false);
    expect(() => transferPlus(hat(3, 1, 'a'), hat(3, 2, 'b'))).toThrow();
  });
});
