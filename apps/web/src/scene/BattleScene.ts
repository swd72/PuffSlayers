import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import type { BattleEvent, BattleState, HeroClass, MealReaction, Unit } from '@puff/sim';
import { REACTION_LABEL } from '../meta/itemInfo';
import { BACKGROUND, CLASS_COLOR } from '../assets';
import type { Sfx } from '../audio/sfx';
import { ActorView } from './actor';
import { ScreenFilters, afterglow, converge, glowFlare, risingMotes, screenFlash, type ScreenRect } from './anime';
import type { SceneApi } from './api';
import { floatNumber, playFx, ring, shake } from './fx';
import { basicAttack, bossSlam, bossSummon, bossTelegraph, cheekCannon, healToss } from './skills';
import { castFlourish } from './signature';
import { playUltimate } from './ultimates';

/** Design space: the battlefield is laid out in 540×960; extra screen area just shows more background. */
export const VIEW = { width: 540, height: 960 } as const;
/** after an ultimate the caster glows and its basic attacks hit with long slashes for this long */
const EMPOWER_SECONDS = 5;

/** Renderer size that keeps the whole design space visible and fills any screen aspect. */
export function fitView(screenWidth: number, screenHeight: number): { width: number; height: number } {
  const aspect = screenWidth / Math.max(1, screenHeight);
  const design = VIEW.width / VIEW.height;
  return aspect <= design
    ? { width: VIEW.width, height: Math.round(VIEW.width / aspect) }
    : { width: Math.round(VIEW.height * aspect), height: VIEW.height };
}

const HIT_DELAY = 0.12;
/** the finisher of an ultimate combo counts this many ordinary hits */
const FINISHER_WEIGHT = 2.5;

/** Splits a total into whole-number hits; the last (finisher) gets the biggest share and any rounding. */
export function splitAmount(total: number, hits: number): number[] {
  if (hits <= 1) return [total];
  const unit = total / (hits - 1 + FINISHER_WEIGHT);
  // tiny totals (unit < 1) all go to the finisher; the empty hits show no number
  const small = Array.from({ length: hits - 1 }, () => Math.floor(unit));
  const used = small.reduce((s, n) => s + n, 0);
  return [...small, Math.max(0, total - used)];
}

export interface SceneHooks {
  /** a hero starts an ultimate cut-in lasting castMs of game time */
  onUltimateCast(heroId: string, heroClass: HeroClass, castMs: number): void;
  onPetals(amount: number): void;
  onHitstop(ms: number): void;
  /** big centered announcement (BOSS!, ENRAGED!) */
  onBanner(text: string): void;
}

export class BattleScene {
  /** positioned so the 540×960 design space sits centered on screen */
  private readonly root = new Container();
  /** shaken and filtered as a whole */
  readonly world = new Container();
  /** camera container around the world (kept at 1x: the zoom-in was dropped, the fight moves too fast for it) */
  private readonly camera = new Container();
  private readonly bg = new Sprite(Texture.from(BACKGROUND));
  private screen: ScreenRect = { x: 0, y: 0, width: VIEW.width, height: VIEW.height };
  private readonly ground = new Container();
  private readonly dimmer = new Graphics();
  private readonly field = new Container();
  private readonly fx = new Container();
  private readonly overlay = new Container();
  private readonly filters: ScreenFilters;
  private readonly actors = new Map<string, ActorView>();
  // per event batch: when each hit lands (seconds), so numbers pop on impact
  private readonly hitAt = new Map<string, number>();
  /** ultimate hit moments per target (several per combo) */
  private readonly impactAt = new Map<string, number[]>();
  private readonly lastHit = new Map<string, number>();
  private time = 0;
  private size: { width: number; height: number } = { width: VIEW.width, height: VIEW.height };

  constructor(
    stage: Container,
    private readonly hooks: SceneHooks,
    private readonly sfx: Sfx,
  ) {
    this.dimmer.alpha = 0;
    for (const layer of [this.ground, this.field, this.fx]) layer.sortableChildren = true;
    this.world.addChild(this.bg, this.ground, this.dimmer, this.field, this.fx);
    this.camera.addChild(this.world);
    this.root.addChild(this.camera, this.overlay);
    stage.addChild(this.root);
    this.filters = new ScreenFilters(this.world);
    this.resize(VIEW.width, VIEW.height);
  }

