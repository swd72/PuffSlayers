import { describe, expect, it } from 'vitest';
import {
  NAP,
  affordableLevels,
  bonkPetals,
  clearPetals,
  createBattle,
  createEnemy,
  createRng,
  levelUpCost,
  levelUpCostMany,
  napReward,
  recommendedLevel,
  stagePetals,
  stageWaves,
  step,
  type BattleEvent,
  type BattleState,
  type HeroSpec,
} from '../src';

const ids = () => {
  let n = 0;
  return () => `n${n++}`;
};
const HOUR = 60 * 60 * 1000;

describe('level costs', () => {
  it('grow with level', () => {
    expect(levelUpCost(20)).toBeGreaterThan(levelUpCost(10));
    expect(levelUpCostMany(8, 3)).toBe(levelUpCost(8) + levelUpCost(9) + levelUpCost(10));
    expect(levelUpCostMany(8, 0)).toBe(0);
  });

  it('counts how many levels a budget buys', () => {
    expect(affordableLevels(8, 0)).toBe(0);
    expect(affordableLevels(8, levelUpCostMany(8, 4))).toBe(4);
    expect(affordableLevels(8, levelUpCostMany(8, 4) - 1)).toBe(3);
  });

  it('a stage pays for most of the levels the next one asks for, at any depth', () => {
    for (const stage of [1, 10, 30]) {
      const need = levelUpCostMany(recommendedLevel(stage), 2) * 6;
      const ratio = stagePetals(stage) / need;
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1.2);
    }
  });
});

describe('petal income', () => {
  it('bosses and later stages pay more', () => {
    expect(bonkPetals(1, true)).toBe(bonkPetals(1) * 5);
    expect(bonkPetals(10)).toBeGreaterThan(bonkPetals(1));
    expect(clearPetals(3)).toBeGreaterThan(bonkPetals(3));
  });

  it('bonk events carry the stage-scaled amount', () => {
    const hero: HeroSpec = { id: 'k', name: 'k', species: 'shibu', heroClass: 'carrot-knight', level: 80 };
    const start = createBattle({ stage: 7, heroes: [hero], waves: stageWaves(7), autoUltimate: true }, 3);
    let s: BattleState = { ...start, units: [...start.units.filter((u) => u.side === 'hero'), { ...createEnemy({ kind: 'daisy' }, 'w0-e0', 7, { x: 300, y: 470 }), hp: 1 }] };
    const events: BattleEvent[] = [];
    for (let i = 0; i < 60 && !events.some((e) => e.type === 'bonk'); i++) {
      const r = step(s);
      s = r.state;
      events.push(...r.events);
    }
    const bonk = events.find((e) => e.type === 'bonk');
    expect(bonk && bonk.type === 'bonk' ? bonk.petals : 0).toBe(bonkPetals(7));
  });
});

describe('nap bank', () => {
  const opts = { stage: 6, classes: ['carrot-knight'] as const, luck: 0 };

  it('pays nothing for a short break', () => {
    expect(napReward(createRng(1), { ...opts, elapsedMs: NAP.minMs - 1, nextId: ids() })).toEqual({ ms: 0, petals: 0, stardust: 0, items: [] });
    expect(napReward(createRng(1), { ...opts, elapsedMs: -5000, nextId: ids() }).ms).toBe(0);
    expect(napReward(createRng(1), { ...opts, elapsedMs: Number.NaN, nextId: ids() }).petals).toBe(0);
  });

  it('scales with time and caps at 12 hours', () => {
    const two = napReward(createRng(1), { ...opts, elapsedMs: 2 * HOUR, nextId: ids() });
    const eight = napReward(createRng(1), { ...opts, elapsedMs: 8 * HOUR, nextId: ids() });
    const week = napReward(createRng(1), { ...opts, elapsedMs: 7 * 24 * HOUR, nextId: ids() });
    expect(eight.petals).toBeGreaterThan(two.petals * 3.9);
    expect(week.ms).toBe(NAP.capMs);
    expect(week.petals).toBe(napReward(createRng(1), { ...opts, elapsedMs: NAP.capMs, nextId: ids() }).petals);
    expect(week.items).toHaveLength(Math.floor(720 / NAP.itemEveryMin));
    expect(week.stardust).toBe(720 / NAP.stardustEveryMin);
    expect(two.petals).toBe(Math.round(stagePetals(5) * NAP.stagesPerHour * 2));
  });

  it('farms stage 1 when nothing is cleared yet, deterministically', () => {
    const a = napReward(createRng(4), { ...opts, stage: 1, elapsedMs: 3 * HOUR, nextId: ids() });
    const b = napReward(createRng(4), { ...opts, stage: 1, elapsedMs: 3 * HOUR, nextId: ids() });
    expect(a).toEqual(b);
    expect(a.petals).toBe(Math.round(stagePetals(1) * NAP.stagesPerHour * 3));
    expect(a.items.map((i) => i.id)).toEqual(['n0', 'n1', 'n2', 'n3']);
  });
});
