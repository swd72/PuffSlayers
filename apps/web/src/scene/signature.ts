// Signature set-pieces: one big, class-specific moment per ultimate (drawn live, no sheets needed), built from
// what each class does in the sim — the knight's blade circle, the archer's marks and spiral arrow, the mage's
// vortex, the guard's pillow fort, the cleric's pillars of light, the bard's spirit bear — plus a short cast
// flourish per class for the cut-in.
import gsap from 'gsap';
import { Container, Graphics, Text } from 'pixi.js';
import type { HeroClass, Point } from '@puff/sim';
import type { ActorView } from './actor';
import { frames, hasSheet } from '../assets';
import { glowFlare, lightPillar, sparks } from './anime';
import type { SceneApi } from './api';
import { alive, at } from './choreo';
import { fxSprite } from './fx';

const done = (g: Container) => () => {
  if (!g.destroyed) g.destroy({ children: true });
};

/**
 * The painted version of a set-piece (art-prompts §14.9) if its sheet exists, else the drawn one. Either way it
 * comes wrapped in a container, so the choreography can scale and fade it without touching the sprite's own scale.
 */
function paintedOr(sheet: string, size: number, drawn: () => Container, opts: { anchor?: 'center'; byWidth?: boolean } = {}): Container {
  const holder = new Container();
  holder.addChild(hasSheet(sheet) ? fxSprite(sheet, { size, ...opts }) : drawn());
  return holder;
}

// ---------- Carrot Knight: a circle of spirit blades ----------

function blade(color: number, length: number): Graphics {
  const w = length * 0.17;
  return new Graphics()
    .poly([0, -length, w, -length * 0.25, w * 0.55, 0, -w * 0.55, 0, -w, -length * 0.25])
    .fill({ color, alpha: 0.95 })
    .stroke({ color: 0xfff4d8, width: 2.5 })
    .poly([0, -length * 0.92, w * 0.35, -length * 0.3, 0, -length * 0.08, -w * 0.35, -length * 0.3])
    .fill({ color: 0xffffff, alpha: 0.95 })
    .rect(-w * 1.3, 0, w * 2.6, length * 0.06)
    .fill({ color: 0x3f8a2a })
    .rect(-w * 0.35, length * 0.06, w * 0.7, length * 0.16)
    .fill({ color: 0xffb347 });
}

/**
 * Spirit carrot-blades appear high in the sky in a ring over `center` — above the tallest foe — hang there point
 * down, then all fall at once and stab into the ground at `plungeAt` (seconds from now). `dropHeight` is how
 * far above the ground they hang.
 */
export function bladeRing(api: SceneApi, center: Point, color: number, plungeAt: number, dropHeight = 220, count = 6, radius = 105): void {
  const BLADE = 96;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.3;
    const x = center.x + Math.cos(a) * radius;
    const y = center.y + Math.sin(a) * radius * 0.5;
    // painted blade (hilt at the bottom, tip up) once it exists; the drawn one is flipped the same way
    const b = paintedOr('vfx/knight-spirit-blade', 110, () => {
      const c = new Container();
      // a soft additive glow behind each blade so it reads over the dimmed field
      const glow = new Graphics().ellipse(0, -46, 22, 56).fill({ color, alpha: 0.3 });
      glow.blendMode = 'add';
      c.addChild(glow, blade(color, BLADE));
      return c;
    });
    b.rotation = Math.PI; // hilt up, tip down — a sword about to fall
    // the hilt hangs above the foes (but stays on screen); the tip ends up stuck a little into the ground
    const hang = Math.max(api.screen.y + 16, y - dropHeight - BLADE);
    const landed = y - BLADE * 0.82;
    b.position.set(x, hang);
    b.zIndex = 30_000; // over every unit while it is up in the air
    b.scale.set(0.3);
    b.alpha = 0;
    api.fx.addChild(b);
    const appear = i * 0.05;
    const fall = 0.16;
    gsap
      .timeline({ onComplete: done(b) })
      // blinks into the sky…
      .to(b, { alpha: 1, duration: 0.12 }, appear)
      .to(b.scale, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2)' }, appear)
      // …bobs while the knight is slashing…
      .to(b, { y: hang - 10, duration: Math.max(0.1, plungeAt - fall - appear - 0.22), ease: 'sine.inOut' }, appear + 0.22)
      // …and every blade drops at once
      .to(b, { y: landed, duration: fall, ease: 'power4.in' }, plungeAt - fall)
      .call(() => void (b.zIndex = y + 1), undefined, plungeAt)
      .to(b, { alpha: 0, duration: 0.35 }, plungeAt + 0.3);
    at(plungeAt, [], () => sparks(api.fx, x, y, 0xffc680, 6, 100));
  }
}

