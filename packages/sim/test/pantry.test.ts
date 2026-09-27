import { describe, expect, it } from 'vitest';
import { INGREDIENTS, INGREDIENT_IDS, PANTRY, addStats, createHero, createRng, mealEffect, rollForage } from '../src';

describe('meals', () => {
  it('a normal meal gives the buff', () => {
    expect(mealEffect('sweet-potato', 'hamham')).toEqual({ reaction: 'good', stats: { atkPct: 0.08 }, eaten: true });
  });

  it('a favorite gives double', () => {
    const m = mealEffect('sunflower-seeds', 'hamham');
    expect(m.reaction).toBe('favorite');
    expect(m.stats.luck).toBeCloseTo(INGREDIENTS['sunflower-seeds'].buff.luck! * PANTRY.favoriteMult);
  });

  it('food a species cannot eat gives a tummy ache (real pet rules)', () => {
    expect(mealEffect('wild-grapes', 'shibu').reaction).toBe('tummyache'); // grapes: dogs
    expect(mealEffect('lemon-drop', 'hamham').reaction).toBe('tummyache'); // citrus: hamsters
    expect(mealEffect('forest-avocado', 'bunbun').reaction).toBe('tummyache'); // avocado: rabbits
    for (const s of ['bunbun', 'hamham', 'shibu', 'molemo'] as const) expect(mealEffect('cocoa-pod', s).reaction).toBe('tummyache');
    expect(mealEffect('wild-onion', 'shibu').stats).toEqual(PANTRY.tummyAche);
  });

  it('refused food is not eaten and does nothing', () => {
    expect(mealEffect('wiggle-worm', 'bunbun')).toEqual({ reaction: 'refuse', stats: {}, eaten: false });
    expect(mealEffect('wiggle-worm', 'molemo').reaction).toBe('favorite');
  });

  it('every ingredient helps at least one species', () => {
    for (const id of INGREDIENT_IDS.filter((i) => i !== 'cocoa-pod')) {
      const helps = (['bunbun', 'hamham', 'shibu', 'molemo'] as const).some((s) => ['good', 'favorite'].includes(mealEffect(id, s).reaction));
      expect(helps, id).toBe(true);
    }
  });

  it('meal stats stack on top of gear and change the hero', () => {
    const base = { id: 'k', name: 'k', species: 'shibu', heroClass: 'carrot-knight', level: 10 } as const;
    const gear = { atkPct: 0.1 };
    const fed = createHero({ ...base, gear: { stats: addStats(gear, mealEffect('sweet-potato', 'shibu').stats), relics: [] } });
    const sick = createHero({ ...base, gear: { stats: addStats(gear, mealEffect('wild-grapes', 'shibu').stats), relics: [] } });
    const plain = createHero({ ...base, gear: { stats: gear, relics: [] } });
    expect(fed.stats.atk).toBeGreaterThan(plain.stats.atk);
    expect(sick.stats.atk).toBeLessThan(plain.stats.atk);
    expect(sick.stats.maxHp).toBeLessThan(plain.stats.maxHp);
    expect(addStats({ hpPct: 0.1 }, { hpPct: -0.15, crit: 0.02 })).toEqual({ hpPct: -0.05, crit: 0.02 });
  });
});

describe('forage', () => {
  it('drops more on boss stages and is deterministic', () => {
    expect(rollForage(createRng(1), { boss: false, luck: 0 })).toHaveLength(PANTRY.forage.perClear);
    expect(rollForage(createRng(1), { boss: true, luck: 0 })).toHaveLength(PANTRY.forage.perClear + PANTRY.forage.bossExtra);
    expect(rollForage(createRng(7), { boss: true, luck: 0.3 })).toEqual(rollForage(createRng(7), { boss: true, luck: 0.3 }));
  });

  it('luck makes rare finds more common', () => {
    const count = (luck: number) => {
      const rng = createRng(3);
      let rare = 0;
      for (let i = 0; i < 400; i++) rare += rollForage(rng, { boss: false, luck }).filter((id) => INGREDIENTS[id].rarity !== 'common').length;
      return rare;
    };
    expect(count(1)).toBeGreaterThan(count(0));
  });
});
