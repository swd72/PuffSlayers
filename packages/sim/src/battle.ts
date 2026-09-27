import { ARENA_CENTER, BOSS_SPOT, TUNING } from './data';
import { TickContext, isAlive } from './combat';
import { separate } from './movement';
import { createRng, type Rng } from './rng';
import { createEnemy, createHero } from './units';
import type { BattleConfig, BattleEvent, BattleState, Hazard, StepResult, Unit } from './types';

export { createEnemy, createHero, isAlive };

/** Enemies walk in from the far side of the map; a boss takes the far center. */
function spawnWave(config: BattleConfig, wave: number, rng: Rng): Unit[] {
  const specs = config.waves[wave] ?? [];
  const { from, to } = TUNING.spawnArc;
  return specs.map((spec, i) => {
    if ('boss' in spec) return createEnemy(spec, `w${wave}-e${i}`, config.stage, BOSS_SPOT);
    const slot = (i + 0.5) / Math.max(1, specs.length);
    const angle = from + (to - from) * slot + (rng.next() - 0.5) * 0.3;
    const at = { x: ARENA_CENTER.x + Math.cos(angle) * TUNING.spawnRadius, y: ARENA_CENTER.y + Math.sin(angle) * TUNING.spawnRadius };
    return createEnemy(spec, `w${wave}-e${i}`, config.stage, at);
  });
}

export function createBattle(config: BattleConfig, seed: number): BattleState {
  if (config.heroes.length === 0) throw new Error('A battle needs at least one hero');
  if (config.waves.length === 0) throw new Error('A battle needs at least one wave');
  const rng = createRng(seed);
  const enemies = spawnWave(config, 0, rng);
  return {
    config,
    time: 0,
    rngState: rng.seed,
    wave: 0,
    units: [...config.heroes.map(createHero), ...enemies],
    phase: 'fighting',
    pendingUltimates: [],
    casting: null,
    hazards: [],
    serial: 0,
  };
}

/** Queues a manual ultimate; ignored unless the hero is alive with full energy. */
export function requestUltimate(state: BattleState, heroId: string): BattleState {
  const hero = state.units.find((u) => u.id === heroId && u.side === 'hero');
  if (!hero || hero.hp <= 0 || hero.energy < 100 || state.pendingUltimates.includes(heroId)) return state;
  return { ...state, pendingUltimates: [...state.pendingUltimates, heroId] };
}

export function setAutoUltimate(state: BattleState, autoUltimate: boolean): BattleState {
  return { ...state, config: { ...state.config, autoUltimate } };
}

const newContext = (state: BattleState): TickContext =>
  new TickContext(
    state.units.map((u) => ({ ...u })),
    createRng(state.rngState),
    state.config.stage,
    state.serial,
  );

/** Advances the battle by one fixed tick. Pure: returns a new state plus what happened. */
export function step(state: BattleState): StepResult {
  if (state.phase !== 'fighting') return { state, events: [] };
  if (state.casting) return stepCasting(state, state.casting);
  const ctx = newContext(state);

  // telegraphed boss slams count down and land first
  const hazards: Hazard[] = [];
  for (const h of state.hazards) {
    const remainingMs = h.remainingMs - TUNING.tickMs;
    if (remainingMs > 0) hazards.push({ ...h, remainingMs });
    else ctx.resolveHazard(h);
  }

  const pending = new Set(state.pendingUltimates);
  for (const unit of ctx.units) {
    if (isAlive(unit)) ctx.act(unit, state.config.autoUltimate, pending);
  }
  ctx.units.push(...ctx.spawned);
  separate(ctx.units);
  const casting = ctx.castStarted ? { heroId: ctx.castStarted, remainingMs: TUNING.castMs } : null;
  // everyone stands still for the cut-in (no running in place while frozen)
  if (casting) for (const u of ctx.units) u.moving = false;
  return resolveWave({ ...state, casting, hazards: [...hazards, ...ctx.newHazards] }, ctx, [...pending]);
}

/** During a cut-in everything holds still; when the timer ends the ultimate lands. */
function stepCasting(state: BattleState, casting: { heroId: string; remainingMs: number }): StepResult {
  const remainingMs = casting.remainingMs - TUNING.tickMs;
  if (remainingMs > 0) {
    return { state: { ...state, time: state.time + TUNING.tickMs, casting: { ...casting, remainingMs } }, events: [] };
  }
  const ctx = newContext(state);
  const hero = ctx.units.find((u) => u.id === casting.heroId);
  const target = hero && isAlive(hero) ? ctx.pickTarget(hero) : undefined;
  if (hero && target) ctx.ultimate(hero, target);
  return resolveWave({ ...state, casting: null }, ctx, [...state.pendingUltimates]);
}

function resolveWave(state: BattleState, ctx: TickContext, pending: string[]): StepResult {
  const { units, events, rng } = ctx;
  const heroes = units.filter((u) => u.side === 'hero');
  const enemies = units.filter((u) => u.side === 'enemy');
  const finish = (next: Partial<BattleState>, extra: BattleEvent[] = []): StepResult => ({
    state: { ...state, time: state.time + TUNING.tickMs, pendingUltimates: pending, units, serial: ctx.nextSerial, ...next, rngState: rng.seed },
    events: [...events, ...extra],
  });

  if (!heroes.some(isAlive)) return finish({ phase: 'defeat' }, [{ type: 'defeat', stage: state.config.stage }]);
  if (enemies.some(isAlive)) return finish({});

  const nextWave = state.wave + 1;
  if (nextWave >= state.config.waves.length) return finish({ phase: 'victory', hazards: [] }, [{ type: 'victory', stage: state.config.stage }]);
  const spawned = spawnWave(state.config, nextWave, rng);
  ctx.crownWaveHeal();
  return finish({ wave: nextWave, units: [...heroes, ...spawned], hazards: [] }, [{ type: 'wave', wave: nextWave, enemies: spawned.map((e) => e.id) }]);
}

/** Runs ticks until the battle ends or maxTicks is hit; used by tests and offline estimates. */
export function simulate(state: BattleState, maxTicks = 20000): StepResult {
  let current = state;
  const events: BattleEvent[] = [];
  for (let i = 0; i < maxTicks && current.phase === 'fighting'; i++) {
    const result = step(current);
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}
