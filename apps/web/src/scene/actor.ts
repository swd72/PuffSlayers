// One unit on the field: pose frames, smooth following of the sim, HP bar and status overlays.
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import gsap from 'gsap';
import { ARENA, type Unit } from '@puff/sim';
import { bossSheet, enemySheet, frames, hasSheet, heroSheet, sheetMeta, signatureSheet } from '../assets';
import { playFx, statusLoop } from './fx';

export const HERO_HEIGHT = 72;
export const ENEMY_HEIGHT = 62;
export const BOSS_HEIGHT = 170;
/** giant bosses of every 10th stage tower over the field */
export const GIANT_HEIGHT = 250;
const ENRAGED_TINT = 0xffb4a8;
/** perspective: units on the far (upper) side of the field draw smaller */
const DEPTH_SCALE = { far: 0.8, near: 1.1 } as const;
const FOLLOW_RATE = 12;

export function depthScale(y: number): number {
  const t = Math.min(1, Math.max(0, (y - ARENA.minY) / (ARENA.maxY - ARENA.minY)));
  return DEPTH_SCALE.far + (DEPTH_SCALE.near - DEPTH_SCALE.far) * t;
}

/** Named poses: heroes 0 idle 1 run 2 wind-up 3 release 4 cast 5 hurt; enemies 0 idle 1 walk 2 attack 3 hurt;
 *  bosses 0 idle 1 roar 2 summon 3 slam 4 hurt 5 defeated. `sig`/`cheek` are the class signature sheets. */
export type PoseSet = 'pose' | 'sig' | 'cheek';

interface PoseFrame {
  readonly texture: Texture;
  readonly scale: number;
}

export class ActorView {
  readonly root = new Container();
  readonly body = new Container();
  readonly sprite: Sprite;
  private readonly hpBar = new Graphics();
  private readonly sets = new Map<PoseSet, PoseFrame[]>();
  /** 1 when the art faces right, -1 when it faces left */
  private readonly nativeFacing: 1 | -1;
  private readonly phase = Math.random() * 6;
  private override: { set: PoseSet; index: number } | null = null;
  private overrideTween: gsap.core.Tween | null = null;
  private bubble: Sprite | null = null;
  private sleepy: Sprite | null = null;
  private sticky: Sprite | null = null;
  /** the sim position is ignored while a scripted move (leap, roll) plays */
  scripted = false;
  gone = false;

  constructor(
    public unit: Unit,
    layer: Container,
  ) {
    const isHero = unit.side === 'hero';
    this.height = isHero ? HERO_HEIGHT : unit.isGiant ? GIANT_HEIGHT : unit.isBoss ? BOSS_HEIGHT : ENEMY_HEIGHT;
    this.nativeFacing = isHero ? 1 : -1;
    const skinSheet = unit.skin ? `skin/${unit.skin}` : undefined;
    const main =
      isHero && unit.species && unit.heroClass
        ? skinSheet && hasSheet(skinSheet)
          ? skinSheet
          : heroSheet(unit.species, unit.heroClass)
        : unit.bossKind
          ? bossSheet(unit.bossKind)
          : enemySheet(unit.enemyKind ?? 'daisy');
    this.addSet('pose', main);
    // signature poses are drawn in the default outfit, so skinned puffs reuse their own pose frames
    if (unit.heroClass && !skinSheet) this.addSet('sig', signatureSheet(unit.heroClass));
    if (unit.heroClass === 'pillow-guard' && !skinSheet && hasSheet('sig/cheek-cannon')) this.addSet('cheek', 'sig/cheek-cannon');

    const first = this.frame('pose', 0);
    this.sprite = new Sprite(first.texture);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(first.scale);
    const shadow = new Graphics().ellipse(0, 0, this.height * 0.3, this.height * 0.08).fill({ color: 0x2a1633, alpha: 0.28 });
    this.body.addChild(this.sprite);
    this.hpBar.position.set(0, -this.height - 6);
    // bosses show their HP in the big HUD bar instead
    this.hpBar.visible = !unit.isBoss;
    this.root.addChild(shadow, this.body, this.hpBar);
    this.root.position.set(unit.x, unit.y);
    this.root.zIndex = unit.y;
    this.root.scale.set(depthScale(unit.y));
    layer.addChild(this.root);
    this.drawHp();
  }

  readonly height: number;

  private addSet(set: PoseSet, sheet: string): void {
    if (!hasSheet(sheet)) return;
    const scale = this.height / sheetMeta(sheet).refHeight;
    this.sets.set(set, frames(sheet).map((texture) => ({ texture, scale })));
  }

  private frame(set: PoseSet, index: number): PoseFrame {
    const list = this.sets.get(set) ?? this.sets.get('pose') ?? [];
    const f = list[Math.min(index, list.length - 1)];
    if (!f) throw new Error(`No pose frames for ${this.unit.id}`);
    return f;
  }

  hasSet(set: PoseSet): boolean {
    return this.sets.has(set);
  }

  /** Shows a pose for a while, then returns to idle/run. */
  pose(set: PoseSet, index: number, seconds: number): void {
    this.override = { set, index };
    this.overrideTween?.kill();
    this.overrideTween = gsap.delayedCall(seconds, () => {
      this.override = null;
    });
  }

  /** Mouth / weapon tip in world coordinates (for spit puffs, arrows, wand bubbles). */
  muzzle(forward = 0.22, up = 0.55): { x: number; y: number } {
    const s = this.root.scale.x;
    return { x: this.root.x + this.unit.facing * this.height * forward * s, y: this.root.y - this.height * up * s };
  }

  chest(): { x: number; y: number } {
    return { x: this.root.x, y: this.root.y - this.height * 0.45 * this.root.scale.y };
  }

