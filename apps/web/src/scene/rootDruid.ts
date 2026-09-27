// Root Druid (Taro the mole): cracks run through the ground and roots burst up under the foes.
// Uses its own sheets once they are generated (vfx/druid-*), and similar existing effects until then.
import gsap from 'gsap';
import { Graphics } from 'pixi.js';
import type { Point } from '@puff/sim';
import { CLASS_COLOR, vfxOr } from '../assets';
import type { ActorView } from './actor';
import { glowFlare, magicCircle, screenFlash, sparks, speedLines } from './anime';
import type { SceneApi } from './api';
import { addHit, alive, at, hop, type ImpactTimes } from './choreo';
import { decal, playFx } from './fx';

const MOSS = CLASS_COLOR['root-druid'];
/** stand-in effects are the boss's magenta vines: pull them toward green */
const STAND_IN_TINT = 0x9fe07a;

const sheet = (own: string, standIn: string): { sheet: string; tint?: number } => {
  const s = vfxOr(own, standIn);
  return s === own ? { sheet: s } : { sheet: s, tint: STAND_IN_TINT };
};

/** A jagged glowing crack that races across the ground from one point to another, then fades. */
export function groundCrack(api: SceneApi, from: Point, to: Point, seconds: number, width = 5): void {
  const g = new Graphics();
  g.zIndex = -900;
  api.ground.addChild(g);
  const steps = Math.max(6, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 14));
  // fixed jitter per crack so it doesn't flicker while growing
  const jitter = Array.from({ length: steps + 1 }, (_, i) => (i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 18));
  const nx = -(to.y - from.y);
  const ny = to.x - from.x;
  const nl = Math.hypot(nx, ny) || 1;
  const point = (i: number) => {
    const t = i / steps;
    return { x: from.x + (to.x - from.x) * t + (nx / nl) * jitter[i]!, y: from.y + (to.y - from.y) * t + (ny / nl) * jitter[i]! * 0.5 };
  };
  const draw = (progress: number) => {
    if (g.destroyed) return;
    const n = Math.max(1, Math.round(steps * progress));
    g.clear();
    for (const [w, color, alpha] of [
      [width * 2.6, MOSS, 0.35],
      [width, 0x3a2414, 0.95],
      [width * 0.35, 0xd9ff9a, 0.9],
    ] as const) {
      const p0 = point(0);
      g.moveTo(p0.x, p0.y);
      for (let i = 1; i <= n; i++) {
        const p = point(i);
        g.lineTo(p.x, p.y);
      }
      g.stroke({ color, width: w, alpha, cap: 'round', join: 'round' });
    }
  };
  const grow = { t: 0 };
  gsap
    .timeline({ onComplete: () => void (!g.destroyed && g.destroy()) })
    .to(grow, { t: 1, duration: seconds, ease: 'power2.out', onUpdate: () => draw(grow.t) })
    .to(g, { alpha: 0, duration: 0.6 }, seconds + 0.6);
}

/** A root bursting up out of the ground at a point. */
export function rootSpike(api: SceneApi, x: number, y: number, size: number): void {
  const s = sheet('vfx/druid-root-spike', 'vfx/boss-summon');
  playFx(api.fx, s.sheet, x, y + 6, { size, frameTime: 0.06, zIndex: y + 20, tint: s.tint, swell: 1 });
  sparks(api.fx, x, y - size * 0.3, 0xc8f08a, 5, 60);
}

/** Basic attack: tap the staff, a thin crack runs to the foe and a small root jabs up under it. */
export function druidAttack(api: SceneApi, druid: ActorView, target: ActorView): number {
  const travel = 0.2;
  const from = { x: druid.root.x, y: druid.root.y };
  const to = { x: target.root.x, y: target.root.y };
  groundCrack(api, from, to, travel, 3);
  at(travel, [target], () => rootSpike(api, target.root.x, target.root.y, 60));
  return travel + 0.04;
}

