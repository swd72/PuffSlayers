import { Container, Graphics, Sprite, Text, type Texture, type TextStyleOptions } from 'pixi.js';
import gsap from 'gsap';
import { frames, sheetMeta } from '../assets';

const NUMBER_FONT = '"Lilita One", "Kanit", sans-serif';

const numberStyle = (fill: string, size: number): TextStyleOptions => ({
  fontFamily: NUMBER_FONT,
  fontSize: size,
  fill,
  stroke: { color: '#2a1633', width: Math.max(4, size * 0.16), join: 'round' },
  dropShadow: { color: '#000000', alpha: 0.35, distance: 3, blur: 0, angle: Math.PI / 2 },
});

export type NumberKind = 'normal' | 'crit' | 'heal' | 'miss' | 'ultimate';

const NUMBER_LOOK: Record<NumberKind, { fill: string; size: number }> = {
  normal: { fill: '#ffe066', size: 18 },
  crit: { fill: '#ff4d5e', size: 26 },
  ultimate: { fill: '#ff7a1a', size: 31 },
  heal: { fill: '#7dff9b', size: 18 },
  miss: { fill: '#9fd8ff', size: 15 },
};

/** Floating, stroked damage / heal number that pops, drifts up and fades. */
export function floatNumber(layer: Container, text: string, kind: NumberKind, x: number, y: number): void {
  const look = NUMBER_LOOK[kind];
  const label = new Text({ text, style: numberStyle(look.fill, look.size) });
  label.anchor.set(0.5);
  label.position.set(x + (Math.random() - 0.5) * 16, y);
  label.zIndex = 100_000;
  layer.addChild(label);
  label.scale.set(0.2);
  gsap
    .timeline({ onComplete: () => label.destroy() })
    .to(label.scale, { x: 1.15, y: 1.15, duration: 0.14, ease: 'back.out(3)' })
    .to(label.scale, { x: 1, y: 1, duration: 0.1 })
    .to(label, { y: y - 36, duration: 0.7, ease: 'power1.out' }, 0.1)
    .to(label, { alpha: 0, duration: 0.25 }, 0.6);
}

/** Expanding ground ring (buffs, spawns). */
export function ring(layer: Container, color: number, x: number, y: number, radius: number): void {
  const g = new Graphics().ellipse(0, 0, radius, radius * 0.45).stroke({ color, width: 5, alpha: 0.9 });
  g.blendMode = 'add';
  g.position.set(x, y);
  g.zIndex = -500;
  g.scale.set(0.2);
  layer.addChild(g);
  gsap.timeline({ onComplete: () => g.destroy() }).to(g.scale, { x: 1, y: 1, duration: 0.4, ease: 'power2.out' }).to(g, { alpha: 0, duration: 0.3 }, 0.2);
}

export function shake(target: Container, strength: number): void {
  gsap.fromTo(target, { x: -strength }, { x: 0, duration: 0.35, ease: 'elastic.out(1, 0.3)', onComplete: () => target.position.set(0, 0) });
}

export interface FxOptions {
  /** on-screen size of the sheet's reference content, in world px */
  size: number;
  /** measure size against width instead of height (long horizontal effects) */
  byWidth?: boolean;
  /** 'bottom' sits on the ground point; 'center' is centered on it */
  anchor?: 'bottom' | 'center';
  /** seconds each frame stays; the last frame fades out over `fade` */
  frameTime?: number;
  fade?: number;
  flip?: boolean;
  rotation?: number;
  zIndex?: number;
  tint?: number;
  /** grows while playing (1 = no growth) */
  swell?: number;
}

/** Sprite for a sheet at the right scale/blend; frame 0 shown. */
export function fxSprite(sheet: string, opts: Pick<FxOptions, 'size' | 'byWidth' | 'anchor' | 'flip' | 'tint'>): Sprite {
  const meta = sheetMeta(sheet);
  const tex = frames(sheet);
  const sprite = new Sprite(tex[0]);
  sprite.anchor.set(0.5, opts.anchor === 'center' ? 0.5 : 1);
  const scale = opts.size / (opts.byWidth ? meta.width : meta.refHeight);
  sprite.scale.set(opts.flip ? -scale : scale, scale);
  if (meta.additive) sprite.blendMode = 'add';
  if (opts.tint !== undefined) sprite.tint = opts.tint;
  return sprite;
}

/** Plays a sheet once at a point: frame by frame, then fades out and cleans up. */
export function playFx(layer: Container, sheet: string, x: number, y: number, opts: FxOptions): Sprite {
  const { frameTime = 0.09, fade = 0.25, rotation = 0, zIndex = y + 5, swell = 1.08 } = opts;
  const tex: Texture[] = frames(sheet);
  const sprite = fxSprite(sheet, opts);
  sprite.position.set(x, y);
  sprite.rotation = rotation;
  sprite.zIndex = zIndex;
  layer.addChild(sprite);
  const sx = sprite.scale.x;
  const sy = sprite.scale.y;
  const tl = gsap.timeline({ onComplete: () => sprite.destroy() });
  tl.fromTo(sprite.scale, { x: sx * 0.7, y: sy * 0.7 }, { x: sx, y: sy, duration: Math.min(0.12, frameTime), ease: 'back.out(2)' });
  tex.forEach((t, i) => tl.call(() => void (!sprite.destroyed && (sprite.texture = t)), undefined, i * frameTime));
  const end = tex.length * frameTime;
  tl.to(sprite.scale, { x: sx * swell, y: sy * swell, duration: end, ease: 'power1.out' }, 0);
  tl.to(sprite, { alpha: 0, duration: fade }, Math.max(0, end - frameTime * 0.5));
  return sprite;
}

/** A single-frame ground decal (magic circle, scorch mark): fades in, holds, fades out. */
export function decal(layer: Container, sheet: string, x: number, y: number, opts: { width: number; hold: number; tint?: number }): Sprite {
  const sprite = fxSprite(sheet, { size: opts.width, byWidth: true, anchor: 'center', tint: opts.tint });
  sprite.position.set(x, y);
  sprite.zIndex = -1000;
  sprite.alpha = 0;
  layer.addChild(sprite);
  const s = sprite.scale.x;
  gsap
    .timeline({ onComplete: () => sprite.destroy() })
    .fromTo(sprite.scale, { x: s * 0.4, y: s * 0.4 }, { x: s, y: s, duration: 0.18, ease: 'back.out(2)' })
    .to(sprite, { alpha: 1, duration: 0.12 }, 0)
    .to(sprite, { alpha: 0, duration: 0.3 }, 0.18 + opts.hold);
  return sprite;
}

/** Loops a status sheet on a container (over a head, around a body) until the sprite or parent is destroyed. */
export function statusLoop(parent: Container, sheet: string, y: number, size: number, anchor: 'bottom' | 'center' = 'bottom'): Sprite {
  const tex = frames(sheet);
  const sprite = fxSprite(sheet, { size, anchor });
  sprite.position.set(0, y);
  parent.addChild(sprite);
  let index = 0;
  const tween = gsap.to({}, {
    duration: 0.16,
    repeat: -1,
    onRepeat: () => {
      if (sprite.destroyed) {
        tween.kill();
        return;
      }
      index = (index + 1) % tex.length;
      const next = tex[index];
      if (next) sprite.texture = next;
    },
  });
  return sprite;
}
