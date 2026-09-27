// Ultimate choreography: every skill starts at the caster, travels, and lands on its targets.
import gsap from 'gsap';
import type { HeroClass, Point } from '@puff/sim';
import { CLASS_COLOR } from '../assets';
import type { ActorView } from './actor';
import { glowFlare, screenFlash, speedLines } from './anime';
import type { SceneApi } from './api';
import { decal, fxSprite, playFx } from './fx';
import { PROJECTILES, launch } from './projectiles';

export interface UltimateEvent {
  readonly source: string;
  readonly heroClass: HeroClass;
  readonly targets: readonly string[];
  readonly from: Point;
  readonly at: Point;
}

/** Per target: how many seconds until the skill actually hits it. */
export type ImpactTimes = Map<string, number>;

const every = (targets: readonly ActorView[], delay: number): ImpactTimes => new Map(targets.map((t) => [t.unit.id, delay]));

export function playUltimate(api: SceneApi, ev: UltimateEvent): ImpactTimes {
  const caster = api.actor(ev.source);
  if (!caster) return new Map();
  const targets = ev.targets.map((id) => api.actor(id)).filter((a): a is ActorView => !!a && !a.gone);
  api.dim(0.9);
  switch (ev.heroClass) {
    case 'carrot-knight':
      return carrotCrescent(api, caster, ev, targets);
    case 'leaf-archer':
      return leafStorm(api, caster, ev, targets);
    case 'bubble-mage':
      return bubblePrison(api, caster, ev, targets);
    case 'pillow-guard':
      return ultimateRoll(api, caster, ev, targets);
    case 'mochi-cleric':
      return mochiRain(api, caster, targets);
    case 'bell-bard':
      return bearHugFestival(api, caster, targets);
  }
}

/** Crouch → leap in an arc → spin → slam down; a fire wave rolls on and leaves a scorch mark. */
function carrotCrescent(api: SceneApi, knight: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const land = { x: knight.unit.x, y: knight.unit.y };
  const flip = knight.unit.facing < 0;
  const leap = 0.42;
  const impact = 0.08 + leap;
  knight.scripted = true;
  knight.root.position.set(ev.from.x, ev.from.y);
  knight.pose('sig', 0, 0.08);
  playFx(api.ground, 'vfx/knight-leap-dust', ev.from.x, ev.from.y + 6, { size: 70, frameTime: 0.3 });
  api.sound('swing');
  const tl = gsap.timeline({ delay: 0.08 });
  tl.call(() => knight.pose('sig', 1, leap * 0.45));
  tl.to(knight.root, { x: land.x, y: land.y, duration: leap, ease: 'power1.inOut' }, 0);
  tl.to(knight.body, { y: -95, duration: leap * 0.5, ease: 'power2.out' }, 0);
  tl.call(() => knight.pose('sig', 2, leap * 0.3), undefined, leap * 0.45);
  tl.to(knight.body, { y: 0, duration: leap * 0.5, ease: 'power3.in' }, leap * 0.5);
  tl.call(() => {
    knight.pose('sig', 3, 0.45);
    knight.scripted = false;
  }, undefined, leap);
  gsap.delayedCall(impact - 0.14, () => playFx(api.fx, 'vfx/knight-crescent-smear', land.x, land.y + 10, { size: 150, flip, frameTime: 0.06, zIndex: land.y + 30 }));
  if (knight.unit.relics.includes('carrot-excalibur')) {
    // Carrot Excalibur: a second, golden crescent crosses the first
    gsap.delayedCall(impact - 0.02, () => playFx(api.fx, 'vfx/knight-crescent-smear', land.x, land.y + 10, { size: 175, flip: !flip, frameTime: 0.06, tint: 0xffe07a, zIndex: land.y + 31 }));
  }
  gsap.delayedCall(impact, () => {
    const t = targets[0]?.chest() ?? { x: ev.at.x, y: ev.at.y - 30 };
    playFx(api.fx, 'vfx/knight-impact', t.x, t.y + 20, { size: 130, anchor: 'center', frameTime: 0.07 });
    const wave = fxSprite('vfx/knight-firewave', { size: 120, byWidth: true, anchor: 'center', flip });
    wave.position.set(land.x, land.y - 12);
    wave.zIndex = land.y + 25;
    api.fx.addChild(wave);
    gsap.timeline({ onComplete: () => wave.destroy() }).to(wave, { x: land.x + knight.unit.facing * 150, duration: 0.45, ease: 'power2.out' }).to(wave, { alpha: 0, duration: 0.2 }, 0.3);
    decal(api.ground, 'vfx/knight-scorch', land.x + knight.unit.facing * 40, land.y, { width: 130, hold: 1.4 });
    glowFlare(api.fx, t.x, t.y, 0xff8a2a, 140, 0.45);
    api.filters.shockwave(t.x, t.y, 24);
    api.filters.zoomBurst(t.x, t.y, 0.16);
    screenFlash(api.overlay, api.screen, 0xffc680, 0.4);
    api.sound('ult-carrot-knight');
    api.shake(13);
    api.hitstop(90);
  });
  return every(targets, impact);
}

