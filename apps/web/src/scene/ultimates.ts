// Ultimate choreography: every skill starts at the caster, travels, and lands on its targets.
// Each one is a 1.5–2 s combo with several hits; the damage number is split across them (see BattleScene).
import gsap from 'gsap';
import type { HeroClass, Point } from '@puff/sim';
import { CLASS_COLOR } from '../assets';
import type { ActorView } from './actor';
import { glowFlare, magicCircle, screenFlash, slashArc, sparks, speedLines } from './anime';
import type { SceneApi } from './api';
import { addHit, alive, at, dash, hitAll, hop, nearestFirst, script, type ImpactTimes } from './choreo';
import { decal, fxSprite, playFx } from './fx';
import { PROJECTILES, launch } from './projectiles';
import { rootAwakening } from './rootDruid';
import { bearHugFestival, mochiRain } from './ultimateSupport';

export type { ImpactTimes } from './choreo';

export interface UltimateEvent {
  readonly source: string;
  readonly heroClass: HeroClass;
  readonly targets: readonly string[];
  readonly from: Point;
  readonly at: Point;
}

/** How long the field stays dimmed while a combo plays. */
const COMBO_DIM = 1.8;

export function playUltimate(api: SceneApi, ev: UltimateEvent): ImpactTimes {
  const caster = api.actor(ev.source);
  if (!caster) return new Map();
  const targets = ev.targets.map((id) => api.actor(id)).filter((a): a is ActorView => !!a && !a.gone);
  api.dim(COMBO_DIM);
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
    case 'root-druid':
      return rootAwakening(api, caster, ev.at, targets);
  }
}

/**
 * Three dash-slashes through the pack (afterimages, crescent arcs), then a spinning leap
 * and a flaming crescent slam that sends a fire wave rolling on.
 */
function carrotCrescent(api: SceneApi, knight: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['carrot-knight'];
  const flip = knight.unit.facing < 0;
  const order = nearestFirst(knight, targets);
  const stops = [0, 1, 2].map((i) => order[i % Math.max(1, order.length)]?.root ?? ev.at);
  const slashes = [0.22, 0.46, 0.7];
  const slam = 1.35;
  script(knight, 1.65);
  knight.root.position.set(ev.from.x, ev.from.y);
  knight.pose('sig', 0, 0.12);
  playFx(api.ground, 'vfx/knight-leap-dust', ev.from.x, ev.from.y + 6, { size: 70, frameTime: 0.2 });

  slashes.forEach((when, i) => {
    const stop = stops[i]!;
    const side = i % 2 === 0 ? -1 : 1;
    at(when - 0.14, [knight], () => {
      knight.pose('sig', 1 + (i % 2), 0.2);
      dash(api, knight, { x: stop.x + side * 34, y: stop.y + 6 }, 0.13, color);
      api.sound('swing');
    });
    at(when, [knight], () => {
      const c = { x: stop.x, y: stop.y - 30 };
      slashArc(api.fx, c.x, c.y, 46, (side * Math.PI) / 4 + Math.PI / 2, color, 0.3);
      playFx(api.fx, 'vfx/knight-slash-small', c.x, c.y + 18, { size: 90, flip: side > 0, frameTime: 0.05 });
      sparks(api.fx, c.x, c.y, 0xffc680, 10, 140);
      api.shake(5);
    });
  });

  // spinning leap to the centre of the pack, then the flaming crescent
  at(0.84, [knight], () => {
    knight.pose('sig', 1, 0.25);
    gsap.to(knight.root, { x: ev.at.x - knight.unit.facing * 30, y: ev.at.y, duration: 0.5, ease: 'power1.inOut' });
    hop(knight, 120, 0.5, 1);
    speedLines(api.overlay, ev.at.x, ev.at.y - 40, 0xffe0b0, 0.5);
  });
  at(slam - 0.16, [knight], () => {
    knight.pose('sig', 2, 0.2);
    playFx(api.fx, 'vfx/knight-crescent-smear', ev.at.x, ev.at.y + 10, { size: 170, flip, frameTime: 0.05, zIndex: ev.at.y + 30 });
    if (knight.unit.relics.includes('carrot-excalibur')) {
      // Carrot Excalibur: a second, golden crescent crosses the first
      playFx(api.fx, 'vfx/knight-crescent-smear', ev.at.x, ev.at.y + 10, { size: 195, flip: !flip, frameTime: 0.05, tint: 0xffe07a, zIndex: ev.at.y + 31 });
    }
  });
  at(slam, [knight], () => {
    knight.pose('sig', 3, 0.45);
    const t = { x: ev.at.x, y: ev.at.y - 30 };
    playFx(api.fx, 'vfx/knight-impact', t.x, t.y + 20, { size: 150, anchor: 'center', frameTime: 0.07 });
    const wave = fxSprite('vfx/knight-firewave', { size: 140, byWidth: true, anchor: 'center', flip });
    wave.position.set(ev.at.x, ev.at.y - 12);
    wave.zIndex = ev.at.y + 25;
    api.fx.addChild(wave);
    gsap.timeline({ onComplete: () => wave.destroy() }).to(wave, { x: ev.at.x + knight.unit.facing * 170, duration: 0.5, ease: 'power2.out' }).to(wave, { alpha: 0, duration: 0.2 }, 0.35);
    decal(api.ground, 'vfx/knight-scorch', ev.at.x + knight.unit.facing * 40, ev.at.y, { width: 150, hold: 1.4 });
    glowFlare(api.fx, t.x, t.y, 0xff8a2a, 170, 0.5);
    api.filters.shockwave(t.x, t.y, 26);
    api.filters.zoomBurst(t.x, t.y, 0.18);
    screenFlash(api.overlay, api.screen, 0xffc680, 0.4);
    api.sound('ult-carrot-knight');
    api.shake(14);
    api.hitstop(90);
  });
  return hitAll(targets, [...slashes, slam]);
}

