import {
  ARENA_CENTER,
  BOSS_STATS,
  CLASS_STATS,
  ENEMY_NAMES,
  ENEMY_STATS,
  FORMATION,
  SPECIES_PASSIVE,
  TUNING,
  recommendedLevel,
} from './data';
import { clampToArena } from './movement';
import type { EnemySpec, HeroSpec, Point, Stats, Unit } from './types';

/** Stat multiplier for a level; heroes and monsters grow on the same curve. */
export const levelGrowth = (level: number): number => 1 + TUNING.levelGrowth * (level - 1);

function scaleStats(base: Stats, hpMult: number, atkMult: number): Stats {
  return { ...base, maxHp: Math.round(base.maxHp * hpMult), atk: Math.round(base.atk * atkMult) };
}

const blank = {
  relics: [],
  chargeRate: 1,
  reviveLeft: 0,
  energy: 0,
  buffMs: 0,
  stunMs: 0,
  slowMs: 0,
  rootMs: 0,
  slamMs: 0,
  moving: false,
} as const;

export function createHero(spec: HeroSpec): Unit {
  const passive = SPECIES_PASSIVE[spec.species];
  const growth = levelGrowth(spec.level);
  const base = CLASS_STATS[spec.heroClass];
  const g = spec.gear?.stats ?? {};
  const relics = spec.gear?.relics ?? [];
  const scaled = scaleStats(base, growth * passive.hp * (1 + (g.hpPct ?? 0)), growth * (1 + (g.atkPct ?? 0)));
  const stats: Stats = {
    ...scaled,
    def: Math.round(scaled.def * (1 + (g.defPct ?? 0))),
    attackInterval: Math.round(scaled.attackInterval / (1 + (g.haste ?? 0))),
    crit: base.crit + passive.crit + (g.crit ?? 0),
    dodge: base.dodge + passive.dodge + (g.dodge ?? 0),
  };
  const offset = FORMATION[spec.heroClass];
  const home = clampToArena({ x: ARENA_CENTER.x + offset.x, y: ARENA_CENTER.y + offset.y });
  return {
    ...blank,
    id: spec.id,
    side: 'hero',
    name: spec.name,
    level: spec.level,
    species: spec.species,
    heroClass: spec.heroClass,
    relics,
    chargeRate: 1 + (g.charge ?? 0),
    reviveLeft: relics.includes('grandmas-knitted-scarf') ? 1 : 0,
    ...(spec.skin ? { skin: spec.skin } : {}),
    ...(spec.weaponTier !== undefined ? { weaponTier: spec.weaponTier } : {}),
    isBoss: false,
    isGiant: false,
    enraged: false,
    stats,
    hp: stats.maxHp,
    cooldown: stats.attackInterval * 0.3,
    // stagger Cheek Cannons so two hamsters don't always fire together
    skillMs: spec.species === 'hamham' ? TUNING.cheek.everyMs * (0.5 + (spec.id.length % 3) * 0.15) : 0,
    ...home,
    facing: 1,
    home,
  };
}

/** Monsters are built at the stage's recommended level, so the level gap decides how long a fight takes. */
export function createEnemy(spec: EnemySpec, id: string, stage: number, at: Point): Unit {
  const level = recommendedLevel(stage);
  const growth = levelGrowth(level);
  const isBoss = 'boss' in spec;
  const base = isBoss ? BOSS_STATS[spec.boss] : ENEMY_STATS[spec.kind];
  const isGiant = isBoss && spec.giant === true;
  const giant = isGiant ? TUNING.giant : { hp: 1, atk: 1 };
  const stats = scaleStats(base, growth * giant.hp, growth * giant.atk);
  const pos = clampToArena(at);
  return {
    ...blank,
    id,
    side: 'enemy',
    name: isBoss ? `${isGiant ? 'Giant ' : ''}${ENEMY_NAMES[spec.boss]}` : ENEMY_NAMES[spec.kind],
    level,
    ...(isBoss ? { bossKind: spec.boss } : { enemyKind: spec.kind }),
    isBoss,
    isGiant,
    enraged: false,
    stats,
    hp: stats.maxHp,
    cooldown: stats.attackInterval * 0.6,
    skillMs: isBoss ? TUNING.boss.summonEveryMs * 0.5 : 0,
    slamMs: isBoss ? TUNING.boss.slamEveryMs * 0.6 : 0,
    ...pos,
    facing: pos.x > ARENA_CENTER.x ? -1 : 1,
    home: pos,
  };
}
