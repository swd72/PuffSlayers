import { describe, expect, it } from 'vitest';
import {
  TUNING,
  createBattle,
  createEnemy,
  distance,
  isBossStage,
  isGiantStage,
  recommendedLevel,
  stageWaves,
  step,
  type BattleConfig,
  type BattleEvent,
  type BattleState,
  type HeroSpec,
  type Unit,
} from '../src';

const hero = (id: string, species: HeroSpec['species'], heroClass: HeroSpec['heroClass'], level = 8): HeroSpec => ({ id, name: id, species, heroClass, level });

const battle = (heroes: HeroSpec[], overrides: Partial<BattleConfig> = {}): BattleState =>
  createBattle({ stage: 1, heroes, waves: stageWaves(1), autoUltimate: false, ...overrides }, 42);

/** Replaces all enemies with the given ones. */
const withEnemies = (state: BattleState, enemies: Unit[]): BattleState => ({
  ...state,
  units: [...state.units.filter((u) => u.side === 'hero'), ...enemies],
});

const patch = (state: BattleState, id: string, changes: Partial<Unit>): BattleState => ({
  ...state,
  units: state.units.map((u) => (u.id === id ? { ...u, ...changes } : u)),
});

const run = (state: BattleState, ticks: number): { state: BattleState; events: BattleEvent[] } => {
  let s = state;
  const events: BattleEvent[] = [];
  for (let i = 0; i < ticks && s.phase === 'fighting'; i++) {
    const r = step(s);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
};

describe('Hamham Cheek Cannon', () => {
  it('spits seeds at up to three nearby foes when the timer is ready', () => {
    let s = battle([hero('ham', 'hamham', 'pillow-guard')]);
    const me = s.units.find((u) => u.id === 'ham')!;
    const foes = [0, 1, 2, 3].map((i) => createEnemy({ kind: 'daisy' }, `w0-e${i}`, 1, { x: me.x + 40 + i * 20, y: me.y }));
    s = patch(withEnemies(s, foes), 'ham', { skillMs: 0 });
    const { events } = step(s);
    const spit = events.find((e) => e.type === 'cheekCannon');
    expect(spit && spit.type === 'cheekCannon' ? spit.targets : []).toHaveLength(TUNING.cheek.seeds);
  });

  it('only Hamham heroes use it', () => {
    let s = battle([hero('bun', 'bunbun', 'leaf-archer')]);
    const me = s.units.find((u) => u.id === 'bun')!;
    s = patch(withEnemies(s, [createEnemy({ kind: 'daisy' }, 'w0-e0', 1, { x: me.x + 60, y: me.y })]), 'bun', { skillMs: 0 });
    expect(run(s, 30).events.some((e) => e.type === 'cheekCannon')).toBe(false);
  });
});

describe('status effects', () => {
  it('Bubble Prison traps enemies so they cannot move or attack', () => {
    let s = battle([hero('mage', 'shibu', 'bubble-mage')], { autoUltimate: true });
    const me = s.units.find((u) => u.id === 'mage')!;
    const tulip = createEnemy({ kind: 'tulip' }, 'w0-e0', 1, { x: me.x + 100, y: me.y });
    // tough enough to survive the ultimate, so the trap itself can be checked
    const foe = { ...tulip, hp: 99999, stats: { ...tulip.stats, maxHp: 99999 } };
    s = patch(withEnemies(s, [foe]), 'mage', { energy: 100 });
    const { state, events } = run(s, Math.ceil(TUNING.castMs / TUNING.tickMs) + 1);
    expect(events).toContainEqual({ type: 'status', target: 'w0-e0', status: 'bubble', ms: TUNING.bubbleStunMs });
    const trapped = state.units.find((u) => u.id === 'w0-e0')!;
    const later = run(state, 10);
    const after = later.state.units.find((u) => u.id === 'w0-e0')!;
    expect(later.events.some((e) => e.type === 'attack' && e.source === 'w0-e0')).toBe(false);
    expect(distance(after, trapped)).toBeLessThan(TUNING.personalSpace);
  });

  it('Honey Bud hits make heroes sticky and slow', () => {
    let s = battle([hero('tank', 'hamham', 'pillow-guard')]);
    const me = s.units.find((u) => u.id === 'tank')!;
    const bud = { ...createEnemy({ kind: 'honey-bud' }, 'w0-e0', 1, { x: me.x + 90, y: me.y }), cooldown: 0, stats: { ...createEnemy({ kind: 'honey-bud' }, 'x', 1, me).stats, dodge: 0 } };
    s = patch(withEnemies(s, [bud]), 'tank', { stats: { ...me.stats, dodge: 0 }, skillMs: 99999 });
    const { events, state } = run(s, 2);
    expect(events).toContainEqual({ type: 'status', target: 'tank', status: 'sticky', ms: TUNING.sticky.ms });
    expect(state.units.find((u) => u.id === 'tank')!.slowMs).toBeGreaterThan(0);
  });
});

describe('Ultimate Roll', () => {
  it('rolls the guard along a line and only hits foes on that line', () => {
    let s = battle([hero('tank', 'hamham', 'pillow-guard')], { autoUltimate: true });
    const me = s.units.find((u) => u.id === 'tank')!;
    const onLine = createEnemy({ kind: 'daisy' }, 'w0-e0', 1, { x: me.x + 60, y: me.y });
    const offLine = createEnemy({ kind: 'daisy' }, 'w0-e1', 1, { x: me.x + 60, y: me.y + 150 });
    s = patch(withEnemies(s, [onLine, offLine]), 'tank', { energy: 100, skillMs: 99999 });
    const { state, events } = run(s, Math.ceil(TUNING.castMs / TUNING.tickMs) + 1);
    const ult = events.find((e) => e.type === 'ultimate');
    expect(ult && ult.type === 'ultimate' ? ult.targets : []).toEqual(['w0-e0']);
    const rolled = state.units.find((u) => u.id === 'tank')!;
    expect(distance(rolled, me)).toBeGreaterThan(100);
  });
});

describe('bosses', () => {
  const bossBattle = () => {
    const s = battle([hero('tank', 'hamham', 'pillow-guard'), hero('arch', 'bunbun', 'leaf-archer')], { stage: 5, waves: stageWaves(5) });
    const boss = createEnemy({ boss: 'queen-rafflesia' }, 'w2-e0', 5, { x: 270, y: 330 });
    return withEnemies(s, [boss]);
  };

  it('puts a boss in the last wave of every fifth stage', () => {
    expect(isBossStage(5)).toBe(true);
    expect(stageWaves(5)[2]?.some((e) => 'boss' in e)).toBe(true);
    expect(stageWaves(4).flat().some((e) => 'boss' in e)).toBe(false);
  });

  it('summons minions on a timer', () => {
    const s = patch(bossBattle(), 'w2-e0', { skillMs: 0 });
    const { state, events } = step(s);
    const summon = events.find((e) => e.type === 'summon');
    expect(summon && summon.type === 'summon' ? summon.spawned : []).toHaveLength(TUNING.boss.summonCount);
    expect(state.units.filter((u) => u.side === 'enemy')).toHaveLength(1 + TUNING.boss.summonCount);
  });

  it('telegraphs a slam, then hits heroes still inside the circle', () => {
    const s = patch(bossBattle(), 'w2-e0', { skillMs: 99999, slamMs: 0 });
    const first = step(s);
    const warn = first.events.find((e) => e.type === 'telegraph');
    expect(warn).toBeDefined();
    expect(first.state.hazards).toHaveLength(1);
    const { events } = run(first.state, Math.ceil(TUNING.boss.telegraphMs / TUNING.tickMs) + 1);
    expect(events.some((e) => e.type === 'slam')).toBe(true);
  });

  it('has far more HP than regular flowers', () => {
    const boss = createEnemy({ boss: 'queen-rafflesia' }, 'b', 5, { x: 0, y: 0 });
    const minion = createEnemy({ kind: 'tulip' }, 'm', 5, { x: 0, y: 0 });
    expect(boss.stats.maxHp).toBeGreaterThan(minion.stats.maxHp * 20);
  });
});

describe('level scaling', () => {
  it('builds monsters at the stage recommended level', () => {
    expect(createEnemy({ kind: 'daisy' }, 'd', 3, { x: 0, y: 0 }).level).toBe(recommendedLevel(3));
  });

  it('makes an under-levelled team deal less damage', () => {
    const hit = (level: number): number => {
      let s = battle([hero('arch', 'bunbun', 'leaf-archer', level)]);
      const me = s.units.find((u) => u.id === 'arch')!;
      const foe = createEnemy({ kind: 'cactus' }, 'w0-e0', 1, { x: me.x + 120, y: me.y });
      s = patch(withEnemies(s, [foe]), 'arch', { cooldown: 0, stats: { ...me.stats, crit: 0 } });
      const dmg = step(s).events.find((e) => e.type === 'damage');
      return dmg && dmg.type === 'damage' ? dmg.amount : 0;
    };
    expect(hit(2)).toBeLessThan(hit(18) * 0.5);
  });
});

describe('giant boss', () => {
  const giantBattle = (hpRatio = 1) => {
    const s = battle([hero('tank', 'hamham', 'pillow-guard'), hero('arch', 'bunbun', 'leaf-archer'), hero('mage', 'shibu', 'bubble-mage')], { stage: 10, waves: stageWaves(10) });
    const giant = createEnemy({ boss: 'sunflower-colossus', giant: true }, 'w1-e0', 10, { x: 270, y: 330 });
    return withEnemies(s, [{ ...giant, hp: Math.round(giant.stats.maxHp * hpRatio) }]);
  };

  it('makes every 10th stage a two-wave giant boss stage', () => {
    expect(isGiantStage(10)).toBe(true);
    expect(isGiantStage(5)).toBe(false);
    const waves = stageWaves(10);
    expect(waves).toHaveLength(2);
    expect(waves[1]?.some((e) => 'boss' in e && e.giant === true)).toBe(true);
  });

  it('is much tougher than the same boss on a normal boss stage', () => {
    const giant = createEnemy({ boss: 'queen-rafflesia', giant: true }, 'g', 10, { x: 0, y: 0 });
    const normal = createEnemy({ boss: 'queen-rafflesia' }, 'b', 10, { x: 0, y: 0 });
    expect(giant.isGiant).toBe(true);
    expect(giant.name).toBe('Giant Queen Rafflesia');
    expect(giant.stats.maxHp).toBeGreaterThan(normal.stats.maxHp * 2);
  });

  it('enrages once when it drops below half HP', () => {
    const { events, state } = run(giantBattle(0.45), 3);
    expect(events.filter((e) => e.type === 'enrage')).toHaveLength(1);
    expect(state.units.find((u) => u.id === 'w1-e0')?.enraged).toBe(true);
  });

  it('does not enrage while above half HP', () => {
    expect(run(giantBattle(0.9), 5).events.some((e) => e.type === 'enrage')).toBe(false);
  });

  it('slams several spots at once and summons a bigger pack when enraged', () => {
    let s = giantBattle(0.4);
    s = patch(s, 'w1-e0', { enraged: true, slamMs: 0, skillMs: 99999 });
    // spread the heroes so each can get its own circle
    s = patch(patch(patch(s, 'tank', { x: 100, y: 600 }), 'arch', { x: 270, y: 700 }), 'mage', { x: 440, y: 600 });
    const slam = step(s);
    expect(slam.events.filter((e) => e.type === 'telegraph')).toHaveLength(TUNING.giant.enragedSlams);

    const summon = step(patch(s, 'w1-e0', { slamMs: 99999, skillMs: 0 }));
    const ev = summon.events.find((e) => e.type === 'summon');
    expect(ev && ev.type === 'summon' ? ev.spawned : []).toHaveLength(TUNING.giant.enragedSummons);
  });
});
