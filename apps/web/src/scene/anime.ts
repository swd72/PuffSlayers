// Anime-style effect primitives: magic circles, light pillars, slashes, sparks, speed lines, flashes.
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { ShockwaveFilter, ZoomBlurFilter } from 'pixi-filters';
import gsap from 'gsap';

type Layer = Container;

const done = (g: Container) => () => {
  if (!g.destroyed) g.destroy({ children: true });
};

/** Soft gradient textures drawn once on a canvas, then tinted per effect. */
function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for effect textures');
  paint(ctx);
  return Texture.from(canvas);
}

let glowTexture: Texture | undefined;
let beamTexture: Texture | undefined;

function glow(): Texture {
  glowTexture ??= canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  return glowTexture;
}

function beam(): Texture {
  beamTexture ??= canvasTexture(64, 256, (ctx) => {
    const across = ctx.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)');
    across.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    across.addColorStop(0.5, 'rgba(255,255,255,1)');
    across.addColorStop(0.65, 'rgba(255,255,255,0.55)');
    across.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = across;
    ctx.fillRect(0, 0, 64, 256);
    // fade out toward the sky
    ctx.globalCompositeOperation = 'destination-in';
    const up = ctx.createLinearGradient(0, 0, 0, 256);
    up.addColorStop(0, 'rgba(0,0,0,0)');
    up.addColorStop(0.5, 'rgba(0,0,0,0.8)');
    up.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = up;
    ctx.fillRect(0, 0, 64, 256);
  });
  return beamTexture;
}

/** Soft additive light bloom at a point (impact flares, pillar bases). */
export function glowFlare(layer: Layer, x: number, y: number, color: number, size = 160, duration = 0.5, squash = 1): void {
  const s = new Sprite(glow());
  s.anchor.set(0.5);
  s.position.set(x, y);
  s.tint = color;
  s.blendMode = 'add';
  s.zIndex = 19_000;
  const target = size / 128;
  s.scale.set(target * 0.3, target * 0.3 * squash);
  layer.addChild(s);
  gsap
    .timeline({ onComplete: done(s) })
    .to(s.scale, { x: target, y: target * squash, duration: duration * 0.3, ease: 'power3.out' })
    .to(s, { alpha: 0, duration: duration * 0.7, ease: 'power2.in' }, duration * 0.3);
}

/** Rotating rune circle lying flat on the ground (perspective squash). */
export function magicCircle(layer: Layer, x: number, y: number, radius: number, color: number, duration = 1.2): void {
  const flat = new Container();
  flat.position.set(x, y);
  flat.scale.set(0.2, 0.09);
  flat.zIndex = -1000;
  const spin = new Container();
  const g = new Graphics();
  g.circle(0, 0, radius).stroke({ color, width: 5, alpha: 0.95 });
  g.circle(0, 0, radius * 0.86).stroke({ color, width: 2, alpha: 0.8 });
  g.circle(0, 0, radius * 0.5).stroke({ color, width: 3, alpha: 0.9 });
  // hexagram
  for (let k = 0; k < 2; k++) {
    const pts: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + k * (Math.PI / 3) - Math.PI / 2;
      pts.push(Math.cos(a) * radius * 0.84, Math.sin(a) * radius * 0.84);
    }
    g.poly(pts).stroke({ color, width: 2.5, alpha: 0.85 });
  }
  // rune dots between the outer rings
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.circle(Math.cos(a) * radius * 0.93, Math.sin(a) * radius * 0.93, i % 3 === 0 ? 4 : 2).fill({ color, alpha: 0.95 });
  }
  g.circle(0, 0, radius).fill({ color, alpha: 0.12 });
  const halo = new Sprite(glow());
  halo.anchor.set(0.5);
  halo.tint = color;
  halo.width = radius * 2.6;
  halo.height = radius * 2.6;
  halo.alpha = 0.55;
  halo.blendMode = 'add';
  const core = g.clone();
  core.tint = 0xffffff;
  core.alpha = 0.55;
  core.scale.set(0.985);
  spin.addChild(g, core);
  flat.addChild(halo, spin);
  layer.addChild(flat);
  gsap
    .timeline({ onComplete: done(flat) })
    .to(flat.scale, { x: 1, y: 0.45, duration: 0.25, ease: 'back.out(2)' })
    .to(spin, { rotation: Math.PI * 1.5, duration, ease: 'none' }, 0)
    .to(flat, { alpha: 0, duration: 0.3 }, duration - 0.3);
}

