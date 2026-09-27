import { describe, expect, it } from 'vitest';
import {
  LOOT,
  TIER_MULT,
  TUNING,
  createBattle,
  createEnemy,
  createHero,
  createRng,
  fitsClass,
  gearBonus,
  itemScore,
  relicItem,
  rollItem,
  rollLoot,
  rollTier,
  stageWaves,
  step,
  type BattleEvent,
  type BattleState,
  type HeroSpec,
  type RelicId,
  type Unit,
} from '../src';

const ids = () => {
  let n = 0;
  return () => `i${n++}`;
};

describe('items', () => {
  it('scales the main stat by tier and adds more substats at higher tiers', () => {
    const rng = createRng(1);
    const crumb = rollItem(rng, 'a', { tier: 0, slot: 'hat' });
    const starry = rollItem(rng, 'b', { tier: 4, slot: 'hat' });
    expect(crumb.subs).toHaveLength(0);
    expect(starry.subs).toHaveLength(4);
    expect(starry.main.value / crumb.main.value).toBeCloseTo(TIER_MULT[4]!, 1);
    expect(new Set(starry.subs.map((s) => s.stat)).size).toBe(4);
  });

  it('binds weapons to a class (guards get DEF as their main stat)', () => {
    const rng = createRng(2);
    const shield = rollItem(rng, 'w', { tier: 2, slot: 'weapon', heroClass: 'pillow-guard' });
    expect(shield.main.stat).toBe('defPct');
    expect(fitsClass(shield, 'pillow-guard')).toBe(true);
    expect(fitsClass(shield, 'leaf-archer')).toBe(false);
    expect(fitsClass(rollItem(rng, 'h', { tier: 0, slot: 'hat' }), 'leaf-archer')).toBe(true);
  });

  it('sums equipped stats and lists relics', () => {
    const rng = createRng(3);
    const a = rollItem(rng, 'a', { tier: 1, slot: 'hat' });
    const b = relicItem(rng, 'b', 'lucky-clover-pin');
    const bonus = gearBonus([a, b]);
    expect(bonus.relics).toEqual(['lucky-clover-pin']);
    expect(bonus.stats.hpPct).toBeGreaterThanOrEqual(a.main.value);
    expect(itemScore(b)).toBeGreaterThan(itemScore(a));
  });

  it('makes geared heroes stronger', () => {
    const base: HeroSpec = { id: 'k', name: 'k', species: 'shibu', heroClass: 'carrot-knight', level: 10 };
    const plain = createHero(base);
    const geared = createHero({ ...base, gear: { stats: { atkPct: 0.5, hpPct: 0.2, haste: 0.25, charge: 0.3 }, relics: [] } });
    expect(geared.stats.atk).toBeGreaterThan(plain.stats.atk * 1.4);
    expect(geared.stats.maxHp).toBeGreaterThan(plain.stats.maxHp);
    expect(geared.stats.attackInterval).toBeLessThan(plain.stats.attackInterval);
    expect(geared.chargeRate).toBeCloseTo(1.3);
  });
});

describe('loot', () => {
  it('respects a tier floor', () => {
    const rng = createRng(4);
    for (let i = 0; i < 50; i++) expect(rollTier(rng, 1, 0, 3)).toBeGreaterThanOrEqual(3);
  });

  it('drops more and better items from bosses and giants', () => {
    const base = { classes: ['carrot-knight'] as const, luck: 0, relicPity: 0 };
    const normal = rollLoot(createRng(5), 3, { ...base, boss: false, giant: false, nextId: ids() });
    const boss = rollLoot(createRng(5), 5, { ...base, boss: true, giant: false, nextId: ids() });
    const giant = rollLoot(createRng(5), 10, { ...base, boss: true, giant: true, nextId: ids() });
    expect(normal.items).toHaveLength(LOOT.rollsPerClear);
    expect(boss.items.filter((i) => i.tier >= 3).length).toBeGreaterThanOrEqual(LOOT.bossRolls);
    expect(giant.items.filter((i) => i.tier >= 4).length).toBeGreaterThanOrEqual(LOOT.giantRolls);
  });

  it('guarantees a relic when the giant pity runs out', () => {
    const loot = rollLoot(createRng(6), 10, { classes: ['bell-bard'], boss: true, giant: true, luck: 0, relicPity: LOOT.relicPity - 1, nextId: ids() });
    expect(loot.items.some((i) => i.relic)).toBe(true);
    expect(loot.relicPity).toBe(0);
  });

  it('is deterministic for a seed', () => {
    const opts = { classes: ['leaf-archer'] as const, boss: true, giant: true, luck: 0.2, relicPity: 3 };
    expect(rollLoot(createRng(9), 10, { ...opts, nextId: ids() })).toEqual(rollLoot(createRng(9), 10, { ...opts, nextId: ids() }));
  });
});

