// Things that travel: arrows, seeds, bubbles, mochi. They leave from the caster and act on arrival.
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { fxSprite } from './fx';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type ProjectilePath = 'straight' | 'arc' | 'wobble' | 'fall';

export interface ProjectileSpec {
  readonly sheet: string;
  /** on-screen length (byWidth) or height, in world px */
  readonly size: number;
  readonly byWidth?: boolean;
  /** streak stretched behind the projectile */
  readonly trail?: { readonly sheet: string; readonly length: number };
  /** world px per second */
  readonly speed: number;
  readonly path: ProjectilePath;
  /** spins instead of pointing along the flight direction */
  readonly spin?: number;
  readonly arcHeight?: number;
  readonly minDuration?: number;
}

export const PROJECTILES = {
  arrow: { sheet: 'vfx/archer-arrow', size: 46, byWidth: true, trail: { sheet: 'vfx/archer-arrow-trail', length: 70 }, speed: 900, path: 'straight' },
  seed: { sheet: 'vfx/seed-bullet', size: 26, byWidth: true, trail: { sheet: 'vfx/seed-trail', length: 44 }, speed: 620, path: 'straight', spin: 0 },
  bubble: { sheet: 'vfx/bubble-orb', size: 26, speed: 230, path: 'wobble', minDuration: 0.35 },
  bigBubble: { sheet: 'vfx/bubble-orb', size: 44, speed: 260, path: 'wobble', minDuration: 0.4 },
  mochi: { sheet: 'vfx/mochi-orb', size: 30, speed: 420, path: 'arc', arcHeight: 70, minDuration: 0.35 },
  mochiRain: { sheet: 'vfx/mochi-orb', size: 36, speed: 900, path: 'fall', minDuration: 0.3 },
  skyArrow: { sheet: 'vfx/archer-sky-arrow', size: 90, speed: 1400, path: 'straight', minDuration: 0.18 },
  honey: { sheet: 'vfx/seed-bullet', size: 22, byWidth: true, speed: 420, path: 'arc', arcHeight: 40, minDuration: 0.25 },
} as const satisfies Record<string, ProjectileSpec>;

/** Flies a projectile from → to; returns the flight time in seconds. */
export function launch(layer: Container, spec: ProjectileSpec, from: Point, to: Point, onHit?: () => void, tint?: number): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const duration = Math.max(spec.minDuration ?? 0.12, dist / spec.speed);
  const angle = Math.atan2(dy, dx);

  const body = new Container();
  body.zIndex = 50_000;
  const shot = fxSprite(spec.sheet, { size: spec.size, byWidth: spec.byWidth, anchor: 'center', tint });
  if (spec.trail) {
    const trail = fxSprite(spec.trail.sheet, { size: spec.trail.length, byWidth: true, anchor: 'center', tint });
    trail.anchor.set(1, 0.5); // the streak ends at the projectile's tail
    trail.x = -spec.size * 0.35;
    body.addChild(trail);
  }
  body.addChild(shot);
  // falling mochi comes straight down from the sky onto the target
  const start = spec.path === 'fall' ? { x: to.x + 20, y: to.y - 320 } : from;
  body.position.set(start.x, start.y);
  if (spec.path === 'straight' && spec.spin === undefined) body.rotation = spec.sheet.includes('sky-arrow') ? 0 : angle;
  layer.addChild(body);

  const progress = { t: 0 };
  gsap.to(progress, {
    t: 1,
    duration,
    ease: spec.path === 'fall' ? 'power2.in' : 'none',
    onUpdate: () => {
      if (body.destroyed) return;
      const t = progress.t;
      let x = start.x + (to.x - start.x) * t;
      let y = start.y + (to.y - start.y) * t;
      if (spec.path === 'arc') y -= Math.sin(t * Math.PI) * (spec.arcHeight ?? 50);
      if (spec.path === 'wobble') {
        const side = Math.sin(t * Math.PI * 3) * 10;
        x += -Math.sin(angle) * side;
        y += Math.cos(angle) * side;
        shot.scale.y = shot.scale.x * (1 + Math.sin(t * Math.PI * 6) * 0.08);
      }
      if (spec.spin !== undefined) shot.rotation += 0.35;
      if (spec.path === 'arc') shot.rotation += 0.12;
      body.position.set(x, y);
    },
    onComplete: () => {
      if (!body.destroyed) body.destroy({ children: true });
      onHit?.();
    },
  });
  return duration;
}