/** Vertical beam of light with a glowing footprint. */
export function lightPillar(layer: Layer, x: number, y: number, color: number, width = 70, height = 420, duration = 0.8): void {
  const pillar = new Container();
  pillar.position.set(x, y);
  pillar.zIndex = y + 1;
  const outer = new Sprite(beam());
  outer.anchor.set(0.5, 1);
  outer.tint = color;
  outer.width = width * 1.6;
  outer.height = height;
  outer.blendMode = 'add';
  const core = new Sprite(beam());
  core.anchor.set(0.5, 1);
  core.width = width * 0.45;
  core.height = height * 0.95;
  core.alpha = 0.85;
  core.blendMode = 'add';
  const base = new Sprite(glow());
  base.anchor.set(0.5);
  base.tint = color;
  base.width = width * 2.2;
  base.height = width * 0.7;
  base.blendMode = 'add';
  pillar.addChild(outer, core, base);
  pillar.scale.set(0, 1);
  layer.addChild(pillar);
  gsap
    .timeline({ onComplete: done(pillar) })
    .to(pillar.scale, { x: 1.25, duration: 0.12, ease: 'power3.out' })
    .to(pillar.scale, { x: 1, duration: 0.15 })
    .to(pillar.scale, { x: 0, duration: 0.3, ease: 'power2.in' }, duration - 0.3)
    .to(pillar, { alpha: 0, duration: 0.3 }, duration - 0.3);
}

/** Crescent sword trail: thick colored arc with a white-hot core. */
export function slashArc(layer: Layer, x: number, y: number, radius: number, angle: number, color: number, duration = 0.35): void {
  const g = new Graphics();
  const sweep = Math.PI * 0.9;
  g.arc(0, 0, radius, -sweep / 2, sweep / 2).stroke({ color, width: 26, alpha: 0.55, cap: 'round' });
  g.arc(0, 0, radius, -sweep / 2, sweep / 2).stroke({ color, width: 12, alpha: 0.95, cap: 'round' });
  g.arc(0, 0, radius, -sweep / 2.4, sweep / 2.4).stroke({ color: 0xffffff, width: 4, cap: 'round' });
  g.position.set(x, y);
  g.rotation = angle;
  g.scale.set(0.4);
  g.blendMode = 'add';
  g.zIndex = 20_000;
  layer.addChild(g);
  gsap
    .timeline({ onComplete: done(g) })
    .to(g.scale, { x: 1.1, y: 1.1, duration: duration * 0.4, ease: 'power3.out' })
    .to(g, { rotation: angle + 0.9, duration, ease: 'power2.out' }, 0)
    .to(g, { alpha: 0, duration: duration * 0.5 }, duration * 0.5);
}

function starPoly(r: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return pts;
}

/** Radial burst of glowing star sparks. */
export function sparks(layer: Layer, x: number, y: number, color: number, count = 18, power = 120): void {
  for (let i = 0; i < count; i++) {
    const s = new Graphics().poly(starPoly(4 + Math.random() * 6)).fill({ color: i % 3 === 0 ? 0xffffff : color });
    s.position.set(x, y);
    s.blendMode = 'add';
    s.zIndex = 20_000;
    layer.addChild(s);
    const a = Math.random() * Math.PI * 2;
    const d = power * (0.4 + Math.random() * 0.8);
    gsap
      .timeline({ onComplete: done(s) })
      .to(s, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, rotation: 3, duration: 0.55, ease: 'power3.out' })
      .to(s.scale, { x: 0, y: 0, duration: 0.3 }, 0.3);
  }
}

/** Motes drifting upward (healing / buffs). */
export function risingMotes(layer: Layer, x: number, y: number, color: number, count = 10): void {
  for (let i = 0; i < count; i++) {
    const m = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill({ color, alpha: 0.95 });
    m.position.set(x + (Math.random() - 0.5) * 50, y - Math.random() * 20);
    m.blendMode = 'add';
    m.zIndex = 20_000;
    layer.addChild(m);
    gsap
      .timeline({ delay: Math.random() * 0.3, onComplete: done(m) })
      .to(m, { y: m.y - 70 - Math.random() * 60, x: m.x + (Math.random() - 0.5) * 30, duration: 0.9, ease: 'power1.out' })
      .to(m, { alpha: 0, duration: 0.35 }, 0.55);
  }
}