  /** Call with the renderer size from fitView(); centers the field and stretches the backdrop. */
  resize(rendererWidth: number, rendererHeight: number): void {
    this.size = { width: rendererWidth, height: rendererHeight };
    const ox = (rendererWidth - VIEW.width) / 2;
    const oy = (rendererHeight - VIEW.height) / 2;
    this.root.position.set(ox, oy);
    this.screen = { x: -ox, y: -oy, width: rendererWidth, height: rendererHeight };
    const tex = this.bg.texture;
    const cover = Math.max(rendererWidth / tex.width, rendererHeight / tex.height);
    this.bg.scale.set(cover);
    this.bg.position.set((VIEW.width - tex.width * cover) / 2, (VIEW.height - tex.height * cover) / 2);
    this.dimmer.clear().rect(this.screen.x, this.screen.y, rendererWidth, rendererHeight).fill(0x0b0614);
    this.filters.setArea(this.screen);
  }

  setBackground(url: string): void {
    this.bg.texture = Texture.from(url);
    this.resize(this.size.width, this.size.height);
  }

  private get api(): SceneApi {
    return {
      ground: this.ground,
      field: this.field,
      fx: this.fx,
      overlay: this.overlay,
      filters: this.filters,
      screen: this.screen,
      actor: (id) => {
        const a = this.actors.get(id);
        return a && !a.gone ? a : undefined;
      },
      team: (side) => [...this.actors.values()].filter((a) => !a.gone && a.unit.side === side),
      dim: (seconds) => {
        gsap.killTweensOf(this.dimmer);
        gsap.timeline().to(this.dimmer, { alpha: 0.55, duration: 0.12 }).to(this.dimmer, { alpha: 0, duration: 0.35 }, seconds);
      },
      shake: (strength) => shake(this.world, strength),
      hitstop: (ms) => this.hooks.onHitstop(ms),
      sound: (name) => this.sfx.play(name),
    };
  }

  /** Creates views for new units and hands every view its latest sim data. */
  sync(state: BattleState): void {
    for (const unit of state.units) {
      const actor = this.actors.get(unit.id);
      if (actor) {
        if (!actor.gone) actor.unit = unit;
      } else if (unit.hp > 0) {
        this.spawn(unit);
      }
    }
  }

  reset(): void {
    // effects still playing from the last fight point at views that are about to go: stop them all
    // (the game's own timers are created after reset, so they survive)
    gsap.exportRoot({}, true).kill();
    for (const actor of this.actors.values()) actor.destroy();
    this.actors.clear();
    for (const layer of [this.ground, this.fx, this.overlay]) for (const child of layer.removeChildren()) child.destroy({ children: true });
    this.filters.clear();
    this.dimmer.alpha = 0;
    this.world.position.set(0, 0);
    this.world.scale.set(1);
    this.cameraHome(0);
  }

  /** Camera back to the whole field (0 = snap). */
  private cameraHome(seconds: number): void {
    const cam = this.camera;
    gsap.killTweensOf(cam.pivot);
    gsap.killTweensOf(cam.position);
    gsap.killTweensOf(cam.scale);
    if (seconds <= 0) {
      cam.pivot.set(0, 0);
      cam.position.set(0, 0);
      cam.scale.set(1);
      return;
    }
    const ease = 'back.out(1.6)';
    gsap.to(cam.pivot, { x: 0, y: 0, duration: seconds, ease });
    gsap.to(cam.position, { x: 0, y: 0, duration: seconds, ease });
    gsap.to(cam.scale, { x: 1, y: 1, duration: seconds, ease });
  }

  update(deltaSeconds: number): void {
    this.time += deltaSeconds;
    for (const actor of this.actors.values()) actor.update(deltaSeconds, this.time);
  }

  handle(events: readonly BattleEvent[]): void {
    for (const event of events) this.handleOne(event);
    this.hitAt.clear();
    this.impactAt.clear();
    this.lastHit.clear();
  }

