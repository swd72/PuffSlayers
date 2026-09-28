// Root Druid (Taro the mole): cracks run through the ground and roots burst up under the foes.
// Uses its own sheets once they are generated (vfx/druid-*), and similar existing effects until then.
import gsap from 'gsap';
import { Container, Graphics } from 'pixi.js';
import type { Point } from '@puff/sim';
import { CLASS_COLOR, hasSheet, vfxOr } from '../assets';
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
  at(travel, [target], () => rootSpike(api, target.root.x, target.root.y, 46));
  return travel + 0.04;
}

// ---------- Root Awakening: vines crawl in from below, coil up the foes, squeeze, and a giant root slams ----------

const BARK = 0x5a3a1e;
const BARK_DARK = 0x2f1e10;
const SHOOT = 0xd9ff9a;

interface VinePath {
  readonly from: Point;
  readonly c1: Point;
  readonly c2: Point;
  readonly to: Point;
}

const bezier = (p: VinePath, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * p.from.x + 3 * u * u * t * p.c1.x + 3 * u * t * t * p.c2.x + t * t * t * p.to.x,
    y: u * u * u * p.from.y + 3 * u * u * t * p.c1.y + 3 * u * t * t * p.c2.y + t * t * t * p.to.y,
  };
};

/** A small leaf that pops open on a vine. */
function leaf(layer: Container, at: Point, angle: number, size: number): Graphics {
  const g = new Graphics()
    .moveTo(0, 0)
    .quadraticCurveTo(size * 0.5, -size * 0.45, size, 0)
    .quadraticCurveTo(size * 0.5, size * 0.45, 0, 0)
    .fill(MOSS)
    .moveTo(0, 0)
    .lineTo(size * 0.85, 0)
    .stroke({ color: 0x4d7a1e, width: 1 });
  g.position.set(at.x, at.y);
  g.rotation = angle;
  g.scale.set(0);
  layer.addChild(g);
  gsap.to(g.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
  return g;
}

/**
 * A thick vine that snakes along the ground from `from` to `to` over `grow` seconds (tapered, bark outline,
 * green shine), sprouting leaves as its tip passes. Returns a handle to retract it later.
 */
function crawlingVine(layer: Container, from: Point, to: Point, grow: number, thickness: number): { retract: (seconds: number) => void } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // an S-bend so it slithers instead of shooting straight
  const bend = (Math.random() < 0.5 ? -1 : 1) * Math.min(90, len * 0.35);
  const path: VinePath = {
    from,
    c1: { x: from.x + dx * 0.33 + nx * bend, y: from.y + dy * 0.33 + ny * bend },
    c2: { x: from.x + dx * 0.66 - nx * bend * 0.8, y: from.y + dy * 0.66 - ny * bend * 0.8 },
    to,
  };
  const root = new Container();
  root.zIndex = -800;
  layer.addChild(root);
  const body = new Graphics();
  const leaves = new Container();
  root.addChild(body, leaves);
  const SEGMENTS = 36;
  const points = Array.from({ length: SEGMENTS + 1 }, (_, i) => bezier(path, i / SEGMENTS));
  const leafAt = [0.22, 0.4, 0.58, 0.76].map((t) => ({ t, done: false, side: Math.random() < 0.5 ? -1 : 1 }));
  const state = { p: 0 };
  const draw = () => {
    if (body.destroyed) return;
    const n = Math.max(1, Math.round(SEGMENTS * state.p));
    body.clear();
    // tapered: thick at the base, thin at the growing tip
    for (const [extra, color, alpha] of [
      [3, BARK_DARK, 1],
      [0, BARK, 1],
      [-thickness * 0.55, SHOOT, 0.55],
    ] as const) {
      for (let i = 0; i < n; i++) {
        const a = points[i]!;
        const b = points[i + 1]!;
        const w = Math.max(1, thickness * (1 - (i / n) * 0.75) + extra);
        body.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color, width: w, alpha, cap: 'round' });
      }
    }
    for (const l of leafAt) {
      if (l.done || state.p < l.t) continue;
      l.done = true;
      const i = Math.round(l.t * SEGMENTS);
      const a = points[i]!;
      const b = points[Math.min(SEGMENTS, i + 1)]!;
      leaf(leaves, a, Math.atan2(b.y - a.y, b.x - a.x) + l.side * 0.9, thickness * 2.2);
    }
  };
  gsap.to(state, { p: 1, duration: grow, ease: 'sine.inOut', onUpdate: draw });
  return {
    retract: (seconds) => {
      gsap.to(state, { p: 0, duration: seconds, ease: 'power2.in', onUpdate: draw });
      gsap.to(root, { alpha: 0, duration: seconds, delay: seconds * 0.4, onComplete: () => void (!root.destroyed && root.destroy({ children: true })) });
    },
  };
}

