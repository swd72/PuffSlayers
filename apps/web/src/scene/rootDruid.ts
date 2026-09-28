// Root Druid (Taro the mole): cracks run through the ground and roots burst up under the foes.
// Uses its own sheets once they are generated (vfx/druid-*), and similar existing effects until then.
import gsap from 'gsap';
import { Container, Graphics } from 'pixi.js';
import type { Point } from '@puff/sim';
import { CLASS_COLOR, frames, hasSheet, vfxOr } from '../assets';
import type { ActorView } from './actor';
import { glowFlare, magicCircle, screenFlash, sparks, speedLines } from './anime';
import type { SceneApi } from './api';
import { addHit, alive, at, hop, type ImpactTimes } from './choreo';
import { decal, fxSprite, playFx } from './fx';

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

/**
 * A root bursting up out of the ground at a point. It depth-sorts with the units (just in front of whoever stands
 * at `y`), so a puff standing nearer the camera still draws over it instead of wearing it on its head.
 */
export function rootSpike(api: SceneApi, x: number, y: number, size: number): void {
  const s = sheet('vfx/druid-root-spike', 'vfx/boss-summon');
  playFx(api.field, s.sheet, x, y + 6, { size, frameTime: 0.06, zIndex: y + 2, tint: s.tint, swell: 1 });
  sparks(api.fx, x, y - size * 0.3, 0xc8f08a, 5, 60);
}

/**
 * Basic attack: tap the staff, a crack and a dirt mound race underground from Taro to the foe, and a root jabs
 * up under the foe (sized to it). Farther foes take a little longer to reach.
 */
export function druidAttack(api: SceneApi, druid: ActorView, target: ActorView): number {
  const from = { x: druid.root.x, y: druid.root.y };
  const to = { x: target.root.x, y: target.root.y };
  const travel = Math.min(0.34, Math.max(0.18, Math.hypot(to.x - from.x, to.y - from.y) / 650));
  groundCrack(api, from, to, travel, 3);
  burrow(api.ground, from, to, travel);
  at(travel, [target], () => rootSpike(api, target.root.x, target.root.y, Math.max(46, target.height * 0.75)));
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

/** Where a vine bursts out of the ground next to a foe, and how it arcs over onto the body. */
function emergePath(hole: Point, target: ActorView, side: number): VinePath {
  const h = target.height;
  const top = target.root.y - h * (0.75 + Math.random() * 0.25);
  return {
    from: hole,
    // shoots straight up out of the hole…
    c1: { x: hole.x + side * 6, y: hole.y - h * 0.9 },
    // …arcs over the foe…
    c2: { x: target.root.x + side * h * 0.1, y: top },
    // …and dives onto its waist, where the coil takes over
    to: { x: target.root.x + side * h * 0.28, y: target.root.y - h * 0.18 },
  };
}

/**
 * A thick vine growing along a curve over `grow` seconds: tapered from a heavy base to a thin tip,
 * dark bark outline with a green shine, leaves popping out as the tip passes. Returns a handle to pull it back in.
 */
function growingVine(layer: Container, path: VinePath, grow: number, thickness: number, zIndex: number): { retract: (seconds: number) => void } {
  const root = new Container();
  root.zIndex = zIndex;
  layer.addChild(root);
  const body = new Graphics();
  const leaves = new Container();
  root.addChild(body, leaves);
  const SEGMENTS = 32;
  const points = Array.from({ length: SEGMENTS + 1 }, (_, i) => bezier(path, i / SEGMENTS));
  const leafAt = [0.3, 0.5, 0.7].map((t) => ({ t, done: false, side: Math.random() < 0.5 ? -1 : 1 }));
  const state = { p: 0 };
  const draw = () => {
    if (body.destroyed) return;
    // back.out overshoots past 1: clamp so the tip never reads past the end of the curve
    const n = Math.min(SEGMENTS, Math.max(1, Math.round(SEGMENTS * state.p)));
    body.clear();
    for (const [extra, color, alpha] of [
      [3, BARK_DARK, 1],
      [0, BARK, 1],
      [-thickness * 0.55, SHOOT, 0.45],
    ] as const) {
      for (let i = 0; i < n; i++) {
        const a = points[i]!;
        const b = points[i + 1]!;
        const w = Math.max(1, thickness * (1 - (i / n) * 0.7) + extra);
        body.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color, width: w, alpha, cap: 'round' });
      }
    }
    for (const l of leafAt) {
      if (l.done || state.p < l.t) continue;
      l.done = true;
      const i = Math.round(l.t * SEGMENTS);
      const a = points[i]!;
      const b = points[Math.min(SEGMENTS, i + 1)]!;
      leaf(leaves, a, Math.atan2(b.y - a.y, b.x - a.x) + l.side * 0.9, thickness * 2);
    }
  };
  gsap.to(state, { p: 1, duration: grow, ease: 'back.out(1.4)', onUpdate: draw });
  return {
    retract: (seconds) => {
      gsap.to(state, { p: 0, duration: seconds, ease: 'power2.in', onUpdate: draw });
      gsap.to(root, { alpha: 0, duration: seconds, delay: seconds * 0.5, onComplete: () => void (!root.destroyed && root.destroy({ children: true })) });
    },
  };
}