  private handleOne(ev: BattleEvent): void {
    const api = this.api;
    switch (ev.type) {
      case 'attack': {
        const src = api.actor(ev.source);
        const tgt = api.actor(ev.target);
        if (src && tgt) this.hitAt.set(`${ev.source}>${ev.target}`, basicAttack(api, src, tgt));
        return;
      }
      case 'cheekCannon': {
        const src = api.actor(ev.source);
        const targets = ev.targets.map((id) => api.actor(id)).filter((a): a is ActorView => !!a);
        if (!src) return;
        for (const [id, t] of cheekCannon(api, src, targets)) this.hitAt.set(`${ev.source}>${id}`, t);
        return;
      }
      case 'damage':
        return this.showDamage(ev.source, ev.target, ev.amount, ev.crit, ev.ultimate);
      case 'dodge': {
        const delay = this.hitAt.get(`${ev.source}>${ev.target}`) ?? HIT_DELAY;
        return this.later(ev.target, delay, (a) => {
          this.sfx.play('miss');
          floatNumber(this.fx, 'MISS', 'miss', a.root.x, a.root.y - a.height);
        });
      }
      case 'heal':
        return this.showHeal(ev.source, ev.target, ev.amount);
      case 'ultimateCast':
        return this.animateCast(ev.source, ev.heroClass, ev.castMs);
      case 'ultimate': {
        // 3 the skill fires
        const hits = playUltimate(api, ev);
        for (const [id, times] of hits) this.impactAt.set(id, times);
        // 4 afterwards: embers linger on the ground, and the caster stays empowered for a while
        const last = Math.max(0.3, ...[...hits.values()].flat());
        const color = CLASS_COLOR[ev.heroClass];
        gsap.delayedCall(last, () => afterglow(this.ground, this.fx, ev.at.x, ev.at.y, color));
        this.actors.get(ev.source)?.empower(color, last + EMPOWER_SECONDS);
        return;
      }
      case 'status':
        if (ev.status === 'sticky') this.later(ev.target, this.lastHit.get(ev.target) ?? HIT_DELAY, (a) => a.makeSticky());
        if (ev.status === 'rooted') this.later(ev.target, this.lastHit.get(ev.target) ?? HIT_DELAY, (a) => a.makeRooted());
        if (ev.status === 'sleepy') this.later(ev.target, 0.4, (a) => a.fallAsleep());
        return;
      case 'revive':
        return this.later(ev.target, (this.lastHit.get(ev.target) ?? HIT_DELAY) + 0.1, (a) => {
          a.revive();
          a.drawHp();
          floatNumber(this.fx, 'REVIVE!', 'heal', a.root.x, a.root.y - a.height);
          glowFlare(this.fx, a.root.x, a.root.y - a.height * 0.4, 0xffd6f0, a.height * 2, 0.8);
          risingMotes(this.fx, a.root.x, a.root.y, 0xffc2e2, 14);
          this.sfx.play('heal');
        });
      case 'summon':
        return bossSummon(api, api.actor(ev.source), ev.spawned.map((id) => api.actor(id)).filter((a): a is ActorView => !!a));
      case 'telegraph':
        return bossTelegraph(api, api.actor(ev.source), ev.at, ev.radius, ev.delayMs);
      case 'slam':
        return bossSlam(api, api.actor(ev.source), ev.at);
      case 'enrage':
        return this.animateEnrage(ev.source);
      case 'buff':
        return this.sfx.play('buff');
      case 'bonk':
        return this.animateBonk(ev.target, ev.petals);
      case 'faint':
        this.sfx.play('faint');
        return this.later(ev.target, this.lastHit.get(ev.target) ?? HIT_DELAY, (a) => a.faint());
      case 'victory':
        return this.sfx.play('victory');
      case 'defeat':
        return this.sfx.play('defeat');
    }
  }

  private spawn(unit: Unit): void {
    const actor = new ActorView(unit, this.field);
    this.actors.set(unit.id, actor);
    if (unit.heroClass) {
      actor.body.y = -260;
      gsap.to(actor.body, { y: 0, duration: 0.55, ease: 'bounce.out', delay: Math.random() * 0.3 });
    } else if (unit.isBoss) {
      this.hooks.onBanner(unit.isGiant ? 'GIANT BOSS!' : 'BOSS!');
      actor.body.scale.set(0.2);
      actor.pose('pose', 1, 1.2);
      gsap.to(actor.body.scale, { x: 1, y: 1, duration: 0.7, ease: 'back.out(2)' });
      gsap.delayedCall(0.5, () => {
        shake(this.world, 12);
        this.filters.shockwave(unit.x, unit.y, 22);
      });
    } else {
      actor.body.scale.set(0);
      ring(this.ground, 0xff9eb5, unit.x, unit.y, 24);
      gsap.to(actor.body.scale, { x: 1, y: 1, duration: 0.45, ease: 'back.out(3)', delay: Math.random() * 0.25 });
    }
  }