/** Aim up, fire a light arrow into the sky, a target circle appears, then arrows rain down. */
function leafStorm(api: SceneApi, archer: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  archer.pose('sig', 3, 0.7);
  const bow = archer.muzzle(0.1, 0.7);
  api.sound('pew');
  launch(api.fx, PROJECTILES.skyArrow, bow, { x: bow.x, y: bow.y - 360 });
  decal(api.ground, 'vfx/archer-target-zone', ev.at.x, ev.at.y, { width: 210, hold: 1 });
  const rain = 0.45;
  gsap.delayedCall(rain, () => {
    playFx(api.fx, 'vfx/archer-rain', ev.at.x, ev.at.y + 20, { size: 230, byWidth: true, frameTime: 0.1, zIndex: ev.at.y + 40 });
    speedLines(api.overlay, ev.at.x, ev.at.y - 20, 0xd9ffc2, 0.4);
    api.sound('ult-leaf-archer');
  });
  const hits: ImpactTimes = new Map();
  targets.forEach((t, i) => {
    const when = rain + 0.12 + (i % 4) * 0.05;
    hits.set(t.unit.id, when);
    gsap.delayedCall(when, () => {
      const c = t.chest();
      playFx(api.fx, 'vfx/archer-hit', c.x, c.y, { size: 56, anchor: 'center', frameTime: 0.06 });
    });
  });
  gsap.delayedCall(rain + 0.15, () => {
    api.filters.zoomBurst(ev.at.x, ev.at.y - 20, 0.12);
    api.shake(8);
  });
  return hits;
}

/** A rune circle opens, big bubbles float out to each foe and swallow it (the sim stuns them). */
function bubblePrison(api: SceneApi, mage: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  mage.pose('sig', 2, 0.8);
  decal(api.ground, 'vfx/bubble-circle', ev.at.x, ev.at.y, { width: 210, hold: 1.2 });
  const wand = mage.muzzle(0.3, 0.6);
  playFx(api.fx, 'vfx/bubble-blow', wand.x, wand.y, { size: 70, byWidth: true, anchor: 'center', flip: mage.unit.facing < 0, frameTime: 0.15 });
  api.sound('ult-bubble-mage');
  const hits: ImpactTimes = new Map();
  targets.forEach((t, i) => {
    const wait = 0.15 + i * 0.07;
    const to = t.chest();
    const flight = Math.max(PROJECTILES.bigBubble.minDuration, Math.hypot(to.x - wand.x, to.y - wand.y) / PROJECTILES.bigBubble.speed);
    hits.set(t.unit.id, wait + flight);
    gsap.delayedCall(wait, () =>
      launch(api.fx, PROJECTILES.bigBubble, wand, to, () => {
        playFx(api.fx, 'vfx/bubble-splash', to.x, to.y, { size: 60, anchor: 'center', frameTime: 0.06 });
        t.trapInBubble();
      }),
    );
  });
  const last = Math.max(0.4, ...hits.values());
  gsap.delayedCall(last, () => {
    api.filters.shockwave(ev.at.x, ev.at.y - 20, 18);
    api.shake(6);
  });
  return hits;
}