const VINE_SHEET = 'vfx/druid-vine-emerge';
const COIL_SHEET = 'vfx/druid-vine-coil';

/**
 * The painted vine (art-prompts §13): a shoot bursts out of the hole, grows tall and arcs over toward the foe
 * (frames 0–3), holds, then sinks back into the ground.
 */
function paintedVine(layer: Container, hole: Point, target: ActorView, grow: number, height: number, zIndex: number): { retract: (seconds: number) => void } {
  const tex = frames(VINE_SHEET);
  // the painted vine bends to the right: mirror it when the foe is on the left of the hole
  const v = fxSprite(VINE_SHEET, { size: height, flip: target.root.x < hole.x });
  v.position.set(hole.x, hole.y + 4);
  v.zIndex = zIndex;
  layer.addChild(v);
  const sx = v.scale.x;
  const sy = v.scale.y;
  v.scale.set(sx * 0.6, sy * 0.2);
  const tl = gsap.timeline();
  tl.to(v.scale, { x: sx, y: sy, duration: grow, ease: 'back.out(1.6)' }, 0);
  tex.forEach((t, i) => tl.call(() => void (!v.destroyed && (v.texture = t)), undefined, (grow * i) / (tex.length - 1)));
  return {
    retract: (seconds) => {
      if (v.destroyed) return;
      gsap
        .timeline({ onComplete: () => void (!v.destroyed && v.destroy()) })
        .call(() => void (!v.destroyed && (v.texture = tex[1]!)))
        .to(v.scale, { y: 0, x: sx * 0.5, duration: seconds, ease: 'power2.in' })
        .to(v, { alpha: 0, duration: seconds * 0.4 }, seconds * 0.6);
    },
  };
}

/** The painted coil: loose rings wrap the body, then tighten a frame on every squeeze. */
function paintedCoil(target: ActorView): { squeeze: () => void; burst: () => void } {
  const tex = frames(COIL_SHEET);
  const h = target.height;
  const c = fxSprite(COIL_SHEET, { size: h * (target.unit.isBoss ? 0.9 : 1.25), anchor: 'center' });
  c.position.set(0, -h * 0.42);
  target.body.addChild(c);
  const sx = c.scale.x;
  const sy = c.scale.y;
  c.scale.set(sx * 0.3, sy * 0.3);
  c.alpha = 0;
  gsap.timeline().to(c, { alpha: 1, duration: 0.12 }).to(c.scale, { x: sx, y: sy, duration: 0.3, ease: 'back.out(2)' }, 0);
  let frame = 0;
  return {
    squeeze: () => {
      if (c.destroyed) return;
      frame = Math.min(tex.length - 1, frame + 1);
      c.texture = tex[frame]!;
      gsap.fromTo(c.scale, { x: sx * 0.86, y: sy * 0.92 }, { x: sx, y: sy, duration: 0.18, ease: 'back.out(3)' });
    },
    burst: () => {
      if (c.destroyed) return;
      gsap
        .timeline({ onComplete: () => void (!c.destroyed && c.destroy()) })
        .to(c.scale, { x: sx * 1.4, y: sy * 1.4, duration: 0.3, ease: 'power2.out' })
        .to(c, { alpha: 0, duration: 0.3 }, 0.05);
    },
  };
}

/** A dark hole torn in the ground, with a rim of dirt (lasts until the vines sink back). */
function groundHole(layer: Container, at: Point, size: number, hold: number): void {
  const g = new Graphics()
    .ellipse(0, 0, size, size * 0.38)
    .fill({ color: 0x6b4a2a, alpha: 0.9 })
    .ellipse(0, size * 0.04, size * 0.72, size * 0.26)
    .fill({ color: 0x1e120a, alpha: 0.95 });
  g.position.set(at.x, at.y);
  g.zIndex = -850;
  g.scale.set(0.2);
  layer.addChild(g);
  gsap
    .timeline({ onComplete: () => void (!g.destroyed && g.destroy()) })
    .to(g.scale, { x: 1, y: 1, duration: 0.12, ease: 'back.out(3)' })
    .to(g, { alpha: 0, duration: 0.4 }, hold);
}