describe('relic effects in battle', () => {
  const withRelic = (heroClass: HeroSpec['heroClass'], species: HeroSpec['species'], relic?: RelicId): HeroSpec => ({
    id: 'h',
    name: 'h',
    species,
    heroClass,
    level: 10,
    gear: { stats: {}, relics: relic ? [relic] : [] },
  });
  const arena = (spec: HeroSpec, foes: Unit[]): BattleState => {
    const s = createBattle({ stage: 1, heroes: [spec], waves: stageWaves(1), autoUltimate: true }, 11);
    return { ...s, units: [...s.units.filter((u) => u.side === 'hero'), ...foes] };
  };
  const patchHero = (s: BattleState, changes: Partial<Unit>): BattleState => ({ ...s, units: s.units.map((u) => (u.id === 'h' ? { ...u, ...changes } : u)) });
  const ticks = (s: BattleState, n: number) => {
    const events: BattleEvent[] = [];
    let cur = s;
    for (let i = 0; i < n && cur.phase === 'fighting'; i++) {
      const r = step(cur);
      cur = r.state;
      events.push(...r.events);
    }
    return { state: cur, events };
  };
  const foesNear = (n: number, kind: 'daisy' | 'cactus' = 'daisy') =>
    Array.from({ length: n }, (_, i) => createEnemy({ kind }, `w0-e${i}`, 1, { x: 300 + i * 18, y: 480 + (i % 2) * 20 }));

  it('Bottomless Cheek Pouch spits five seeds', () => {
    const s = patchHero(arena(withRelic('pillow-guard', 'hamham', 'bottomless-cheek-pouch'), foesNear(6)), { x: 270, y: 480, skillMs: 0, energy: 0 });
    const spit = step(s).events.find((e) => e.type === 'cheekCannon');
    expect(spit && spit.type === 'cheekCannon' ? spit.targets : []).toHaveLength(TUNING.relic.pouchSeeds);
  });

  it("Grandma's Knitted Scarf revives once", () => {
    const boss = { ...createEnemy({ kind: 'cactus' }, 'w0-e0', 1, { x: 300, y: 480 }), cooldown: 0, stats: { ...createEnemy({ kind: 'cactus' }, 'x', 1, { x: 0, y: 0 }).stats, atk: 99999, crit: 0 } };
    const s = patchHero(arena(withRelic('mochi-cleric', 'bunbun', 'grandmas-knitted-scarf'), [boss]), { x: 280, y: 480, stats: { ...createHero(withRelic('mochi-cleric', 'bunbun')).stats, dodge: 0 } });
    const { events } = ticks(s, 30);
    expect(events.filter((e) => e.type === 'revive')).toHaveLength(1);
  });

  it('Carrot Excalibur makes Carrot Crescent hit harder', () => {
    const ultDamage = (relic?: RelicId) => {
      const s = patchHero(arena(withRelic('carrot-knight', 'shibu', relic), foesNear(1, 'cactus')), { x: 250, y: 480, energy: 100 });
      const hit = ticks(s, Math.ceil(TUNING.castMs / TUNING.tickMs) + 1).events.find((e) => e.type === 'damage' && e.ultimate);
      return hit && hit.type === 'damage' ? hit.amount : 0;
    };
    expect(ultDamage('carrot-excalibur')).toBeGreaterThan(ultDamage() * 1.3);
  });

  it('Moonlit Lullaby Bell puts nearby foes to sleep', () => {
    const s = patchHero(arena(withRelic('bell-bard', 'hamham', 'moonlit-lullaby-bell'), foesNear(2)), { x: 290, y: 480, energy: 100, skillMs: 99999 });
    const { events } = ticks(s, Math.ceil(TUNING.castMs / TUNING.tickMs) + 1);
    expect(events.filter((e) => e.type === 'status' && e.status === 'sleepy').length).toBeGreaterThan(0);
  });

  it('Sunflower Crown heals the team when a new wave arrives', () => {
    const one = createEnemy({ kind: 'tulip' }, 'w0-e0', 1, { x: 290, y: 480 });
    let s = arena(withRelic('leaf-archer', 'bunbun', 'sunflower-crown'), [{ ...one, hp: 1 }]);
    s = patchHero(s, { hp: 100, x: 200, y: 480, cooldown: 0 });
    const { events } = ticks(s, 5);
    expect(events.some((e) => e.type === 'wave')).toBe(true);
    expect(events.some((e) => e.type === 'heal' && e.target === 'h')).toBe(true);
  });
});