/** Manga-style speed lines converging on a point (screen space). */
export function speedLines(overlay: Layer, cx: number, cy: number, color = 0xffffff, duration = 0.45): void {
  const g = new Graphics();
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2 + Math.random() * 0.1;
    const inner = 140 + Math.random() * 90;
    const outer = 900;
    const w = 0.012 + Math.random() * 0.02;
    g.poly([
      Math.cos(a) * inner,
      Math.sin(a) * inner,
      Math.cos(a - w) * outer,
      Math.sin(a - w) * outer,
      Math.cos(a + w) * outer,
      Math.sin(a + w) * outer,
    ]).fill({ color, alpha: 0.55 + Math.random() * 0.35 });
  }
  g.position.set(cx, cy);
  g.blendMode = 'add';
  overlay.addChild(g);
  gsap
    .timeline({ onComplete: done(g) })
    .fromTo(g.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: duration * 0.5, ease: 'power2.out' })
    .to(g, { rotation: 0.15, duration }, 0)
    .to(g, { alpha: 0, duration: duration * 0.4 }, duration * 0.6);
}

export interface ScreenRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function screenFlash(overlay: Layer, screen: ScreenRect, color = 0xffffff, alpha = 0.75): void {
  const g = new Graphics().rect(screen.x, screen.y, screen.width, screen.height).fill(color);
  g.alpha = alpha;
  g.blendMode = 'add';
  overlay.addChild(g);
  gsap.to(g, { alpha: 0, duration: 0.22, ease: 'power2.out', onComplete: done(g) });
}

/** Fading silhouettes left behind by a dash. */
export function afterimages(layer: Layer, makeGhost: () => Container, from: { x: number; y: number }, to: { x: number; y: number }, tint: number): void {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const ghost = makeGhost();
    const t = i / steps;
    ghost.position.set(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    ghost.alpha = 0.15 + t * 0.4;
    ghost.zIndex = ghost.y;
    for (const child of ghost.children) if ('tint' in child) (child as { tint: number }).tint = tint;
    layer.addChild(ghost);
    gsap.to(ghost, { alpha: 0, duration: 0.35, delay: t * 0.05, onComplete: done(ghost) });
  }
}

/** Screen-space post effects: shockwave ripple and zoom blur, only attached while active. */
export class ScreenFilters {
  private readonly shock = new ShockwaveFilter({ center: { x: 0, y: 0 }, amplitude: 22, wavelength: 140, speed: 600, brightness: 1.2, radius: -1, time: 0 });
  private readonly zoom = new ZoomBlurFilter({ strength: 0, center: [0, 0], innerRadius: 50 });
  private shockOn = false;
  private zoomOn = false;

  constructor(private readonly target: Container) {}

  /** filterArea is in the target's local space: pass the visible screen rect in world coords. */
  setArea(screen: ScreenRect): void {
    this.target.filterArea = new Rectangle(screen.x, screen.y, screen.width, screen.height);
  }

  private toGlobal(x: number, y: number): { x: number; y: number } {
    const origin = this.target.getGlobalPosition();
    return { x: x + origin.x, y: y + origin.y };
  }

  shockwave(x: number, y: number, amplitude = 22): void {
    this.shock.center = this.toGlobal(x, y);
    this.shock.amplitude = amplitude;
    this.shock.time = 0;
    this.shockOn = true;
    this.apply();
    gsap.killTweensOf(this.shock);
    gsap.to(this.shock, {
      time: 0.8,
      duration: 0.8,
      ease: 'none',
      onComplete: () => {
        this.shockOn = false;
        this.apply();
      },
    });
  }

  zoomBurst(x: number, y: number, strength = 0.22): void {
    const c = this.toGlobal(x, y);
    this.zoom.center = [c.x, c.y];
    this.zoom.strength = strength;
    this.zoomOn = true;
    this.apply();
    gsap.killTweensOf(this.zoom);
    gsap.to(this.zoom, {
      strength: 0,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        this.zoomOn = false;
        this.apply();
      },
    });
  }

  private apply(): void {
    const list = [...(this.shockOn ? [this.shock] : []), ...(this.zoomOn ? [this.zoom] : [])];
    this.target.filters = list.length ? list : null;
  }
}