  update(dt: number, time: number): void {
    if (this.gone) return;
    const u = this.unit;
    if (!this.scripted && u.hp > 0) {
      const follow = Math.min(1, dt * FOLLOW_RATE);
      this.root.x += (u.x - this.root.x) * follow;
      this.root.y += (u.y - this.root.y) * follow;
    }
    this.root.zIndex = this.root.y;
    this.root.scale.set(depthScale(this.root.y));

    const isHero = u.side === 'hero';
    const defaultIndex = u.hp <= 0 ? (isHero ? 5 : 3) : u.moving ? 1 : 0;
    const f = this.override ? this.frame(this.override.set, this.override.index) : this.frame('pose', defaultIndex);
    this.sprite.texture = f.texture;
    this.sprite.scale.set(f.scale * u.facing * this.nativeFacing, f.scale);

    if (u.hp <= 0) return;
    const t = time * 12 + this.phase;
    if (u.moving && !this.override) {
      this.sprite.y = -Math.abs(Math.sin(t)) * 4;
      this.body.scale.set(1, 1);
    } else {
      this.sprite.y = 0;
      const breathe = Math.sin(time * 4 + this.phase) * 0.03;
      this.body.scale.set(1 - breathe * 0.6, 1 + breathe);
    }
    this.refreshStatus();
  }

  drawHp(): void {
    const u = this.unit;
    const w = u.isBoss ? 110 : 34;
    const ratio = Math.max(0, u.hp / u.stats.maxHp);
    const color = u.side === 'hero' ? 0x4cd964 : 0xff4d5e;
    this.hpBar
      .clear()
      .roundRect(-w / 2 - 1, -1, w + 2, u.isBoss ? 9 : 6, 3)
      .fill({ color: 0x2a1633, alpha: 0.85 })
      .roundRect(-w / 2, 0, w * ratio, u.isBoss ? 7 : 4, 2)
      .fill(color);
  }

  /** Brief red flash + knock back. */
  flinch(strength: number): void {
    this.sprite.tint = 0xff9a9a;
    gsap.delayedCall(0.09, () => {
      if (!this.sprite.destroyed && this.unit.hp > 0) this.sprite.tint = this.baseTint;
    });
    const push = -this.unit.facing * strength;
    gsap.timeline().to(this.body, { x: push, duration: 0.05 }).to(this.body, { x: 0, duration: 0.25, ease: 'bounce.out' });
    if (this.unit.side === 'enemy' && !this.override) this.pose('pose', this.unit.isBoss ? 4 : 3, 0.18);
    else if (this.unit.side === 'hero' && !this.override) this.pose('pose', 5, 0.15);
  }

  /** Trap inside a bubble (stays until the sim's stun ends). */
  trapInBubble(): void {
    if (this.bubble || this.gone) return;
    this.bubble = statusLoop(this.body, 'vfx/bubble-prison', -this.height * 0.42, this.height * 1.25, 'center');
    gsap.to(this.body, { y: -12, duration: 0.3, ease: 'power2.out' });
  }

  /** Moonlit Lullaby: Zzz over the head until the sim wakes it up. */
  fallAsleep(): void {
    if (this.sleepy || this.gone) return;
    this.sleepy = statusLoop(this.root, 'vfx/status-sleepy', -this.height * 0.85, 30);
  }

  /** Grandma's Knitted Scarf: back on its feet. */
  revive(): void {
    this.sprite.tint = 0xffffff;
    this.body.alpha = 1;
    this.body.rotation = 0;
  }

  makeSticky(): void {
    if (this.sticky || this.gone) return;
    this.sticky = statusLoop(this.root, 'vfx/status-sticky', 6, this.height * 0.45);
    this.root.setChildIndex(this.sticky, 0);
  }

  /** Removes overlays whose sim status has ended (the bubble pops). */
  private refreshStatus(): void {
    if (this.bubble && this.unit.stunMs <= 0) {
      const pop = this.root.parent;
      const at = this.chest();
      this.bubble.destroy();
      this.bubble = null;
      gsap.to(this.body, { y: 0, duration: 0.25, ease: 'bounce.out' });
      if (pop) playFx(pop, 'vfx/bubble-prison-burst', at.x, at.y, { size: this.height * 1.3, anchor: 'center', frameTime: 0.07 });
    }
    if (this.sleepy && this.unit.stunMs <= 0) {
      this.sleepy.destroy();
      this.sleepy = null;
    }
    if (this.sticky && this.unit.slowMs <= 0) {
      this.sticky.destroy();
      this.sticky = null;
    }
  }

  private get baseTint(): number {
    return this.unit.enraged ? ENRAGED_TINT : 0xffffff;
  }

  /** Giant boss berserk: red tint and flames at its feet for the rest of the fight. */
  enrage(): void {
    if (this.gone) return;
    this.sprite.tint = ENRAGED_TINT;
    this.pose('pose', 1, 1.1);
    for (const side of [-1, 1]) {
      const flame = statusLoop(this.root, 'vfx/status-burn', 4, this.height * 0.28);
      flame.x = side * this.height * 0.22;
    }
  }

  faint(): void {
    this.sprite.tint = 0x9a9aaa;
    this.override = null;
    gsap.to(this.body, { alpha: 0.7, duration: 0.3 });
    statusLoop(this.root, 'vfx/status-sleepy', -this.height * 0.75, 34);
  }

  destroy(): void {
    this.gone = true;
    this.overrideTween?.kill();
    if (this.root.destroyed) return;
    // stop anything still animating this unit (leaps, knockbacks, bonk flights) before its display objects go away
    gsap.killTweensOf([this.root, this.root.scale, this.body, this.body.scale, this.sprite, this.sprite.scale]);
    this.root.destroy({ children: true });
  }
}