/**
 * Root Awakening (~1.9 s): the druid raises its staff and stamps; cracks race out to every foe;
 * roots jab up three times, wrap and lift the foes, then a giant root erupts in the middle and slams them down.
 */
export function rootAwakening(api: SceneApi, druid: ActorView, center: Point, targets: ActorView[]): ImpactTimes {
  const hits: ImpactTimes = new Map();
  druid.pose('sig', 0, 0.3);
  magicCircle(api.ground, druid.root.x, druid.root.y, 60, MOSS, 1.8);
  glowFlare(api.fx, druid.root.x, druid.root.y - 40, MOSS, 140, 0.5);

  at(0.25, [druid], () => {
    druid.pose('sig', 1, 0.3);
    hop(druid, 22, 0.2);
    api.shake(5);
    playFx(api.ground, 'vfx/knight-leap-dust', druid.root.x, druid.root.y + 6, { size: 80, frameTime: 0.12, tint: 0xd8c09a });
    const from = { x: druid.root.x, y: druid.root.y };
    groundCrack(api, from, center, 0.3, 7);
    for (const t of targets) groundCrack(api, center, { x: t.root.x, y: t.root.y }, 0.35, 4);
  });

  // three jabs, each bigger, then the lift
  const jabs = [0.62, 0.86, 1.1];
  jabs.forEach((when, j) => {
    for (const t of targets) {
      const w = when + (t.unit.id.length % 3) * 0.02;
      addHit(hits, t.unit.id, w);
      at(w, [t], () => {
        const side = (j - 1) * 16;
        rootSpike(api, t.root.x + side, t.root.y + 4, 56 + j * 16);
        api.sound('hit');
      });
    }
    at(when, [], () => api.shake(3 + j * 2));
  });
  at(1.12, [druid], () => druid.pose('sig', 2, 0.4));
  for (const t of targets) {
    at(1.15, [t], () => {
      gsap.to(t.body, { y: -34, duration: 0.25, ease: 'power2.out' });
      decal(api.ground, vfxOr('vfx/druid-root-bind', 'vfx/guard-taunt'), t.root.x, t.root.y, { width: 70, hold: 0.4, tint: STAND_IN_TINT });
    });
  }

  // the giant root
  const erupt = 1.52;
  at(erupt - 0.12, [], () => {
    const s = sheet('vfx/druid-root-erupt', 'vfx/boss-vine-slam');
    playFx(api.fx, s.sheet, center.x, center.y + 10, { size: 230, frameTime: 0.07, zIndex: center.y + 60, tint: s.tint });
    speedLines(api.overlay, center.x, center.y - 50, 0xd9ff9a, 0.45);
  });
  at(erupt, [], () => {
    for (const t of targets) if (alive(t)) gsap.to(t.body, { y: 0, duration: 0.14, ease: 'power3.in' });
    playFx(api.ground, 'vfx/guard-slam-ring', center.x, center.y, { size: 240, byWidth: true, anchor: 'center', frameTime: 0.07, tint: 0xb8e07a });
    decal(api.ground, 'vfx/knight-scorch', center.x, center.y, { width: 160, hold: 1.2, tint: 0x6b8f3a });
    glowFlare(api.fx, center.x, center.y - 30, MOSS, 240, 0.5);
    sparks(api.fx, center.x, center.y - 40, 0xd9ff9a, 22, 190);
    api.filters.shockwave(center.x, center.y, 30);
    api.filters.zoomBurst(center.x, center.y - 30, 0.16);
    screenFlash(api.overlay, api.screen, 0xe6ffc0, 0.3);
    api.sound('ult-root-druid');
    api.shake(15);
    api.hitstop(100);
  });
  at(erupt, [druid], () => druid.pose('sig', 3, 0.5));
  // the scene reads the hit list right away, so the finisher is planned here, not inside the callback
  for (const t of targets) addHit(hits, t.unit.id, erupt);
  return hits;
}