/** A mound of dirt ploughing along under the surface, from `from` to `to` (something is coming…). */
function burrow(layer: Container, from: Point, to: Point, seconds: number): void {
  const g = new Graphics().ellipse(0, 0, 13, 6).fill(0x8a6a44).ellipse(-3, -2, 6, 2.5).fill({ color: 0xc8a67a, alpha: 0.8 });
  g.position.set(from.x, from.y);
  g.zIndex = -840;
  layer.addChild(g);
  gsap
    .timeline({ onComplete: () => void (!g.destroyed && g.destroy()) })
    .to(g, { x: to.x, y: to.y, duration: seconds, ease: 'power1.in' })
    .to(g.scale, { x: 1.2, y: 1.6, duration: seconds * 0.3, yoyo: true, repeat: 3 }, 0)
    .to(g, { alpha: 0, duration: 0.1 });
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
 * Root Awakening (~2.8 s), told like a cartoon beat by beat:
 * 1 Taro raises the staff, the ground rumbles · 2 stamps — cracks and dirt mounds race underground to every foe,
 * then the ground tears open and vines burst up out of the holes around them · 3 they coil up the bodies and hoist them · 4 three
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

  // 2 — stamp: cracks and dirt mounds race underground to every foe…
  const stamp = 0.3;
  const arrive = 0.78;
  const vines: { retract: (s: number) => void }[] = [];
  at(stamp, [druid], () => {
    druid.pose('sig', 1, 0.35);
    hop(druid, 16, 0.18);
    api.shake(6);
    api.sound('hit');
    playFx(api.ground, 'vfx/knight-leap-dust', druid.root.x, druid.root.y + 6, { size: 70, frameTime: 0.1, tint: 0xd8c09a });
    const from = { x: druid.root.x, y: druid.root.y };
    for (const t of bound) {
      const to = { x: t.root.x, y: t.root.y + 6 };
      groundCrack(api, from, to, arrive - stamp, 5);
      burrow(api.ground, from, to, arrive - stamp);
    }
  });

  // …then the ground tears open around each foe and the vines burst up out of the holes and arc over onto it
  for (const t of bound) {
    at(arrive, [t], () => {
      const big = t.unit.isBoss;
      const count = big ? 4 : 2;
      const ring = t.height * (big ? 0.42 : 0.55);
      api.shake(big ? 6 : 3);
      for (let k = 0; k < count; k++) {
        // holes spread around the feet, alternating left / right, some in front and some behind
        const angle = Math.PI * (0.15 + (0.7 * k) / Math.max(1, count - 1)) + (k % 2 ? Math.PI : 0);
        const side = Math.cos(angle) >= 0 ? 1 : -1;
        const hole = { x: t.root.x + Math.cos(angle) * ring, y: t.root.y + Math.sin(angle) * ring * 0.35 + 4 };
        groundHole(api.ground, hole, big ? 22 : 14, 1.9);
        // painted ground-burst sheet once it exists (art-prompts §13.1), the knight's dust until then
        if (hasSheet('vfx/druid-ground-burst')) playFx(api.field, 'vfx/druid-ground-burst', hole.x, hole.y + 6, { size: big ? 60 : 40, frameTime: 0.07, zIndex: hole.y - 1 });
        else playFx(api.ground, 'vfx/knight-leap-dust', hole.x, hole.y + 4, { size: big ? 70 : 46, frameTime: 0.07, tint: 0xb89a70 });
        sparks(api.fx, hole.x, hole.y - 8, 0xc8a67a, 5, 80);
        // vines in front of the foe draw over it, the ones behind stay behind it
        const z = hole.y + (hole.y > t.root.y ? 2 : -2);
        vines.push(
          hasSheet(VINE_SHEET)
            ? paintedVine(api.field, hole, t, 0.32 + k * 0.03, t.height * (big ? 1.1 : 1.5), z)
            : growingVine(api.field, emergePath(hole, t, -side), 0.32 + k * 0.03, big ? 16 : 10, z),
        );
      }
    });
  }

  // 3 — coil and hoist
  const coils = new Map<string, { squeeze: () => void; burst: () => void }>();
  for (const t of bound) {
    at(arrive + 0.28, [t], () => {
      coils.set(t.unit.id, hasSheet(COIL_SHEET) ? paintedCoil(t) : coilAround(t, 0.35));
      rootSpike(api, t.root.x, t.root.y + 4, t.unit.isBoss ? 80 : 40);
      if (!t.unit.isBoss) gsap.to(t.body, { y: -22, duration: 0.35, ease: 'power2.out' });
    });
  }
  at(arrive + 0.3, [druid], () => druid.pose('sig', 2, 0.9));

  // 4 — three squeezes (the hit numbers pop on each one)
  const squeezes = [1.55, 1.77, 1.99];
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
  const erupt = 2.3;
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