// ---------- Leaf Archer: target marks and the spiral arrow ----------

/** A spinning green reticle under a foe (it's marked for the rain). */
export function targetMark(api: SceneApi, target: ActorView, color: number, hold: number): void {
  const r = target.height * 0.55;
  const g = paintedOr(
    'vfx/archer-target-mark',
    r * 2.5,
    () => {
      const d = new Graphics();
      d.circle(0, 0, r).stroke({ color, width: 4, alpha: 1 });
      d.circle(0, 0, r * 0.62).stroke({ color: 0xffffff, width: 1.5, alpha: 0.7 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        d.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8).lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2).stroke({ color, width: 3 });
      }
      return d;
    },
    { anchor: 'center', byWidth: true },
  );
  g.scale.set(1.6, 0.6);
  g.alpha = 0;
  g.blendMode = 'add';
  g.position.set(target.root.x, target.root.y);
  g.zIndex = -700; // under every unit, but above the combo dim
  api.field.addChild(g);
  gsap
    .timeline({ onComplete: done(g) })
    .to(g, { alpha: 1, duration: 0.1 })
    .to(g.scale, { x: 1, y: 0.42, duration: 0.25, ease: 'back.out(2)' }, 0)
    // Spin the round artwork inside the projected holder so the mark stays flat on the ground.
    .to(g.children[0]!, { rotation: Math.PI, duration: hold, ease: 'none' }, 0)
    .to(g, { alpha: 0, duration: 0.2 }, hold - 0.1);
}

/** One huge arrow wrapped in a wind spiral dives out of the sky onto a point; `landAt` seconds from now. */
export function spiralArrow(api: SceneApi, to: Point, color: number, landAt: number): void {
  // tip at the origin, shaft up behind it: it points down as it dives
  const c = paintedOr('vfx/archer-spiral-arrow', 200, () => {
    const d = new Container();
    const shaft = new Graphics()
      .poly([0, 0, 10, -40, 4, -40, 4, -150, -4, -150, -4, -40, -10, -40])
      .fill({ color: 0xffffff, alpha: 0.95 })
      .poly([0, -150, 14, -175, 0, -165, -14, -175])
      .fill({ color });
    const spiral = new Graphics();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const y = -t * 170;
      const x = Math.sin(t * Math.PI * 6) * (8 + t * 16);
      if (i === 0) spiral.moveTo(x, y);
      else spiral.lineTo(x, y);
    }
    spiral.stroke({ color, width: 4, alpha: 0.8 });
    d.addChild(spiral, shaft);
    return d;
  });
  if (!hasSheet('vfx/archer-spiral-arrow')) c.blendMode = 'add';
  c.position.set(to.x, to.y - 520);
  c.zIndex = 30_000;
  c.alpha = 0;
  api.fx.addChild(c);
  gsap
    .timeline({ onComplete: done(c) })
    .to(c, { alpha: 1, duration: 0.1 }, Math.max(0, landAt - 0.35))
    .to(c, { y: to.y - 10, duration: 0.25, ease: 'power4.in' }, Math.max(0, landAt - 0.25))
    .to(c, { alpha: 0, duration: 0.2 }, landAt + 0.05);
  at(landAt, [], () => {
    lightPillar(api.fx, to.x, to.y, color, 70, 380, 0.5);
    glowFlare(api.fx, to.x, to.y - 20, color, 220, 0.5, 0.6);
    sparks(api.fx, to.x, to.y - 10, 0xd9ffc2, 22, 200);
  });
}

