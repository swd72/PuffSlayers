import { describe, expect, it } from 'vitest';
import {
  ARENA,
  TUNING,
  ULTIMATE_COOLDOWN_MS,
  createBattle,
  createEnemy,
  distance,
  createHero,
  createRng,
  requestUltimate,
  simulate,
  stageWaves,
  step,
  type BattleConfig,
  type BattleEvent,
  type BattleState,
  type HeroSpec,
} from '../src';

const TEAM: HeroSpec[] = [
  { id: 'tofu', name: 'Tofu', species: 'shibu', heroClass: 'carrot-knight', level: 10 },
  { id: 'pudding', name: 'Pudding', species: 'hamham', heroClass: 'pillow-guard', level: 10 },
  { id: 'usagi', name: 'Usagi', species: 'bunbun', heroClass: 'leaf-archer', level: 10 },
  { id: 'momo', name: 'Momo', species: 'hamham', heroClass: 'mochi-cleric', level: 10 },
  { id: 'kinako', name: 'Kinako', species: 'shibu', heroClass: 'bubble-mage', level: 10 },
];

const config = (overrides: Partial<BattleConfig> = {}): BattleConfig => ({
  stage: 1,
  heroes: TEAM,
  waves: stageWaves(1),
  autoUltimate: true,
  ...overrides,
});

const withEnergy = (state: BattleState, id: string, energy: number): BattleState => ({
  ...state,
  units: state.units.map((u) => (u.id === id ? { ...u, energy } : u)),
});

const CAST_TICKS = Math.ceil(TUNING.castMs / TUNING.tickMs);

/** Steps until the pending cut-in resolves, collecting every event on the way. */
const runCast = (state: BattleState, extraTicks = 0): { state: BattleState; events: BattleEvent[] } => {
  let current = state;
  const events: BattleEvent[] = [];
  for (let i = 0; i < CAST_TICKS + extraTicks; i++) {
    const r = step(current);
    current = r.state;
    events.push(...r.events);
  }
  return { state: current, events };
};

describe('createRng', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });
});

describe('createHero', () => {
  it('applies species passives', () => {
    const ham = createHero({ id: 'a', name: 'A', species: 'hamham', heroClass: 'carrot-knight', level: 1 });
    const shi = createHero({ id: 'b', name: 'B', species: 'shibu', heroClass: 'carrot-knight', level: 1 });
    const bun = createHero({ id: 'c', name: 'C', species: 'bunbun', heroClass: 'carrot-knight', level: 1 });
    expect(ham.stats.maxHp).toBeGreaterThan(shi.stats.maxHp);
    expect(shi.stats.crit).toBeGreaterThan(ham.stats.crit);
    expect(bun.stats.dodge).toBeGreaterThan(0);
  });
});

describe('createBattle', () => {
  it('rejects empty teams and empty waves', () => {
    expect(() => createBattle(config({ heroes: [] }), 1)).toThrow();
    expect(() => createBattle(config({ waves: [] }), 1)).toThrow();
  });

  it('spawns the heroes and the first wave inside the arena', () => {
    const state = createBattle(config(), 1);
    expect(state.units.filter((u) => u.side === 'hero')).toHaveLength(5);
    expect(state.units.filter((u) => u.side === 'enemy')).toHaveLength(5);
    expect(state.phase).toBe('fighting');
    for (const u of state.units) {
      expect(u.x).toBeGreaterThanOrEqual(ARENA.minX);
      expect(u.x).toBeLessThanOrEqual(ARENA.maxX);
      expect(u.y).toBeGreaterThanOrEqual(ARENA.minY);
      expect(u.y).toBeLessThanOrEqual(ARENA.maxY);
    }
  });
});

