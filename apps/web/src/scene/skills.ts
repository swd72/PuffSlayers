// Everyday actions: basic attacks, Cheek Cannon, heals and boss moves.
// Each attack returns when (in seconds) it connects, so damage numbers pop on impact.
import gsap from 'gsap';
import type { Point } from '@puff/sim';
import type { ActorView } from './actor';
import type { SceneApi } from './api';
import { decal, playFx } from './fx';
import { PROJECTILES, launch, type ProjectileSpec } from './projectiles';
import { druidAttack } from './rootDruid';

const MELEE_HIT = 0.1;

/** Melee lunge + impact at the target. */
function melee(api: SceneApi, src: ActorView, tgt: ActorView, impactSheet: string, size: number): number {
  const dir = src.unit.facing;
  gsap.timeline().to(src.body, { x: 10 * dir, duration: 0.08, ease: 'power2.in' }).to(src.body, { x: 0, duration: 0.2, ease: 'power2.out' });
  gsap.delayedCall(MELEE_HIT, () => {
    const at = tgt.chest();
    playFx(api.fx, impactSheet, at.x, at.y, { size, anchor: 'center', flip: dir < 0, frameTime: 0.06 });
  });
  return MELEE_HIT;
}

/** Fires a projectile after a short wind-up and plays the impact on arrival; returns the connect time. */
function shoot(
  api: SceneApi,
  spec: ProjectileSpec,
  from: Point,
  tgt: ActorView,
  windUp: number,
  impact: { sheet: string; size: number } | null,
  tint?: number,
): number {
  const to = tgt.chest();
  const flight = Math.max(spec.minDuration ?? 0.12, Math.hypot(to.x - from.x, to.y - from.y) / spec.speed);
  gsap.delayedCall(windUp, () =>
    launch(api.fx, spec, from, to, () => {
      if (impact) playFx(api.fx, impact.sheet, to.x, to.y, { size: impact.size, anchor: 'center', frameTime: 0.06 });
    }, tint),
  );
  return windUp + flight;
}

/** A unit's basic attack on another. */
export function basicAttack(api: SceneApi, src: ActorView, tgt: ActorView): number {
  const u = src.unit;
  api.sound(u.stats.range < 80 ? 'swing' : 'pew');
  if (u.heroClass) {
    // a painted attack move sheet (6 frames, frame 2 = impact) if there is one, else the wind-up / release poses
    if (!src.playMove(`move/${u.heroClass}-attack`, 0.45, { 2: 1 })) {
      src.pose('pose', 2, 0.1);
      gsap.delayedCall(0.1, () => src.pose('pose', 3, 0.22));
    }
  } else {
    src.pose('pose', u.isBoss ? 3 : 2, 0.3);
  }
  switch (u.heroClass) {
    case 'carrot-knight':
      return melee(api, src, tgt, 'vfx/knight-slash-small', 60);
    case 'pillow-guard':
      return melee(api, src, tgt, 'vfx/guard-bash', 52);
    case 'leaf-archer': {
      const bow = src.muzzle(0.3, 0.45);
      gsap.delayedCall(0.1, () => playFx(api.fx, 'vfx/archer-release', bow.x, bow.y, { size: 34, byWidth: true, anchor: 'center', flip: u.facing < 0, frameTime: 0.12 }));
      return shoot(api, PROJECTILES.arrow, bow, tgt, 0.1, { sheet: 'vfx/archer-hit', size: 56 });
    }
    case 'bubble-mage': {
      const wand = src.muzzle(0.32, 0.5);
      playFx(api.fx, 'vfx/bubble-blow', wand.x, wand.y, { size: 44, byWidth: true, anchor: 'center', flip: u.facing < 0, frameTime: 0.14 });
      return shoot(api, PROJECTILES.bubble, wand, tgt, 0.08, { sheet: 'vfx/bubble-splash', size: 52 });
    }
    case 'mochi-cleric':
      return shoot(api, PROJECTILES.mochi, src.muzzle(0.2, 0.6), tgt, 0.1, { sheet: 'vfx/mochi-splat', size: 46 });
    case 'bell-bard': {
      playFx(api.ground, 'vfx/bard-soundwave', src.root.x, src.root.y, { size: 90, byWidth: true, anchor: 'center', frameTime: 0.08 });
      const at = tgt.chest();
      gsap.delayedCall(0.18, () => playFx(api.fx, 'vfx/hit-blunt', at.x, at.y, { size: 40, anchor: 'center', tint: 0xffb3dc }));
      return 0.18;
    }
    case 'root-druid':
      return druidAttack(api, src, tgt);
    default:
      return enemyAttack(api, src, tgt);
  }
}

