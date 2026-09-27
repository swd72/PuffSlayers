import { describe, expect, it } from 'vitest';
import {
  CLASS_STATS,
  TUNING,
  createBattle,
  createEnemy,
  createHero,
  distance,
  stageWaves,
  step,
  type BattleEvent,
  type BattleState,
  type HeroSpec,
  type Unit,
} from '../src';

const taro: HeroSpec = { id: 'taro', name: 'Taro', species: 'molemo', heroClass: 'root-druid', level: 10 };

const arena = (heroes: HeroSpec[], foes: Unit[], autoUltimate = false): BattleState => {
  const s = createBattle({ stage: 1, heroes, waves: stageWaves(1), autoUltimate }, 5);
  return { ...s, units: [...s.units.filter((u) => u.side === 'hero'), ...foes] };
};

const patch = (s: BattleState, id: string, changes: Partial<Unit>): BattleState => ({
  ...s,
  units: s.units.map((u) => (u.id === id ? { ...u, ...changes } : u)),
});

const run = (s: BattleState, ticks: number) => {
  const events: BattleEvent[] = [];
  let cur = s;
  for (let i = 0; i < ticks && cur.phase === 'fighting'; i++) {
    const r = step(cur);
    cur = r.state;
    events.push(...r.events);
  }
  return { state: cur, events };
};

/** A foe that won't die during the test. */
const tough = (kind: 'daisy' | 'honey-bud', id: string, at: { x: number; y: number }): Unit => {
  const e = createEnemy({ kind }, id, 1, at);
  return { ...e, hp: 999999, stats: { ...e.stats, maxHp: 999999 } };
};

describe('Rooted status', () => {
  it('holds a unit in place but lets it hit what is in reach', () => {
    const me = createHero(taro);
    const far = { ...tough('daisy', 'w0-e0', { x: me.x + 200, y: me.y }), rootMs: 2000 };
    const near = { ...tough('daisy', 'w0-e1', { x: me.x + 20, y: me.y }), rootMs: 2000, cooldown: 0 };
    const start = arena([taro], [far, near]);
    const { state, events } = run(start, 10);
    const farAfter = state.units.find((u) => u.id === 'w0-e0')!;
    expect(distance(farAfter, far)).toBeLessThan(1);
    expect(events.some((e) => e.type === 'attack' && e.source === 'w0-e1')).toBe(true);
  });

  it('wears off, and then the unit walks again', () => {
    const me = createHero(taro);
    const foe = { ...tough('daisy', 'w0-e0', { x: me.x + 200, y: me.y }), rootMs: 300 };
    const { state } = run(arena([taro], [foe]), 15);
    expect(state.units.find((u) => u.id === 'w0-e0')!.rootMs).toBe(0);
    expect(distance(state.units.find((u) => u.id === 'w0-e0')!, foe)).toBeGreaterThan(5);
  });
});

describe('Root Druid', () => {
  it('basic attacks sometimes root the target (deterministic per seed)', () => {
    const me = createHero(taro);
    const foe = tough('daisy', 'w0-e0', { x: me.x + CLASS_STATS['root-druid'].range - 20, y: me.y });
    const { events } = run(arena([taro], [foe]), 300);
    const attacks = events.filter((e) => e.type === 'attack' && e.source === 'taro').length;
    const roots = events.filter((e) => e.type === 'status' && e.status === 'rooted');
    expect(attacks).toBeGreaterThan(10);
    expect(roots.length).toBeGreaterThan(0);
    expect(roots.length).toBeLessThan(attacks);
    expect(run(arena([taro], [foe]), 300).events).toEqual(events);
  });

  it('ultimate damages and roots every foe around the target', () => {
    const me = createHero(taro);
    const foes = [0, 1, 2].map((i) => tough('daisy', `w0-e${i}`, { x: me.x + 120 + i * 25, y: me.y + (i % 2) * 20 }));
    const s = patch(arena([taro], foes, true), 'taro', { energy: 100 });
    const { events } = run(s, Math.ceil(TUNING.castMs / TUNING.tickMs) + 2);
    const ult = events.find((e) => e.type === 'ultimate');
    expect(ult && ult.type === 'ultimate' ? ult.targets : []).toHaveLength(3);
    const rooted = events.filter((e) => e.type === 'status' && e.status === 'rooted');
    expect(rooted).toHaveLength(3);
    expect(rooted.every((e) => e.type === 'status' && e.ms === TUNING.root.ultimateMs)).toBe(true);
    expect(events.filter((e) => e.type === 'damage' && e.ultimate)).toHaveLength(3);
  });
});

describe('Molemo passive (Earthy Paws)', () => {
  it('sticky honey cannot slow a mole', () => {
    const me = createHero(taro);
    const bud = { ...tough('honey-bud', 'w0-e0', { x: me.x + 90, y: me.y }), cooldown: 0, stats: { ...tough('honey-bud', 'x', me).stats, dodge: 0 } };
    const s = patch(arena([taro], [bud]), 'taro', { stats: { ...me.stats, dodge: 0 } });
    const { events, state } = run(s, 3);
    expect(events.some((e) => e.type === 'attack' && e.source === 'w0-e0')).toBe(true);
    expect(events.some((e) => e.type === 'status' && e.status === 'sticky')).toBe(false);
    expect(state.units.find((u) => u.id === 'taro')!.slowMs).toBe(0);
  });
});