  private later(id: string, delay: number, fn: (actor: ActorView) => void): void {
    gsap.delayedCall(delay, () => {
      // a bonked unit is 'gone' but still shows its final hit until its view is destroyed
      const a = this.actors.get(id);
      if (a && !a.removed) fn(a);
    });
  }

  private showDamage(sourceId: string, targetId: string, amount: number, crit: boolean, ultimate: boolean): void {
    const src = this.actors.get(sourceId);
    const fromBossSlam = ultimate && src?.unit.isBoss;
    const combo = ultimate && !fromBossSlam ? this.impactAt.get(targetId) : undefined;
    if (combo?.length) return this.showCombo(targetId, amount, combo, 'damage');
    const delay = ultimate ? (fromBossSlam ? 0.03 : 0.2) : (this.hitAt.get(`${sourceId}>${targetId}`) ?? HIT_DELAY);
    this.lastHit.set(targetId, Math.max(delay, this.lastHit.get(targetId) ?? 0));
    this.later(targetId, delay, (a) => {
      if (!ultimate) this.sfx.play(crit ? 'crit' : 'hit');
      floatNumber(this.fx, amount.toLocaleString('en-US'), ultimate ? 'ultimate' : crit ? 'crit' : 'normal', a.root.x, a.root.y - a.height * a.root.scale.y);
      a.flinch(ultimate ? 10 : 4);
      a.drawHp();
      if (crit) {
        const c = a.chest();
        playFx(this.fx, 'vfx/hit-crit', c.x, c.y, { size: 54, anchor: 'center', frameTime: 0.05 });
        shake(this.world, 4);
      }
    });
  }

  private showHeal(sourceId: string, targetId: string, amount: number): void {
    const src = this.actors.get(sourceId);
    const tgt = this.actors.get(targetId);
    const combo = this.impactAt.get(targetId);
    if (combo?.length) return this.showCombo(targetId, amount, combo, 'heal');
    const delay = src && tgt && !src.gone && !tgt.gone ? healToss(this.api, src, tgt) : 0.1;
    this.later(targetId, delay, (a) => {
      this.sfx.play('heal');
      floatNumber(this.fx, `+${amount}`, 'heal', a.root.x, a.root.y - a.height * a.root.scale.y);
      a.drawHp();
    });
  }

  /**
   * An ultimate lands as a combo: the sim's single number is split across the hit moments,
   * the finisher carrying the biggest share, and the HP bar steps down (or up) with each hit.
   */
  private showCombo(targetId: string, amount: number, times: readonly number[], kind: 'damage' | 'heal'): void {
    const chunks = splitAmount(amount, times.length);
    const last = times.length - 1;
    this.lastHit.set(targetId, Math.max(times[last] ?? 0, this.lastHit.get(targetId) ?? 0));
    times.forEach((when, i) => {
      const rest = chunks.slice(i + 1).reduce((s, n) => s + n, 0);
      this.later(targetId, when, (a) => {
        const y = a.root.y - a.height * a.root.scale.y - (i % 2) * 10;
        const x = a.root.x + ((i % 3) - 1) * 10;
        if (kind === 'heal') {
          if (i === last) this.sfx.play('heal');
          if (chunks[i]) floatNumber(this.fx, `+${chunks[i]}`, 'heal', x, y);
          a.drawHp(Math.max(0, a.unit.hp - rest));
          return;
        }
        if (i < last) this.sfx.play('hit');
        if (chunks[i]) floatNumber(this.fx, (chunks[i] ?? 0).toLocaleString('en-US'), i === last ? 'ultimate' : 'crit', x, y);
        a.flinch(i === last ? 12 : 5);
        a.drawHp(Math.min(a.unit.stats.maxHp, a.unit.hp + rest));
      });
    });
  }