function enemyAttack(api: SceneApi, src: ActorView, tgt: ActorView): number {
  const u = src.unit;
  if (u.bossKind === 'sunflower-colossus' || u.bossKind === 'lotus-moon-sage') {
    return shoot(api, PROJECTILES.seed, src.muzzle(0.25, 0.55), tgt, 0.2, { sheet: 'vfx/seed-pop', size: 70 }, u.bossKind === 'lotus-moon-sage' ? 0xffb8d8 : undefined);
  }
  switch (u.enemyKind) {
    case 'sunflower': {
      const mouth = src.muzzle(0.25, 0.45);
      gsap.delayedCall(0.12, () => playFx(api.fx, 'vfx/cheek-spit-puff', mouth.x, mouth.y, { size: 42, byWidth: true, anchor: 'center', flip: u.facing < 0, frameTime: 0.07 }));
      return shoot(api, PROJECTILES.seed, mouth, tgt, 0.14, { sheet: 'vfx/seed-pop', size: 40 });
    }
    case 'honey-bud':
      return shoot(api, PROJECTILES.honey, src.muzzle(0.25, 0.5), tgt, 0.14, null, 0xffc933);
    case 'lavender':
      return shoot(api, PROJECTILES.mochi, src.muzzle(0.2, 0.6), tgt, 0.12, { sheet: 'vfx/hit-blunt', size: 36 }, 0xc9a7ff);
    default:
      return melee(api, src, tgt, 'vfx/hit-blunt', u.isBoss ? 90 : 40);
  }
}

/** Hamham species skill: cheeks puff up, then a fan of seeds bursts from the mouth. */
export function cheekCannon(api: SceneApi, src: ActorView, targets: readonly ActorView[]): Map<string, number> {
  const hits = new Map<string, number>();
  const puff = 0.28;
  if (src.hasSet('cheek')) {
    src.pose('cheek', 0, puff);
    gsap.delayedCall(puff, () => src.pose('cheek', 1, 0.35));
  } else {
    src.pose('pose', 2, puff);
    gsap.delayedCall(puff, () => src.pose('pose', 3, 0.35));
  }
  gsap.to(src.body.scale, { x: 1.12, duration: puff * 0.8, yoyo: true, repeat: 1 });
  const mouth = src.muzzle(0.24, 0.5);
  gsap.delayedCall(puff, () => {
    api.sound('pew');
    playFx(api.fx, 'vfx/cheek-spit-puff', mouth.x, mouth.y, { size: 64, byWidth: true, anchor: 'center', flip: src.unit.facing < 0, frameTime: 0.08 });
  });
  targets.forEach((tgt, i) => hits.set(tgt.unit.id, shoot(api, PROJECTILES.seed, mouth, tgt, puff + i * 0.05, { sheet: 'vfx/seed-pop', size: 44 })));
  return hits;
}

/** A healer's mochi lobbed onto an ally; returns when it lands. */
export function healToss(api: SceneApi, src: ActorView, tgt: ActorView): number {
  src.pose('pose', 3, 0.25);
  return shoot(api, PROJECTILES.mochi, src.muzzle(0.2, 0.6), tgt, 0.08, { sheet: 'vfx/mochi-splat', size: 50 }, src.unit.enemyKind ? 0xc9a7ff : undefined);
}

// ---------- boss ----------

export function bossSummon(api: SceneApi, boss: ActorView | undefined, spawned: readonly ActorView[]): void {
  boss?.pose('pose', 2, 0.8);
  api.sound('wave');
  for (const m of spawned) {
    playFx(api.ground, 'vfx/boss-summon', m.unit.x, m.unit.y + 6, { size: 80, frameTime: 0.12, zIndex: m.unit.y - 1 });
    m.body.scale.set(0);
    gsap.to(m.body.scale, { x: 1, y: 1, duration: 0.4, delay: 0.25, ease: 'back.out(3)' });
  }
}

export function bossTelegraph(api: SceneApi, boss: ActorView | undefined, at: Point, radius: number, delayMs: number): void {
  boss?.pose('pose', 1, delayMs / 1000);
  const warn = decal(api.ground, 'vfx/boss-telegraph', at.x, at.y, { width: radius * 2.3, hold: delayMs / 1000 });
  gsap.to(warn, { alpha: 0.45, duration: 0.18, yoyo: true, repeat: Math.floor(delayMs / 180) });
}

export function bossSlam(api: SceneApi, boss: ActorView | undefined, at: Point): void {
  boss?.pose('pose', 3, 0.45);
  playFx(api.field, 'vfx/boss-vine-slam', at.x, at.y + 10, { size: 150, frameTime: 0.08, zIndex: at.y + 20 });
  api.sound('ult-pillow-guard');
  api.filters.shockwave(at.x, at.y, 26);
  api.shake(14);
  api.hitstop(90);
}