/**
 * Vine coils winding up a body from the feet (drawn half behind, half in front of the sprite, so it wraps).
 * Lives on the actor's body, so it rises and shakes with it.
 */
function coilAround(target: ActorView, climb: number): { squeeze: () => void; burst: () => void } {
  const h = target.height;
  const w = h * 0.62;
  // rings tilt alternately and narrow toward the top, so they read as one vine spiralling up
  const rings = [0.12, 0.34, 0.56].map((y, i) => ({ y: -h * y, rx: w * (0.52 - i * 0.06), ry: h * 0.08, tilt: (i % 2 ? -1 : 1) * h * 0.06 }));
  const back = new Graphics();
  const front = new Graphics();
  const sprouts = new Container();
  target.body.addChildAt(back, 0);
  target.body.addChild(front, sprouts);
  const state = { p: 0, tight: 1 };
  const sprouted = rings.map(() => false);
  const point = (r: (typeof rings)[number], a: number, rx: number) => ({
    x: Math.cos(a) * rx,
    y: r.y + Math.sin(a) * r.ry + Math.cos(a) * r.tilt - ((a - Math.PI) / Math.PI) * h * 0.04,
  });
  const draw = () => {
    if (back.destroyed || front.destroyed) return;
    back.clear();
    front.clear();
    const total = rings.length;
    rings.forEach((r, i) => {
      // each ring appears in turn as the vine climbs
      const t = Math.min(1, Math.max(0, state.p * total - i));
      if (t <= 0) return;
      const rx = r.rx * state.tight;
      const steps = 16;
      for (const [g, from, to] of [
        [back, Math.PI, Math.PI * 2],
        [front, 0, Math.PI],
      ] as const) {
        const end = from + (to - from) * t;
        for (const [width, color, alpha] of [
          [h * 0.075 + 3, BARK_DARK, 1],
          [h * 0.075, BARK, 1],
          [h * 0.018, SHOOT, 0.35],
        ] as const) {
          const p0 = point(r, from, rx);
          g.moveTo(p0.x, p0.y);
          for (let k = 1; k <= steps; k++) {
            const q = point(r, from + ((end - from) * k) / steps, rx);
            g.lineTo(q.x, q.y);
          }
          g.stroke({ color, width, cap: 'round', alpha });
        }
      }
      // leaves pop out once a ring has wrapped all the way round
      if (t >= 1 && !sprouted[i]) {
        sprouted[i] = true;
        for (const a of [0.35, Math.PI - 0.5]) {
          const q = point(r, a, rx);
          leaf(sprouts, q, (a < 1.5 ? -0.5 : Math.PI + 0.5) + (Math.random() - 0.5) * 0.4, h * 0.11);
        }
      }
    });
  };
  gsap.to(state, { p: 1, duration: climb, ease: 'power1.out', onUpdate: draw });
  return {
    squeeze: () => {
      gsap.timeline({ onUpdate: draw }).to(state, { tight: 0.78, duration: 0.07, ease: 'power3.in' }).to(state, { tight: 0.9, duration: 0.18, ease: 'back.out(3)' });
    },
    burst: () => {
      for (const g of [back, front, sprouts]) {
        gsap.to(g, { alpha: 0, duration: 0.35, onComplete: () => void (!g.destroyed && g.destroy({ children: true })) });
        gsap.to(g.scale, { x: 1.35, y: 1.2, duration: 0.35, ease: 'power2.out' });
      }
    },
  };
}

/**
 * Root Awakening (~2.5 s), told like a cartoon beat by beat:
 * 1 Taro raises the staff, the ground rumbles · 2 stamps — vines burst out of the ground at the bottom of the
 * screen and snake across the field to every foe · 3 they coil up the bodies and hoist them · 4 three
 * squeezes · 5 a giant root erupts in the middle and the vines yank everyone down · 6 the vines let go.
 */