  /** Pre-stage picnic: each puff shows how its meal went (yum, favorite, won't eat, tummy ache). */
  showMeals(meals: readonly { heroId: string; effect: { reaction: MealReaction } }[]): void {
    meals.forEach((meal, i) => {
      gsap.delayedCall(i * 0.12, () => {
        const a = this.actors.get(meal.heroId);
        if (!a || a.gone) return;
        const { reaction } = meal.effect;
        const kind = reaction === 'tummyache' ? 'crit' : reaction === 'refuse' ? 'miss' : 'heal';
        floatNumber(this.fx, REACTION_LABEL[reaction], kind, a.root.x, a.root.y - a.height - 8);
        if (reaction === 'tummyache') {
          risingMotes(this.fx, a.root.x, a.root.y, 0x9be27a, 8);
          a.flinch(4);
          this.sfx.play('faint');
        } else if (reaction !== 'refuse') {
          risingMotes(this.fx, a.root.x, a.root.y, reaction === 'favorite' ? 0xff9ec8 : 0xfff0b0, reaction === 'favorite' ? 12 : 6);
          this.sfx.play('heal');
        }
      });
    });
  }

  /** Cut-in phase: the field dims and the caster powers up; the skill itself comes after. */
  private animateCast(sourceId: string, heroClass: HeroClass, castMs: number): void {
    const src = this.actors.get(sourceId);
    if (!src) return;
    const seconds = castMs / 1000;
    this.hooks.onUltimateCast(sourceId, heroClass, castMs);
    this.sfx.play('cast');
    this.api.dim(seconds - 0.1);
    src.pose('pose', 4, seconds);
    const color = CLASS_COLOR[heroClass];
    // 1 power gathers into the caster (no camera zoom: the fight moves too fast for it)
    glowFlare(this.fx, src.root.x, src.root.y - src.height * 0.4, color, src.height * 2.4, seconds);
    ring(this.ground, color, src.root.x, src.root.y, src.height * 0.7);
    risingMotes(this.fx, src.root.x, src.root.y, color, 12);
    converge(this.fx, src.root.x, src.root.y - src.height * 0.45, color, seconds * 0.6);
    castFlourish(this.api, src, heroClass, color, seconds);
    // 2 a soft flash as the power peaks, right before the skill fires
    gsap.delayedCall(seconds * 0.8, () => screenFlash(this.overlay, this.screen, 0xffffff, 0.22));
  }

  private animateEnrage(bossId: string): void {
    const boss = this.actors.get(bossId);
    if (!boss) return;
    boss.enrage();
    this.hooks.onBanner('ENRAGED!');
    this.sfx.play('cast');
    const c = boss.chest();
    glowFlare(this.fx, c.x, c.y, 0xff4a2a, boss.height * 2, 0.9);
    this.filters.shockwave(c.x, c.y, 34);
    this.api.dim(0.8);
    shake(this.world, 18);
  }

  private animateBonk(targetId: string, petalCount: number): void {
    const actor = this.actors.get(targetId);
    if (!actor) return;
    actor.gone = true;
    const delay = (this.lastHit.get(targetId) ?? HIT_DELAY) + 0.05;
    gsap.delayedCall(delay, () => {
      // a long combo can finish after the stage has already been cleared and the scene reset
      // (the Petals still count — only the animation is skipped)
      if (actor.removed) return this.hooks.onPetals(petalCount);
      const c = actor.chest();
      playFx(this.fx, 'vfx/bonk-petals', c.x, c.y + actor.height * 0.3, { size: actor.unit.isBoss ? 200 : 80, anchor: 'center', frameTime: 0.08 });
      this.hooks.onPetals(petalCount);
      this.sfx.play('bonk');
      if (actor.unit.isBoss) {
        actor.pose('pose', 5, 3);
        shake(this.world, 16);
        this.filters.shockwave(c.x, c.y, 30);
        gsap.to(actor.root, { alpha: 0, duration: 1.2, delay: 0.8, onComplete: () => actor.destroy() });
        return;
      }
      const away = c.x < VIEW.width / 2 ? -1 : 1;
      gsap
        .timeline({ onComplete: () => actor.destroy() })
        .to(actor.body.scale, { x: 1.3, y: 0.55, duration: 0.1 })
        .to(actor.root, { y: actor.root.y - 44, x: actor.root.x + away * 32, alpha: 0, duration: 0.5, ease: 'power2.out' })
        .to(actor.body, { rotation: 2.5 * away, duration: 0.5 }, '<');
    });
  }
}