// ---------- Bubble Mage: the vortex ----------

/** A galaxy-like whirlpool spinning on the ground; foes around it get dragged toward its eye. */
export function vortex(api: SceneApi, center: Point, targets: readonly ActorView[], color: number, seconds: number): void {
  const drawn = new Graphics();
  const g = drawn;
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const a = arm * (Math.PI / 2) + t * Math.PI * 2.2;
      const r = 12 + t * 110;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.stroke({ color, width: 9, alpha: 0.8 });
  }
  g.circle(0, 0, 118).stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
  g.circle(0, 0, 22).fill({ color: 0x1a1450, alpha: 0.8 });
  const holder = new Container();
  // painted whirlpool (seen straight from above; squashed here to lie on the ground) once it exists
  const spin: Container = hasSheet('vfx/mage-vortex') ? fxSprite('vfx/mage-vortex', { size: 250, anchor: 'center', byWidth: true }) : drawn;
  holder.addChild(spin);
  holder.scale.set(0.2, 0.08);
  holder.position.set(center.x, center.y);
  holder.zIndex = -750; // under every unit, but above the combo dim
  g.blendMode = 'add';
  api.field.addChild(holder);
  gsap
    .timeline({ onComplete: done(holder) })
    .to(holder.scale, { x: 1, y: 0.42, duration: 0.3, ease: 'back.out(1.6)' })
    .to(spin, { rotation: Math.PI * 4, duration: seconds, ease: 'power1.in' }, 0)
    .to(holder, { alpha: 0, duration: 0.3 }, seconds - 0.2);
  // the pull: bodies slide toward the eye and spring back when the vortex closes
  for (const t of targets) {
    const dx = (center.x - t.root.x) * 0.35;
    const pull = { x: 0 };
    const apply = () => {
      if (!t.removed && !t.body.destroyed) t.body.x = pull.x;
    };
    gsap
      .timeline({ onUpdate: apply, onComplete: apply })
      .to(pull, { x: dx, duration: seconds * 0.6, ease: 'power2.in' })
      .to(pull, { x: 0, duration: 0.25, ease: 'back.out(2)' }, seconds * 0.9);
  }
}

/** Little stars bursting out where a bubble prison pops. */
export function starBurst(api: SceneApi, at2: Point, color: number): void {
  for (let i = 0; i < 8; i++) {
    const s = new Graphics().star(0, 0, 5, 6, 2.5).fill({ color: i % 2 ? 0xffffff : color });
    s.blendMode = 'add';
    s.position.set(at2.x, at2.y);
    s.zIndex = 30_000;
    api.fx.addChild(s);
    const a = (i / 8) * Math.PI * 2;
    gsap
      .timeline({ onComplete: done(s) })
      .to(s, { x: at2.x + Math.cos(a) * 50, y: at2.y + Math.sin(a) * 40, rotation: 3, duration: 0.45, ease: 'power2.out' })
      .to(s, { alpha: 0, duration: 0.2 }, 0.3);
  }
}

// ---------- Pillow Guard: the pillow fort ----------

/** A soft shield dome of pillow-hexes over every ally for a moment. */
export function pillowFort(api: SceneApi, allies: readonly ActorView[], color: number, hold: number): void {
  for (const a of allies) {
    const r = a.height * 0.75;
    const g = paintedOr('vfx/guard-pillow-dome', r * 2.1, () => {
      const d = new Graphics().ellipse(0, -r * 0.55, r, r * 0.95).fill({ color, alpha: 0.3 }).stroke({ color: 0xffffff, width: 3, alpha: 0.9 });
      // honeycomb-ish seams
      for (let i = -2; i <= 2; i++) d.moveTo(i * r * 0.35, -r * 1.35).lineTo(i * r * 0.45, r * 0.25).stroke({ color, width: 1.5, alpha: 0.35 });
      return d;
    }, { byWidth: true });
    g.y = r * 0.35;
    g.blendMode = 'add';
    g.scale.set(0.2);
    a.root.addChild(g);
    gsap
      .timeline({ onComplete: done(g) })
      .to(g.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2.5)' })
      .to(g, { alpha: 0, duration: 0.35 }, hold);
  }
}