export function rootAwakening(api: SceneApi, druid: ActorView, center: Point, targets: ActorView[]): ImpactTimes {
  const hits: ImpactTimes = new Map();
  const bound = targets.slice(0, 6);

  // 1 — wind-up
  druid.pose('sig', 0, 0.35);
  magicCircle(api.ground, druid.root.x, druid.root.y, 60, MOSS, 2.4);
  glowFlare(api.fx, druid.root.x, druid.root.y - 40, MOSS, 110, 0.5);
  at(0.1, [], () => api.shake(2));

  // 2 — stamp, the vines come from below
  const stamp = 0.3;
  const arrive = 0.95;
  const vines: { retract: (s: number) => void }[] = [];
  at(stamp, [druid], () => {
    druid.pose('sig', 1, 0.35);
    hop(druid, 16, 0.18);
    api.shake(6);
    api.sound('hit');
    playFx(api.ground, 'vfx/knight-leap-dust', druid.root.x, druid.root.y + 6, { size: 70, frameTime: 0.1, tint: 0xd8c09a });
    const bottom = api.screen.y + api.screen.height + 30;
    bound.forEach((t, i) => {
      const big = t.unit.isBoss;
      const count = big ? 3 : 2;
      for (let k = 0; k < count; k++) {
        const spread = (k - (count - 1) / 2) * (big ? 90 : 70);
        const fromX = Math.min(api.screen.x + api.screen.width - 20, Math.max(api.screen.x + 20, t.root.x + spread + (i % 2 ? 60 : -60)));
        const to = { x: t.root.x + (k - (count - 1) / 2) * t.height * 0.18, y: t.root.y + 2 };
        const grow = arrive - stamp - 0.05 * k;
        vines.push(crawlingVine(api.ground, { x: fromX, y: bottom }, to, grow, big ? 20 : 13));
        // dirt bursting where each vine breaks the surface on the way
        at(grow * 0.15, [], () => playFx(api.ground, 'vfx/knight-leap-dust', fromX, Math.min(bottom - 40, api.screen.y + api.screen.height - 30), { size: 60, frameTime: 0.08, tint: 0xb89a70 }));
      }
    });
  });

  // 3 — coil and hoist
  const coils = new Map<string, ReturnType<typeof coilAround>>();
  for (const t of bound) {
    at(arrive, [t], () => {
      coils.set(t.unit.id, coilAround(t, 0.35));
      rootSpike(api, t.root.x, t.root.y + 4, t.unit.isBoss ? 80 : 40);
      if (!t.unit.isBoss) gsap.to(t.body, { y: -22, duration: 0.35, ease: 'power2.out' });
    });
  }
  at(arrive + 0.1, [druid], () => druid.pose('sig', 2, 0.9));

  // 4 — three squeezes (the hit numbers pop on each one)
  const squeezes = [1.4, 1.62, 1.84];
  squeezes.forEach((when, j) => {
    for (const t of bound) {
      addHit(hits, t.unit.id, when);
      at(when, [t], () => {
        coils.get(t.unit.id)?.squeeze();
        const c = t.chest();
        sparks(api.fx, c.x, c.y, SHOOT, 6 + j * 2, 70 + j * 20);
      });
    }
    at(when, [], () => {
      api.shake(3 + j * 2);
      api.sound('hit');
    });
  });
  // foes outside the vines' reach still get the roots from below
  for (const t of targets.slice(bound.length)) {
    for (const when of squeezes) addHit(hits, t.unit.id, when);
    at(squeezes[0]!, [t], () => rootSpike(api, t.root.x, t.root.y + 4, 44));
  }

  // 5 — the giant root and the yank down
  const erupt = 2.15;
  at(erupt - 0.14, [], () => {
    const s = sheet('vfx/druid-root-erupt', 'vfx/boss-vine-slam');
    playFx(api.fx, s.sheet, center.x, center.y + 10, { size: 150, frameTime: 0.07, zIndex: center.y + 60, tint: s.tint });
    speedLines(api.overlay, center.x, center.y - 50, SHOOT, 0.45);
  });
  at(erupt, [druid], () => druid.pose('sig', 3, 0.6));
  at(erupt, [], () => {
    for (const t of bound) {
      if (!alive(t)) continue;
      gsap.to(t.body, { y: 0, duration: 0.12, ease: 'power3.in' });
      coils.get(t.unit.id)?.burst();
      const c = t.chest();
      for (let k = 0; k < 5; k++) leaf(api.fx, { x: c.x + (Math.random() - 0.5) * 30, y: c.y + (Math.random() - 0.5) * 30 }, Math.random() * Math.PI * 2, 10);
    }
    playFx(api.ground, 'vfx/guard-slam-ring', center.x, center.y, { size: 180, byWidth: true, anchor: 'center', frameTime: 0.07, tint: 0xb8e07a });
    decal(api.ground, 'vfx/knight-scorch', center.x, center.y, { width: 120, hold: 1.0, tint: 0x6b8f3a });
    glowFlare(api.fx, center.x, center.y - 30, MOSS, 170, 0.5);
    sparks(api.fx, center.x, center.y - 40, SHOOT, 16, 130);
    api.filters.shockwave(center.x, center.y, 30);
    api.filters.zoomBurst(center.x, center.y - 30, 0.16);
    screenFlash(api.overlay, api.screen, 0xe6ffc0, 0.3);
    api.sound('ult-root-druid');
    api.shake(15);
    api.hitstop(100);
  });
  for (const t of targets) addHit(hits, t.unit.id, erupt);

  // 6 — the vines let go and slither back
  at(erupt + 0.35, [], () => vines.forEach((v) => v.retract(0.5)));
  return hits;
}