/** Backflip, three arrow volleys, then a light arrow into the sky and a storm of arrows raining down in waves. */
function leafStorm(api: SceneApi, archer: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['leaf-archer'];
  const hits: ImpactTimes = new Map();
  script(archer, 1.75);
  const back = { x: archer.root.x - archer.unit.facing * 40, y: archer.root.y };
  archer.pose('sig', 2, 0.3);
  gsap.to(archer.root, { x: back.x, y: back.y, duration: 0.3, ease: 'power2.out' });
  hop(archer, 50, 0.3, 1);

  const volleys = [0.35, 0.52, 0.69];
  volleys.forEach((when, v) => {
    at(when, [archer], () => {
      archer.pose('sig', 3, 0.14);
      const bow = archer.muzzle(0.25, 0.55);
      playFx(api.fx, 'vfx/archer-release', bow.x, bow.y, { size: 46, anchor: 'center', flip: archer.unit.facing < 0, frameTime: 0.05 });
      api.sound('pew');
    });
    targets.forEach((t, i) => {
      if ((i + v) % 2 === 1 && targets.length > 2) return; // alternate targets so volleys read as separate shots
      const bow = archer.muzzle(0.25, 0.55);
      const to = t.chest();
      const flight = Math.max(0.12, Math.hypot(to.x - bow.x, to.y - bow.y) / PROJECTILES.arrow.speed);
      addHit(hits, t.unit.id, when + flight);
      at(when, [archer, t], () => launch(api.fx, PROJECTILES.arrow, archer.muzzle(0.25, 0.55), t.chest(), () => {
        if (!alive(t)) return;
        const c = t.chest();
        playFx(api.fx, 'vfx/archer-hit', c.x, c.y, { size: 48, anchor: 'center', frameTime: 0.05 });
      }));
    });
  });

  at(0.85, [archer], () => {
    archer.pose('sig', 3, 0.5);
    const bow = archer.muzzle(0.1, 0.7);
    launch(api.fx, PROJECTILES.skyArrow, bow, { x: bow.x, y: bow.y - 360 });
    decal(api.ground, 'vfx/archer-target-zone', ev.at.x, ev.at.y, { width: 230, hold: 1 });
    magicCircle(api.ground, ev.at.x, ev.at.y, 110, color, 1);
    api.sound('pew');
  });
  const rain = [1.2, 1.38, 1.56];
  at(1.1, [archer], () => {
    playFx(api.fx, 'vfx/archer-rain', ev.at.x, ev.at.y + 20, { size: 250, byWidth: true, frameTime: 0.12, zIndex: ev.at.y + 40 });
    speedLines(api.overlay, ev.at.x, ev.at.y - 20, 0xd9ffc2, 0.6);
    api.sound('ult-leaf-archer');
  });
  rain.forEach((when, wave) => {
    at(when, [archer], () => {
      api.shake(wave === rain.length - 1 ? 10 : 5);
      if (wave === rain.length - 1) api.filters.zoomBurst(ev.at.x, ev.at.y - 20, 0.14);
    });
    targets.forEach((t, i) => {
      const w = when + (i % 3) * 0.03;
      addHit(hits, t.unit.id, w);
      at(w, [t], () => {
        const c = t.chest();
        playFx(api.fx, 'vfx/archer-hit', c.x + (wave - 1) * 8, c.y, { size: 56, anchor: 'center', frameTime: 0.05 });
      });
    });
  });
  return hits;
}