describe('step', () => {
  it('is deterministic for the same seed', () => {
    const a = simulate(createBattle(config(), 7));
    const b = simulate(createBattle(config(), 7));
    expect(a.events).toEqual(b.events);
    expect(a.state.phase).toBe(b.state.phase);
  });

  it('does not mutate the input state', () => {
    const state = createBattle(config(), 3);
    const snapshot = JSON.stringify(state);
    for (let i = 0; i < 30; i++) step(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('lets a leveled team clear stage 1 and advance through every wave', () => {
    const { state, events } = simulate(createBattle(config(), 11));
    expect(state.phase).toBe('victory');
    expect(events.filter((e) => e.type === 'wave').map((e) => (e.type === 'wave' ? e.wave : -1))).toEqual([1, 2]);
    expect(events.some((e) => e.type === 'bonk')).toBe(true);
  });

  it('ends in defeat when level 1 heroes face a far later stage', () => {
    const weak = TEAM.map((h) => ({ ...h, level: 1 }));
    const { state, events } = simulate(createBattle(config({ heroes: weak, stage: 60, waves: stageWaves(60) }), 5));
    expect(state.phase).toBe('defeat');
    expect(events.at(-1)?.type).toBe('defeat');
  });

  it('makes enemies near the Pillow Guard attack it first', () => {
    const base = createBattle(config({ autoUltimate: false }), 9);
    const guard = base.units.find((u) => u.id === 'pudding')!;
    const near = createEnemy({ kind: 'daisy' }, 'w0-e0', 1, { x: guard.x + 30, y: guard.y });
    const state = { ...base, units: [...base.units.filter((u) => u.side === 'hero'), { ...near, cooldown: 0 }] };
    const { events } = step(state);
    expect(events).toContainEqual({ type: 'attack', source: 'w0-e0', target: 'pudding' });
  });

  it('moves units toward their targets from any direction', () => {
    const start = createBattle(config({ autoUltimate: false }), 12);
    const later = simulate(start, 15).state;
    const moved = start.units.filter((u) => {
      const after = later.units.find((v) => v.id === u.id);
      return after && distance(u, after) > 5;
    });
    expect(moved.length).toBeGreaterThan(5);
    expect(later.units.some((u) => u.moving)).toBe(true);
    expect(new Set(later.units.filter((u) => u.side === 'enemy').map((u) => u.facing)).size).toBeGreaterThan(0);
  });

  it('keeps every unit inside the arena for a whole battle', () => {
    let state = createBattle(config(), 21);
    for (let i = 0; i < 600 && state.phase === 'fighting'; i++) {
      state = step(state).state;
      for (const u of state.units) {
        expect(u.x).toBeGreaterThanOrEqual(ARENA.minX);
        expect(u.x).toBeLessThanOrEqual(ARENA.maxX);
        expect(u.y).toBeGreaterThanOrEqual(ARENA.minY);
        expect(u.y).toBeLessThanOrEqual(ARENA.maxY);
      }
    }
  });

  it('pushes stacked allies apart', () => {
    const base = createBattle(config({ autoUltimate: false }), 13);
    const stacked = { ...base, units: base.units.map((u) => (u.side === 'hero' ? { ...u, x: 270, y: 560 } : u)) };
    const heroes = step(stacked).state.units.filter((u) => u.side === 'hero');
    const positions = new Set(heroes.map((h) => `${h.x.toFixed(1)},${h.y.toFixed(1)}`));
    expect(positions.size).toBe(heroes.length);
  });

  it('makes ranged heroes back away from foes that get too close', () => {
    const base = createBattle(config({ autoUltimate: false }), 14);
    const sniper = base.units.find((u) => u.id === 'usagi')!;
    const pest = createEnemy({ kind: 'tulip' }, 'w0-e0', 1, { x: sniper.x + 20, y: sniper.y });
    const state = { ...base, units: [...base.units.filter((u) => u.side === 'hero'), pest] };
    const after = step(state).state.units.find((u) => u.id === 'usagi')!;
    expect(distance(after, pest)).toBeGreaterThan(distance(sniper, pest));
  });

  it('dashes the Carrot Knight to its target and only hits foes inside the blast radius', () => {
    const base = createBattle(config({ autoUltimate: true }), 15);
    const near = createEnemy({ kind: 'daisy' }, 'w0-e0', 1, { x: 440, y: 420 });
    const far = createEnemy({ kind: 'daisy' }, 'w0-e1', 1, { x: 60, y: 770 });
    const units = base.units.filter((u) => u.side === 'hero').map((u) => (u.id === 'tofu' ? { ...u, energy: 100, x: 380, y: 440 } : u));
    const { state, events } = runCast({ ...base, units: [...units, near, far] }, 1);
    const ult = events.find((e) => e.type === 'ultimate' && e.source === 'tofu');
    expect(ult && ult.type === 'ultimate' ? ult.targets : []).toEqual(['w0-e0']);
    const tofu = state.units.find((u) => u.id === 'tofu')!;
    expect(distance(tofu, near)).toBeLessThan(45);
  });

  it('fires ultimates automatically when auto is on', () => {
    const { events } = simulate(createBattle(config(), 2), 300);
    expect(events.some((e) => e.type === 'ultimate')).toBe(true);
  });

  it('waits for a manual request when auto is off', () => {
    const start = withEnergy(createBattle(config({ autoUltimate: false }), 4), 'tofu', 100);
    const idle = step(start);
    expect(idle.events.some((e) => e.type === 'ultimate')).toBe(false);

    const cast = step(requestUltimate(idle.state, 'tofu'));
    expect(cast.events).toContainEqual({ type: 'ultimateCast', source: 'tofu', heroClass: 'carrot-knight', castMs: TUNING.castMs });
    expect(cast.events.some((e) => e.type === 'ultimate')).toBe(false);
    expect(cast.state.units.find((u) => u.id === 'tofu')?.energy).toBeLessThan(100);

    const fired = runCast(cast.state);
    expect(fired.events.find((e) => e.type === 'ultimate')).toMatchObject({ source: 'tofu', heroClass: 'carrot-knight' });
  });

  it('freezes the whole battle while an ultimate cut-in plays', () => {
    const start = withEnergy(createBattle(config({ autoUltimate: true }), 16), 'tofu', 100);
    const cast = step(start);
    expect(cast.state.casting).toEqual({ heroId: 'tofu', remainingMs: TUNING.castMs });
    const frozen = step(cast.state);
    expect(frozen.events).toEqual([]);
    expect(frozen.state.units).toEqual(cast.state.units);
    const done = runCast(cast.state);
    expect(done.state.casting).toBeNull();
    expect(done.events.some((e) => e.type === 'ultimate' && e.source === 'tofu')).toBe(true);
  });

  it('charges each class ultimate on its own cooldown', () => {
    expect(new Set(Object.values(ULTIMATE_COOLDOWN_MS)).size).toBe(Object.keys(ULTIMATE_COOLDOWN_MS).length);
    const after = simulate(createBattle(config({ autoUltimate: false }), 17), 40).state;
    const energy = (id: string) => after.units.find((u) => u.id === id)?.energy ?? 0;
    // sniper (7.5 s) charges faster than the guard (14 s)
    expect(energy('usagi')).toBeGreaterThan(energy('pudding'));
  });

  it('ignores ultimate requests without full energy', () => {
    const state = createBattle(config({ autoUltimate: false }), 4);
    expect(requestUltimate(state, 'tofu')).toBe(state);
    expect(requestUltimate(state, 'nobody')).toBe(state);
  });

  it('heals with the cleric ultimate and buffs with the bard ultimate', () => {
    const bardTeam: HeroSpec[] = [...TEAM.slice(0, 4), { id: 'mimi', name: 'Mimi', species: 'bunbun', heroClass: 'bell-bard', level: 10 }];
    let state = createBattle(config({ heroes: bardTeam }), 8);
    state = {
      ...state,
      units: state.units.map((u) => (u.side === 'hero' ? { ...u, hp: Math.round(u.stats.maxHp / 2) } : u)),
    };
    state = withEnergy(withEnergy(state, 'momo', 100), 'mimi', 100);
    // two ultimates ready at once: they cast one after the other
    const { events } = runCast(state, CAST_TICKS + 2);
    expect(events.filter((e) => e.type === 'ultimateCast')).toHaveLength(2);
    expect(events.filter((e) => e.type === 'heal').length).toBeGreaterThanOrEqual(4);
    expect(events.filter((e) => e.type === 'buff')).toHaveLength(5);
  });

  it('returns the same state once the battle is over', () => {
    const done = simulate(createBattle(config(), 11)).state;
    expect(step(done)).toEqual({ state: done, events: [] });
  });
});

describe('stageWaves', () => {
  it('builds three growing waves and adds a boss every fifth stage', () => {
    expect(stageWaves(3).map((w) => w.length)).toEqual([5, 6, 7]);
    expect(stageWaves(3).flat().some((e) => 'boss' in e)).toBe(false);
    expect(stageWaves(5).flat().some((e) => 'boss' in e)).toBe(true);
  });
});
