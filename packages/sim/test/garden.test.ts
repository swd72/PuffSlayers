import { describe, expect, it } from 'vitest';
import { GARDEN, SEEDS, canWater, createRng, gardenBonus, growth, growthStage, isBloomed, msLeft, plant, restoration, rollSeeds, water } from '../src';

const T0 = 1_000_000;
const grow = SEEDS.daisy.growMs;

describe('growing', () => {
  it('goes seed → sprout → bud → bloom over real time', () => {
    const p = plant('daisy', T0);
    expect(growthStage(p, T0)).toBe(0);
    expect(growthStage(p, T0 + grow * 0.4)).toBe(1);
    expect(growthStage(p, T0 + grow * 0.7)).toBe(2);
    expect(isBloomed(p, T0 + grow - 1)).toBe(false);
    expect(growthStage(p, T0 + grow)).toBe(3);
    expect(growth(p, T0 + grow * 5)).toBe(1);
    expect(growth(p, T0 - 5000)).toBe(0);
  });

  it('watering skips part of the time left, once per stage', () => {
    const p = plant('cactus', T0);
    expect(canWater(p, T0)).toBe(true);
    const w = water(p, T0);
    expect(msLeft(w, T0)).toBeCloseTo(SEEDS.cactus.growMs * (1 - GARDEN.waterSkip), -2);
    expect(canWater(w, T0)).toBe(false);
    expect(water(w, T0)).toBe(w);
    const later = T0 + SEEDS.cactus.growMs * 0.5;
    expect(growthStage(w, later)).toBeGreaterThan(0);
    expect(canWater(w, later)).toBe(true);
  });

  it('cannot water a bloom', () => {
    const p = plant('daisy', T0);
    expect(canWater(p, T0 + grow)).toBe(false);
  });
});

describe('bonus & restoration', () => {
  it('gives a small permanent buff every few blooms, capped', () => {
    expect(gardenBonus({ daisy: 4 })).toEqual({});
    expect(gardenBonus({ daisy: 10 }).hpPct).toBeCloseTo(0.02);
    expect(gardenBonus({ daisy: 999 }).hpPct).toBeCloseTo(0.01 * GARDEN.maxSteps);
    expect(gardenBonus({ 'queen-rafflesia': 1 })).toEqual({ atkPct: 0.02, hpPct: 0.02 });
  });

  it('restoration counts every bloom toward the chapter', () => {
    expect(restoration({})).toBe(0);
    expect(restoration({ daisy: 30 })).toBeCloseTo(0.5);
    expect(restoration({ daisy: 999 })).toBe(1);
  });
});

describe('seeds from bonks', () => {
  it('bosses always leave a seed, normal flowers sometimes, deterministically', () => {
    const bonked = Array.from({ length: 200 }, () => 'tulip' as const);
    const seeds = rollSeeds(createRng(4), bonked);
    expect(seeds.length).toBeGreaterThan(20);
    expect(seeds.length).toBeLessThan(80);
    expect(rollSeeds(createRng(4), bonked)).toEqual(seeds);
    expect(rollSeeds(createRng(1), ['lotus-moon-sage'])).toEqual(['lotus-moon-sage']);
  });
});