/** Bubbles gather and orbit the mage, fly out to swallow each foe, get peppered by more bubbles, then all squeeze at once. */
function bubblePrison(api: SceneApi, mage: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['bubble-mage'];
  const hits: ImpactTimes = new Map();
  mage.pose('sig', 2, 1.6);
  magicCircle(api.ground, mage.root.x, mage.root.y, 60, color, 1.6);
  decal(api.ground, 'vfx/bubble-circle', ev.at.x, ev.at.y, { width: 230, hold: 1.5 });
  api.sound('ult-bubble-mage');

  // orbiting bubbles around the mage
  const orbs = Array.from({ length: 6 }, () => fxSprite('vfx/bubble-orb', { size: 30, anchor: 'center' }));
  const spin = { a: 0, r: 10 };
  for (const o of orbs) api.fx.addChild(o);
  gsap.to(spin, {
    a: Math.PI * 3,
    r: 46,
    duration: 0.7,
    ease: 'power1.in',
    onUpdate: () =>
      orbs.forEach((o, i) => {
        if (o.destroyed) return;
        const a = spin.a + (i / orbs.length) * Math.PI * 2;
        o.position.set(mage.root.x + Math.cos(a) * spin.r, mage.root.y - 40 + Math.sin(a) * spin.r * 0.5);
        o.zIndex = o.y + 60;
      }),
    onComplete: () => orbs.forEach((o) => o.destroy()),
  });

  const wand = () => mage.muzzle(0.3, 0.6);
  targets.forEach((t, i) => {
    const wait = 0.7 + i * 0.05;
    const to = t.chest();
    const flight = Math.max(PROJECTILES.bigBubble.minDuration, Math.hypot(to.x - wand().x, to.y - wand().y) / PROJECTILES.bigBubble.speed);
    addHit(hits, t.unit.id, wait + flight);
    at(wait, [mage, t], () => {
      playFx(api.fx, 'vfx/bubble-blow', wand().x, wand().y, { size: 60, byWidth: true, anchor: 'center', flip: mage.unit.facing < 0, frameTime: 0.08 });
      launch(api.fx, PROJECTILES.bigBubble, wand(), t.chest(), () => {
        if (!alive(t)) return;
        const c = t.chest();
        playFx(api.fx, 'vfx/bubble-splash', c.x, c.y, { size: 60, anchor: 'center', frameTime: 0.06 });
        t.trapInBubble();
      });
    });
    // a second stream of small bubbles pops against the prison
    const pepper = 1.25 + (i % 3) * 0.04;
    addHit(hits, t.unit.id, pepper);
    at(pepper - 0.2, [mage, t], () => launch(api.fx, PROJECTILES.bubble, wand(), t.chest()));
    at(pepper, [t], () => {
      const c = t.chest();
      playFx(api.fx, 'vfx/bubble-splash', c.x + 10, c.y - 6, { size: 38, anchor: 'center', frameTime: 0.05 });
    });
  });

  const burst = 1.65;
  at(burst, [], () => {
    for (const t of targets.filter((x) => alive(x))) {
      const c = t.chest();
      // the prison squeezes (big splash); it pops for real with bubble-prison-burst when the stun ends
      playFx(api.fx, 'vfx/bubble-splash', c.x, c.y, { size: 100, anchor: 'center', frameTime: 0.06 });
      playFx(api.fx, 'vfx/status-stun', t.root.x, t.root.y - t.height * 1.05, { size: 44, anchor: 'center', frameTime: 0.1 });
      addHit(hits, t.unit.id, burst);
    }
    glowFlare(api.fx, ev.at.x, ev.at.y - 20, color, 220, 0.5);
    api.filters.shockwave(ev.at.x, ev.at.y - 20, 22);
    screenFlash(api.overlay, api.screen, 0xd8f0ff, 0.3);
    api.shake(9);
    api.hitstop(70);
  });
  return hits;
}