/** Red "!" popping over foes that now have to hit the guard (taunt). */
export function tauntMarks(api: SceneApi, foes: readonly ActorView[]): void {
  for (const f of foes) {
    if (!alive(f)) continue;
    const t = new Text({ text: '!', style: { fontFamily: 'Lilita One, sans-serif', fontSize: 30, fill: 0xff4d5e, stroke: { color: 0x2a1633, width: 5 } } });
    t.anchor.set(0.5, 1);
    t.position.set(f.root.x, f.root.y - f.height * 1.05);
    t.zIndex = 30_000;
    t.scale.set(0);
    api.fx.addChild(t);
    gsap
      .timeline({ onComplete: done(t) })
      .to(t.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' })
      .to(t, { y: t.y - 10, duration: 0.6, ease: 'sine.out' }, 0)
      .to(t, { alpha: 0, duration: 0.25 }, 0.8);
  }
}

// ---------- Mochi Cleric: halos and a petal storm ----------

/** A golden halo that settles over an ally's head. */
export function halo(api: SceneApi, ally: ActorView, color: number): void {
  const g = paintedOr(
    'vfx/cleric-halo',
    ally.height * 0.8,
    () => new Graphics().ellipse(0, 0, ally.height * 0.3, ally.height * 0.09).stroke({ color: 0xfff4c0, width: 3 }).ellipse(0, 0, ally.height * 0.34, ally.height * 0.11).stroke({ color, width: 2, alpha: 0.6 }),
    { anchor: 'center', byWidth: true },
  );
  g.blendMode = 'add';
  g.position.set(0, -ally.height * 1.2);
  g.alpha = 0;
  ally.root.addChild(g);
  gsap
    .timeline({ onComplete: done(g) })
    .to(g, { alpha: 1, y: -ally.height * 1.05, duration: 0.3, ease: 'power2.out' })
    .to(g, { alpha: 0, duration: 0.4 }, 1.2);
}

/** Sakura petals sweeping across the whole screen in a gust. */
export function petalStorm(api: SceneApi, seconds: number, count = 36): void {
  const sc = api.screen;
  for (let i = 0; i < count; i++) {
    const p = new Graphics().ellipse(0, 0, 5, 3).fill({ color: i % 3 ? 0xffc2da : 0xffffff, alpha: 0.95 });
    p.position.set(sc.x - 20 - Math.random() * 120, sc.y + Math.random() * sc.height * 0.8);
    p.zIndex = 30_000;
    api.fx.addChild(p);
    gsap
      .timeline({ delay: Math.random() * seconds * 0.4, onComplete: done(p) })
      .to(p, { x: sc.x + sc.width + 40, y: p.y + 80 + Math.random() * 120, rotation: 6 + Math.random() * 6, duration: seconds * (0.6 + Math.random() * 0.4), ease: 'sine.inOut' });
  }
}

// ---------- Bell Bard: the spirit bear and music notes ----------

/** A giant translucent bear rises behind the team and hugs everyone on the last ring. Returns when it hugs. */
export function spiritBear(api: SceneApi, center: Point, color: number, hugAt: number): void {
  const bear = new Container();
  const body = new Graphics()
    .circle(0, -150, 70)
    .fill({ color, alpha: 0.45 })
    .circle(-52, -208, 24)
    .fill({ color, alpha: 0.45 })
    .circle(52, -208, 24)
    .fill({ color, alpha: 0.45 })
    .ellipse(0, -60, 110, 80)
    .fill({ color, alpha: 0.38 })
    .circle(-24, -160, 6)
    .fill({ color: 0xffffff, alpha: 0.9 })
    .circle(24, -160, 6)
    .fill({ color: 0xffffff, alpha: 0.9 })
    .ellipse(0, -138, 16, 10)
    .fill({ color: 0xffffff, alpha: 0.5 });
  const armL = new Graphics().ellipse(0, 0, 80, 24).fill({ color, alpha: 0.45 });
  const armR = new Graphics().ellipse(0, 0, 80, 24).fill({ color, alpha: 0.45 });
  armL.position.set(-120, -70);
  armR.position.set(120, -70);
  armL.rotation = -0.9;
  armR.rotation = 0.9;
  // painted bear (frame 0 arms open, frame 1 hugging) once it exists
  const painted = hasSheet('vfx/bard-spirit-bear') ? fxSprite('vfx/bard-spirit-bear', { size: 300 }) : null;
  if (painted) bear.addChild(painted);
  else bear.addChild(body, armL, armR);
  bear.blendMode = 'add';
  bear.position.set(center.x, center.y + 40);
  bear.zIndex = center.y - 200; // behind the team
  bear.alpha = 0;
  bear.scale.set(0.6);
  api.field.addChild(bear);
  gsap
    .timeline({ onComplete: done(bear) })
    .to(bear, { alpha: 1, duration: 0.35 })
    .to(bear.scale, { x: 1, y: 1, duration: 0.5, ease: 'back.out(1.5)' }, 0)
    // the hug: arms swing in around the team
    .to(armL, { x: -40, y: -40, rotation: 0.35, duration: 0.18, ease: 'power3.in' }, hugAt - 0.18)
    .to(armR, { x: 40, y: -40, rotation: -0.35, duration: 0.18, ease: 'power3.in' }, hugAt - 0.18)
    .to(bear.scale, { x: 1.08, y: 0.94, duration: 0.12, yoyo: true, repeat: 1 }, hugAt)
    .to(bear, { alpha: 0, duration: 0.45 }, hugAt + 0.4);
  at(hugAt - 0.1, [], () => {
    if (painted && !painted.destroyed) painted.texture = frames('vfx/bard-spirit-bear')[1] ?? painted.texture;
  });
  at(hugAt, [], () => hearts(api, { x: center.x, y: center.y - 60 }, color));
}

function hearts(api: SceneApi, at2: Point, color: number): void {
  for (let i = 0; i < 10; i++) {
    const h = new Text({ text: '♥', style: { fontSize: 22, fill: i % 2 ? color : 0xffffff } });
    h.anchor.set(0.5);
    h.position.set(at2.x, at2.y);
    h.zIndex = 30_000;
    api.fx.addChild(h);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    gsap
      .timeline({ onComplete: done(h) })
      .to(h, { x: at2.x + Math.cos(a) * 110, y: at2.y + Math.sin(a) * 90, duration: 0.7, ease: 'power2.out' })
      .to(h, { alpha: 0, duration: 0.3 }, 0.45);
  }
}

/** Music notes spiralling up off an ally. */
export function musicNotes(api: SceneApi, ally: ActorView, color: number): void {
  for (let i = 0; i < 3; i++) {
    const n = new Text({ text: i % 2 ? '♫' : '♪', style: { fontSize: 20, fill: i === 1 ? 0xffffff : color, stroke: { color: 0x2a1633, width: 3 } } });
    n.anchor.set(0.5);
    const x0 = ally.root.x;
    const y0 = ally.root.y - ally.height * 0.6;
    n.position.set(x0, y0);
    n.zIndex = 30_000;
    api.fx.addChild(n);
    const swirl = { t: 0 };
    gsap.to(swirl, {
      t: 1,
      delay: i * 0.12,
      duration: 0.9,
      ease: 'sine.out',
      onUpdate: () => {
        if (n.destroyed) return;
        n.position.set(x0 + Math.sin(swirl.t * Math.PI * 3 + i) * 18, y0 - swirl.t * 70);
        n.alpha = 1 - Math.max(0, swirl.t - 0.6) / 0.4;
      },
      onComplete: done(n),
    });
  }
}

// ---------- cast flourishes (during the cut-in) ----------

/** A short class-specific flourish around the caster while the camera pushes in. */
export function castFlourish(api: SceneApi, caster: ActorView, heroClass: HeroClass, color: number, seconds: number): void {
  const x = caster.root.x;
  const y = caster.root.y;
  const h = caster.height;
  switch (heroClass) {
    case 'carrot-knight': {
      // a glint running up the blade
      const g = new Graphics().poly([0, -3, 90, 0, 0, 3]).fill({ color: 0xffffff }).poly([0, -1.5, 70, 0, 0, 1.5]).fill({ color });
      g.blendMode = 'add';
      g.position.set(x - 40, y - h * 0.5);
      g.rotation = -0.5;
      g.zIndex = 30_000;
      g.scale.set(0, 1);
      api.fx.addChild(g);
      gsap.timeline({ delay: seconds * 0.15, onComplete: done(g) }).to(g.scale, { x: 1, duration: 0.15, ease: 'power3.out' }).to(g, { alpha: 0, duration: 0.25 }, 0.2);
      return;
    }
    case 'leaf-archer':
    case 'root-druid': {
      // leaves spiralling up around the body
      for (let i = 0; i < 10; i++) {
        const l = new Graphics().moveTo(0, 0).quadraticCurveTo(5, -4, 10, 0).quadraticCurveTo(5, 4, 0, 0).fill(color);
        l.zIndex = 30_000;
        api.fx.addChild(l);
        const spin = { t: 0 };
        const phase = (i / 10) * Math.PI * 2;
        gsap.to(spin, {
          t: 1,
          delay: i * 0.03,
          duration: seconds * 0.8,
          ease: 'sine.in',
          onUpdate: () => {
            if (l.destroyed) return;
            const a = phase + spin.t * Math.PI * 4;
            l.position.set(x + Math.cos(a) * h * 0.55 * (1 - spin.t * 0.4), y - spin.t * h * 1.4 + Math.sin(a) * 8);
            l.rotation = a;
            l.alpha = 1 - spin.t * 0.6;
          },
          onComplete: done(l),
        });
      }
      return;
    }
    case 'bubble-mage': {
      for (let i = 0; i < 8; i++) {
        const b = new Graphics().circle(0, 0, 4 + Math.random() * 6).stroke({ color: 0xffffff, width: 1.5, alpha: 0.9 }).fill({ color, alpha: 0.25 });
        b.position.set(x + (Math.random() - 0.5) * h, y - Math.random() * 10);
        b.zIndex = 30_000;
        api.fx.addChild(b);
        gsap.timeline({ delay: Math.random() * 0.3, onComplete: done(b) }).to(b, { y: b.y - h * 1.3, duration: seconds * 0.8, ease: 'sine.out' }).to(b.scale, { x: 1.6, y: 1.6, duration: 0.1 }, seconds * 0.7).to(b, { alpha: 0, duration: 0.1 }, seconds * 0.72);
      }
      return;
    }
    case 'pillow-guard': {
      const g = new Graphics();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const b = ((i + 1) / 6) * Math.PI * 2;
        g.moveTo(Math.cos(a) * h * 0.7, Math.sin(a) * h * 0.7).lineTo(Math.cos(b) * h * 0.7, Math.sin(b) * h * 0.7);
      }
      g.stroke({ color, width: 4 });
      g.blendMode = 'add';
      g.position.set(x, y - h * 0.45);
      g.zIndex = 30_000;
      g.scale.set(0.3);
      api.fx.addChild(g);
      gsap.timeline({ onComplete: done(g) }).to(g.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' }).to(g, { rotation: 0.5, alpha: 0, duration: 0.35 }, seconds * 0.5);
      return;
    }
    case 'mochi-cleric':
      halo(api, caster, color);
      return;
    case 'bell-bard': {
      for (let i = 0; i < 3; i++) {
        const r = new Graphics().ellipse(0, 0, h * 0.5, h * 0.2).stroke({ color, width: 3 });
        r.blendMode = 'add';
        r.position.set(x, y);
        r.zIndex = -700;
        api.field.addChild(r);
        gsap.timeline({ delay: i * seconds * 0.25, onComplete: done(r) }).to(r.scale, { x: 2.2, y: 2.2, duration: seconds * 0.4, ease: 'power2.out' }).to(r, { alpha: 0, duration: seconds * 0.4 }, 0);
      }
      musicNotes(api, caster, color);
      return;
    }
  }
}
