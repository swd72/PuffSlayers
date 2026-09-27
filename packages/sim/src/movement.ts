import { ARENA, TUNING } from './data';
import type { Point, Unit } from './types';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type WorkUnit = Mutable<Unit>;

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export function clampToArena(p: Point): Point {
  return {
    x: Math.min(ARENA.maxX, Math.max(ARENA.minX, p.x)),
    y: Math.min(ARENA.maxY, Math.max(ARENA.minY, p.y)),
  };
}

function place(unit: WorkUnit, p: Point): void {
  const clamped = clampToArena(p);
  unit.x = clamped.x;
  unit.y = clamped.y;
}

export function face(unit: WorkUnit, target: Point): void {
  if (Math.abs(target.x - unit.x) > 2) unit.facing = target.x > unit.x ? 1 : -1;
}

/** Steps toward `target` until within `stopAt`; returns whether the unit moved. */
export function moveToward(unit: WorkUnit, target: Point, stopAt: number, dtSec: number, speedFactor = 1): boolean {
  const d = distance(unit, target);
  if (d <= stopAt) return false;
  const stepLen = Math.min(unit.stats.moveSpeed * speedFactor * dtSec, d - stopAt);
  place(unit, { x: unit.x + ((target.x - unit.x) / d) * stepLen, y: unit.y + ((target.y - unit.y) / d) * stepLen });
  face(unit, target);
  return true;
}

/** Backs away from `threat` at reduced speed (ranged kiting). */
export function moveAway(unit: WorkUnit, threat: Point, dtSec: number, speedFactor = 1): boolean {
  const d = distance(unit, threat) || 1;
  const stepLen = unit.stats.moveSpeed * 0.6 * speedFactor * dtSec;
  const before = { x: unit.x, y: unit.y };
  place(unit, { x: unit.x + ((unit.x - threat.x) / d) * stepLen, y: unit.y + ((unit.y - threat.y) / d) * stepLen });
  face(unit, threat);
  return before.x !== unit.x || before.y !== unit.y;
}

/** Pushes same-side units apart so crowds spread out instead of stacking on one pixel. */
export function separate(units: readonly WorkUnit[]): void {
  const space = TUNING.personalSpace;
  for (let i = 0; i < units.length; i++) {
    const a = units[i];
    if (!a || a.hp <= 0) continue;
    for (let j = i + 1; j < units.length; j++) {
      const b = units[j];
      if (!b || b.hp <= 0 || b.side !== a.side) continue;
      const d = distance(a, b);
      if (d >= space) continue;
      // identical positions get a deterministic nudge based on index order
      const nx = d > 0 ? (a.x - b.x) / d : 1;
      const ny = d > 0 ? (a.y - b.y) / d : 0;
      const push = (space - d) / 2;
      place(a, { x: a.x + nx * push, y: a.y + ny * push });
      place(b, { x: b.x - nx * push, y: b.y - ny * push });
    }
  }
}

/** Shortest distance from p to the segment a→b (used by line attacks like Ultimate Roll). */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

export { place };