/** Curl into a ball and roll through the pack, bounce, roll back through, then a huge body-slam in the middle. */
function ultimateRoll(api: SceneApi, guard: ActorView, ev: UltimateEvent, targets: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['pillow-guard'];
  const hits: ImpactTimes = new Map();
  const a = ev.from;
  const b = ev.at;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  script(guard, 1.75);
  guard.root.position.set(a.x, a.y);
  guard.pose('sig', 1, 0.12);

  const trail = fxSprite('vfx/guard-roll-trail', { size: 120, byWidth: true, anchor: 'center' });
  trail.anchor.set(1, 0.5);
  trail.alpha = 0;
  api.fx.addChild(trail);
  const pass = (start: number, from: Point, to: Point, dur: number) => {
    at(start, [guard], () => {
      guard.pose('sig', 2, dur);
      trail.rotation = Math.atan2(to.y - from.y, to.x - from.x);
      trail.position.set(from.x, from.y - 20);
      gsap.to(trail, { alpha: 1, duration: 0.06 });
      gsap.to(trail, { x: to.x, y: to.y - 20, duration: dur, ease: 'power1.in' });
      gsap.to(trail, { alpha: 0, duration: 0.15, delay: dur });
      gsap.to(guard.root, { x: to.x, y: to.y, duration: dur, ease: 'power1.in' });
      gsap.fromTo(guard.body, { rotation: 0 }, { rotation: Math.PI * 4 * Math.sign(to.x - from.x || 1), duration: dur, onComplete: () => void (guard.body.rotation = 0) });
      api.sound('swing');
    });
    for (const t of targets) {
      // hit when the ball passes the target's spot along the path
      const along = Math.max(0, Math.min(1, ((t.root.x - a.x) * dx + (t.root.y - a.y) * dy) / len2));
      const when = start + dur * (to === b ? along : 1 - along);
      addHit(hits, t.unit.id, when);
      at(when, [t], () => {
        const c = t.chest();
        playFx(api.fx, 'vfx/guard-bash', c.x, c.y, { size: 60, anchor: 'center', frameTime: 0.05 });
        api.shake(4);
      });
    }
  };
  pass(0.12, a, b, 0.34);
  at(0.46, [guard], () => hop(guard, 40, 0.2));
  pass(0.66, b, a, 0.34);

  // big jump into the middle and body-slam
  const slam = 1.45;
  at(1.0, [guard], () => {
    guard.pose('sig', 1, 0.45);
    gsap.to(guard.root, { x: b.x, y: b.y, duration: 0.45, ease: 'power1.inOut' });
    hop(guard, 150, 0.45);
    speedLines(api.overlay, b.x, b.y - 40, 0xfff0c0, 0.45);
  });
  at(slam, [], () => trail.destroy());
  at(slam, [guard], () => {
    guard.pose('sig', 3, 0.4);
    playFx(api.ground, 'vfx/guard-slam-ring', b.x, b.y, { size: 230, byWidth: true, anchor: 'center', frameTime: 0.07 });
    decal(api.ground, 'vfx/guard-taunt', b.x, b.y, { width: 130, hold: 1.2 });
    glowFlare(api.fx, b.x, b.y - 20, color, 200, 0.5, 0.5);
    sparks(api.fx, b.x, b.y - 10, 0xfff0c0, 20, 180);
    api.filters.shockwave(b.x, b.y, 30);
    api.filters.zoomBurst(b.x, b.y - 20, 0.14);
    api.sound('ult-pillow-guard');
    api.shake(16);
    api.hitstop(100);
  });
  for (const t of targets) addHit(hits, t.unit.id, slam);
  return hits;
}