/** Curl into a ball, roll straight through the pack (trail behind), bounce and slam. */
function ultimateRoll(api: SceneApi, guard: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const roll = 0.38;
  const start = 0.1;
  const dx = ev.at.x - ev.from.x;
  const dy = ev.at.y - ev.from.y;
  const len = Math.hypot(dx, dy) || 1;
  guard.scripted = true;
  guard.root.position.set(ev.from.x, ev.from.y);
  guard.pose('sig', 1, start);
  gsap.delayedCall(start, () => guard.pose('sig', 2, roll));
  const trail = fxSprite('vfx/guard-roll-trail', { size: 120, byWidth: true, anchor: 'center' });
  trail.anchor.set(1, 0.5);
  trail.rotation = Math.atan2(dy, dx);
  trail.position.set(ev.from.x, ev.from.y - 20);
  trail.alpha = 0;
  api.fx.addChild(trail);
  const tl = gsap.timeline({ delay: start, onComplete: () => trail.destroy() });
  tl.to(guard.root, { x: ev.at.x, y: ev.at.y, duration: roll, ease: 'power1.in' }, 0);
  tl.to(trail, { alpha: 1, duration: 0.08 }, 0);
  tl.to(trail, { x: ev.at.x, y: ev.at.y - 20, duration: roll, ease: 'power1.in' }, 0);
  tl.to(trail, { alpha: 0, duration: 0.25 }, roll);
  tl.call(() => {
    guard.scripted = false;
    guard.pose('sig', 3, 0.4);
    playFx(api.ground, 'vfx/guard-slam-ring', ev.at.x, ev.at.y, { size: 200, byWidth: true, anchor: 'center', frameTime: 0.08 });
    decal(api.ground, 'vfx/guard-taunt', ev.at.x, ev.at.y, { width: 120, hold: 1.4 });
    api.filters.shockwave(ev.at.x, ev.at.y, 28);
    api.filters.zoomBurst(ev.at.x, ev.at.y - 20, 0.12);
    api.sound('ult-pillow-guard');
    api.shake(15);
    api.hitstop(100);
  }, undefined, roll);
  const hits: ImpactTimes = new Map();
  for (const t of targets) {
    // hit when the ball passes the target's spot along the path
    const along = Math.max(0, Math.min(1, ((t.unit.x - ev.from.x) * dx + (t.unit.y - ev.from.y) * dy) / (len * len)));
    const when = start + roll * along;
    hits.set(t.unit.id, when);
    gsap.delayedCall(when, () => {
      const c = t.chest();
      playFx(api.fx, 'vfx/guard-bash', c.x, c.y, { size: 60, anchor: 'center', frameTime: 0.06 });
    });
  }
  return hits;
}

/** A golden halo opens in the sky and glowing mochi fall onto every ally. */
function mochiRain(api: SceneApi, cleric: ActorView, allies: ActorView[]): ImpactTimes {
  cleric.pose('sig', 3, 0.9);
  const sky = { x: api.screen.x + api.screen.width / 2, y: 330 };
  playFx(api.fx, 'vfx/holy-sky-ring', sky.x, sky.y, { size: 200, byWidth: true, anchor: 'center', frameTime: 0.5, fade: 0.4, zIndex: 0 });
  api.sound('ult-mochi-cleric');
  screenFlash(api.overlay, api.screen, 0xfff0b0, 0.2);
  const hits: ImpactTimes = new Map();
  allies.forEach((a, i) => {
    const wait = 0.15 + i * 0.07;
    const to = { x: a.root.x, y: a.root.y - a.height * 0.3 };
    hits.set(a.unit.id, wait + PROJECTILES.mochiRain.minDuration + 0.05);
    gsap.delayedCall(wait, () =>
      launch(api.fx, PROJECTILES.mochiRain, to, to, () => {
        playFx(api.fx, 'vfx/mochi-splat', to.x, to.y, { size: 56, anchor: 'center', frameTime: 0.08 });
        playFx(api.fx, 'vfx/heal-pillar', a.root.x, a.root.y + 6, { size: 120, frameTime: 0.12 });
      }),
    );
  });
  return hits;
}

/** A giant golden bell drops and rings; sound waves spread and every ally glows. */
function bearHugFestival(api: SceneApi, bard: ActorView, allies: ActorView[]): ImpactTimes {
  bard.pose('sig', 0, 0.9);
  playFx(api.fx, 'vfx/bard-giant-bell', bard.root.x, bard.root.y + 8, { size: 140, frameTime: 0.12 });
  gsap.delayedCall(0.25, () => {
    playFx(api.ground, 'vfx/bard-soundwave', bard.root.x, bard.root.y, { size: 260, byWidth: true, anchor: 'center', frameTime: 0.1 });
    api.sound('ult-bell-bard');
    api.filters.shockwave(bard.root.x, bard.root.y - 20, 16);
  });
  for (const a of allies) {
    gsap.delayedCall(0.35, () => {
      decal(api.ground, 'vfx/bard-aura', a.root.x, a.root.y, { width: 90, hold: 1.2 });
      glowFlare(api.fx, a.root.x, a.root.y - a.height * 0.4, CLASS_COLOR['bell-bard'], 90, 0.5);
    });
  }
  return every(allies, 0.35);
}
